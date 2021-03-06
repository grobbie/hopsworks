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
package io.hops.hopsworks.common.util.templates;

import java.io.File;

/**
 * Replacement policy for configuration templates that appends the new value to the end of the old separated by a
 * white-space character.
 */
public class AppendConfigReplacementPolicy implements ConfigReplacementPolicy {
  
  private Delimiter delimiter;
  
  public AppendConfigReplacementPolicy(Delimiter delimiter) {
    this.delimiter = delimiter;
  }
  
  @Override
  public String replace(String originalValue, String userValue) {
    //Check if the property is related to classpath setting and set the path separator
    return originalValue + delimiter.getValue() + userValue;
  }
  
  /**
   * Delimiter when appending user defined spark properties. For properties related to classpaths, we need
   * to change the value to the path separator.
   */
  public enum Delimiter {
    
    SPACE(" "),
    PATH_SEPARATOR(File.pathSeparator),
    COMMA(",");
    
    private String value;
    
    Delimiter(String value) {
      this.value = value;
    }
    
    public String getValue() {
      return value;
    }
    
    public void setValue(String value) {
      this.value = value;
    }
  }
}
