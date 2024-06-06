/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.apache.camel.karavan.model;

import java.util.List;

public class DockerComposeHealthCheck {

    private String interval;
    private Integer retries;
    private String timeout;
    private String start_period;
    private List<String> test;

    public DockerComposeHealthCheck() {
    }

    public String getInterval() {
        return interval;
    }

    public void setInterval(String interval) {
        this.interval = interval;
    }

    public Integer getRetries() {
        return retries;
    }

    public void setRetries(Integer retries) {
        this.retries = retries;
    }

    public String getTimeout() {
        return timeout;
    }

    public void setTimeout(String timeout) {
        this.timeout = timeout;
    }

    public List<String> getTest() {
        return test;
    }

    public void setTest(List<String> test) {
        this.test = test;
    }

    public String getStart_period() {
        return start_period;
    }

    public void setStart_period(String start_period) {
        this.start_period = start_period;
    }

    @Override
    public String toString() {
        return "HealthCheckConfig{" +
                "interval='" + interval + '\'' +
                ", retries=" + retries +
                ", timeout='" + timeout + '\'' +
                ", start_period='" + start_period + '\'' +
                ", test=" + test +
                '}';
    }
}
