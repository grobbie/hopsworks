/*
 * Copyright (C) 2013 - 2018, Logical Clocks AB and RISE SICS AB. All rights reserved
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software, and to permit
 * persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS  OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL  THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR  OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

/**
 * Controller for the kafka page.
 */

'use strict';

angular.module('hopsWorksApp')
        .controller('KafkaCtrl', ['$routeParams', 'growl',
        'KafkaService', '$location', 'ModalService', '$interval',
        '$mdSidenav', 'TourService', 'ProjectService',
          function ($routeParams, growl, KafkaService, $location,
          ModalService, $interval, $mdSidenav, TourService, ProjectService) {

            var self = this;
            self.projectId = $routeParams.projectID;
            self.topics = [];
            self.sharedTopics = [];
            self.topicDetails = {};
            self.maxNumTopics = 100;
            self.numTopicsUsed = 0;

            self.currentTopic = "";
            self.topicName = "";
            self.numReplicas = "";
            self.numPartitions = "";
            self.projectName = "";
            self.projectIsGuide = false;
            self.userEmail = "";
            self.permission_type = "Allow";
            self.operation_type = "Read";
            self.host = "*";
            self.role = "*";
           // self.activeId = -1;
            self.selectedProjectName="";
            
            self.users =[];
            self.project;
           
            self.showTopics = 1;
            self.showSchemas = -1;
            self.schemas = [];
            self.schemaVersions = [];
           self.tourService = TourService;

            self.selectAcl = function (acl, topicName) {
              if (self.activeId === acl.id) { 
                return;
              }
              self.projectName = acl.projectName;
              self.userEmail = acl.userEmail;
              self.permission_type = acl.permission_type;
              self.operation_type = acl.operation_type;
              self.host = acl.host;
              self.role = acl.role;
              self.activeId = acl.id;
              
              KafkaService.aclUsers(self.projectId, topicName).then(
                    function (success) {
                        self.users = success.data;
                }, function (error) {
                    growl.error(error.data.errorMsg, {title: 'Could not load ACL users', ttl: 5000, referenceId: 10});
                   });
              
            };

            self.updateAcl = function (topicName, aclId){
              var acl ={};
              acl.projectName = self.project.projectName;
              acl.role = self.role;
              acl.userEmail = self.userEmail;
              acl.permissionType = self.permission_type;
              acl.operationType = self.operation_type;
              acl.host = self.host;
                KafkaService.updateTopicAcl(self.projectId, topicName, aclId, acl).then(
                        function(success){
                            self.getAclsForTopic(topicName);
                        }, function(error){
                            growl.error(error.data.errorMsg, {title: 'Error', ttl: 5000});
                            
                        });
            };

            self.getAllTopics = function () {
              KafkaService.getTopics(self.projectId).then(
                      function (success) {
                        self.topics = success.data;
                        self.numTopicsUsed = self.topics.length;
                      }, function (error) {
                growl.error(error.data.errorMsg, {title: 'Error', ttl: 5000});
              });
            };

            self.getAllSharedTopics = function () {
              KafkaService.getSharedTopics(self.projectId).then(
                      function (success) {
                        self.sharedTopics = success.data;
                      }, function (error) {
                growl.error(error.data.errorMsg, {title: 'Error', ttl: 5000});
              });
            };

            self.getTopicDetails = function (topicName) {
                KafkaService.getTopicDetails(self.projectId, topicName).then(
                        function (success) {
                            for(var i =0;i<self.topics.length;i++){
                              if(self.topics[i].name === topicName){
                                  self.topics[i].partitionDetails= success.data;
                                  return;
                              }
                          }
                        }, function (error) {
                    growl.warning(error.data.errorMsg, {title: 'Warning', ttl: 5000, referenceId: 10});
               });
            };
            
            /**
             * Navigate to the new job page.
             * @returns {undefined}
             */
            self.createSchema = function () {
              ModalService.createSchema('lg', self.projectId,
                self.projectIsGuide).then(
                      function (success) {
                          growl.success(success.data.successMessage, {title: 'New schema added successfully.', ttl: 2000});
                          self.listSchemas();
                          if (self.projectIsGuide) {
                            self.tourService.currentStep_TourThree = 2;
                          }
                      }, function (error) {
                //The user changed their mind.
              });
            };

            self.listSchemas = function () {
                
                KafkaService.getSchemasForTopics(self.projectId).then(
                 function (success) {
                 self.schemas = success.data;
                 var size = self.schemas.length;
                for(var i =0; i<size;i++){
                    self.schemaVersions[i] = Math.max.apply(null, self.schemas[i].versions);
                }
                 }, function (error) {
                 growl.error(error.data.errorMsg, {title: 'Could not get schemas for topic', ttl: 5000, referenceId: 10});
                 });
            
                
            };
            
            self.deleteSchema = function(schemaName, index){
                
                if(!self.schemaVersions[index]>0){
                  growl.info("Delete aborted", {title: 'Schema version not selected', ttl: 2000});  
                    return;
                }
                 ModalService.confirm("sm", "Delete Schema (" + schemaName + ")",
                      "Do you really want to delete this Scehma? This action cannot be undone.")
                      .then(function (success) {
                          KafkaService.deleteSchema(self.projectId, schemaName, self.schemaVersions[index]).then(
                 function (success) {
                     self.listSchemas();
                 }, function (error) {
                 growl.error(error.data.errorMsg, {title: 'Schema is not removed', ttl: 5000, referenceId: 10});
                 });
                }, function (error) {
                    growl.info("Delete aborted", {title: 'Info', ttl: 2000});
                    });
            };
            
            self.viewSchemaContent = function(schemaName, index){
                
                if(!self.schemaVersions[index]>0){
                     growl.info("Please select schema version", {title: 'Schema version not selected', ttl: 2000});
                return;
                }
                
               ModalService.viewSchemaContent('lg', self.projectId, schemaName, self.schemaVersions[index]).then(
                      function (success) {
                         
                      }, function (error) {
                //The user changed their mind.
              });
            };
            
            self.updateSchemaContent = function(schema){
                
                //increment the version number
                self.version = Math.max.apply(null,schema.versions);
                
                 ModalService.updateSchemaContent('lg', self.projectId, schema.name, self.version).then(
                      function (success) {
                         self.listSchemas();
                      }, function (error) {
                //The user changed their mind.
              });
            };

            self.lala = function () {
              console.log("Step: " + self.tourService.currentStep_TourThree);
            };
            /**
             * Navigate to the new job page.
             * @returns {undefined}
             */
            self.createTopic = function () {
              ModalService.createTopic('lg', self.projectId, self.projectIsGuide)
              .then(
                      function (success) {
                          growl.success(success.data.successMessage, {title: 'New topic created successfully.', ttl: 2000});
                          self.getAllTopics();
                          if (self.projectIsGuide) {
                            self.tourService.currentStep_TourThree = 4;
                          }
                      }, function (error) {
                      growl.error(error.data.errorMsg, {title: 'Failure to create topic', ttl: 5000, referenceId: 10});
              });
              self.getAllTopics();

            };

            self.removeTopic = function (topicName) {
              ModalService.confirm("sm", "Delete Topic (" + topicName + ")",
                      "Do you really want to delete this topic? This action cannot be undone.")
                      .then(function (success) {
                        KafkaService.removeTopic(self.projectId, topicName).then(
                                function (success) {
                                  self.getAllTopics();
                                }, function (error) {
                          growl.error(error.data.errorMsg, {title: 'Failed to remove topic', ttl: 5000});
                        });
                      }, function (cancelled) {
                        growl.info("Delete aborted", {title: 'Info', ttl: 2000});
                      });
            };

            self.getAclsForTopic = function (topicName) {
              KafkaService.getAclsForTopic(self.projectId, topicName).then(
                      function (success) {
                          for(var i =0;i<self.topics.length;i++){
                              if(self.topics[i].name === topicName){
                                  self.topics[i].acls = success.data;
                                  return;
                              }
                          }
                        self.activeId = "";
                      }, function (error) {
                growl.error(error.data.errorMsg, {title: 'Failed to get ACLs for the topic', ttl: 5000});
              });
            };

            self.addAcl = function (topicName) {
                
                ModalService.createTopicAcl('lg', self.projectId, topicName).then(
                      function (success) {
                          growl.success(success.data.successMessage, {title: 'New acl added for the topic: '+topicName, ttl: 5000});
                          self.getAclsForTopic(topicName);
                      }, function (error) {
                //The user changed their mind.
              });
            };

            self.removeAcl = function (topicName, aclId) {
              KafkaService.removeTopicAcl(self.projectId, topicName, aclId).then(
                      function (success) {
                        self.getAclsForTopic(topicName);
                      }, function (error) {
                growl.error(error.data.errorMsg, {title: 'Failed to remove topic', ttl: 5000});
              });

            };
            
            self.shareTopic = function(topicName) {
              ModalService.selectProject('lg', true, self.projectId,
                      "Select a Project to share the topic with.").then(
                      function (success) {
                        var destProj = success.projectId;
                        KafkaService.shareTopic(self.projectId, topicName, destProj).then(
                                function (success) {
                                  self.topicIsSharedTo(topicName);
                                  growl.success(success.data.successMessage, {title: 'Topic shared successfully with project: ' + destProj.name, ttl: 5000});
                                }, function (error) {
                          growl.error(error.data.errorMsg, {title: 'Error', ttl: 5000});
                        });

                      }, function (error) {
                //The user changed their mind.
              });
            };
            
            //operation done from topic
            self.unshareTopic = function(topicName, project) {

                        KafkaService.unshareTopic(self.projectId, topicName, project.id).then(
                                function (success) {
                                  self.topicIsSharedTo(topicName);
                                  growl.success(success.data.successMessage, {title: 'Topic share removed (unshared) from project: ' + project.name, ttl: 2000});
                                }, function (error) {
                          growl.error(error.data.errorMsg, {title: 'Error', ttl: 5000});
                        });
            };
            
            //operation done from project
            self.unshareTopicFromProject =function (topicName){
                KafkaService.unshareTopicFromProject(self.projectId, topicName).then(
                        function (success) {
                                  self.getAllSharedTopics();
                                  growl.success(success.data.successMessage, {title: 'Topic share removed (unshared) from project:.', ttl: 2000});
                                }, function (error) {
                          growl.error(error.data.errorMsg, {title: 'Error', ttl: 5000});
                        });
            };
            
            self.topicIsSharedTo = function (topicName) {
                KafkaService.topicIsSharedTo(this.projectId, topicName).then(
                        function (success) {                         
                           for(var i =0;i<self.topics.length;i++){
                              if(self.topics[i].name === topicName){
                                  self.topics[i].shares=success.data;
                                  return;
                              }
                          }
                        }, function (error) {
                    growl.error(error.data.errorMsg, {title: 'Failed to get topic sharing information', ttl: 5000});
                });
            };

            self.init = function(){
              ProjectService.get({}, {'id': self.projectId}).$promise.then(
                function (success) {
                  var projectNameTour = success.projectName;
                  if (angular.equals(projectNameTour.substr(0, 5), 'demo_')) {
                    self.tourService.currentStep_TourThree = 0;
                    self.projectIsGuide = true;
                  }
                }, function (error) {
                  $location.path('/');
                }
              );

              self.getAllTopics();
              self.getAllSharedTopics();
             };
            
            self.init();

            self.showTopic = function(){
              if (self.projectIsGuide) {
                self.tourService.currentStep_TourThree = 3;
              }
              self.showSchemas = -1;
              self.showTopics = 1;
            };

            self.showSchema = function(){
              if (self.projectIsGuide) {
                self.tourService.currentStep_TourThree = 1;
              }
              self.showSchemas = 1;
              self.showTopics = -1;
              self.listSchemas();
            };
              
          }]);



