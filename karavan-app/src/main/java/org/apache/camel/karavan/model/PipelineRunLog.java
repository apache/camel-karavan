package org.apache.camel.karavan.model;

public class PipelineRunLog {
    private String task;
    private String log;

    public PipelineRunLog(String task, String log) {
        this.task = task;
        this.log = log;
    }

    public String getTask() {
        return task;
    }

    public void setTask(String task) {
        this.task = task;
    }

    public String getLog() {
        return log;
    }

    public void setLog(String log) {
        this.log = log;
    }
}
