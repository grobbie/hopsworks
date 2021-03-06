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

package io.hops.hopsworks.common.dao.zeppelin;

import io.hops.hopsworks.common.dao.AbstractFacade;
import io.hops.hopsworks.common.dao.project.Project;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.PersistenceContext;
import javax.persistence.TypedQuery;

@Stateless
public class ZeppelinInterpreterConfFacade extends AbstractFacade<ZeppelinInterpreterConfs> {

  @PersistenceContext(unitName = "kthfsPU")
  private EntityManager em;

  @Override
  protected EntityManager getEntityManager() {
    return em;
  }

  public ZeppelinInterpreterConfFacade() {
    super(ZeppelinInterpreterConfs.class);
  }

  public ZeppelinInterpreterConfs findByProject(Project project) {
    TypedQuery<ZeppelinInterpreterConfs> query = em.createNamedQuery("ZeppelinInterpreterConfs.findByProject",
            ZeppelinInterpreterConfs.class);
    query.setParameter("projectId", project);
    try {
      return query.getSingleResult();
    } catch (NoResultException e) {
      return null;
    }
  }

  public ZeppelinInterpreterConfs create(Project project, String intrepeterConf) {
    if (project == null || intrepeterConf == null) {
      throw new NullPointerException("project and config must be non-null.");
    }
    ZeppelinInterpreterConfs conf = findByProject(project);
    if (conf == null) {
      conf = new ZeppelinInterpreterConfs(project, intrepeterConf);
      em.persist(conf);
    } else {
      conf.setInterpreterConf(intrepeterConf);
      em.merge(conf);
    }
    em.flush();
    return conf;
  }
}
