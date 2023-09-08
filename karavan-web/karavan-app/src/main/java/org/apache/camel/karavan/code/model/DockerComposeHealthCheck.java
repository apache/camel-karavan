package org.apache.camel.karavan.code.model;

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
