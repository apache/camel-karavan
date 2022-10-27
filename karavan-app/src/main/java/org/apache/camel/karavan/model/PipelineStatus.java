package org.apache.camel.karavan.model;

import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

public class PipelineStatus {
    public static final String CACHE = "pipeline_statuses";
    @ProtoField(number = 1)
    String projectId;
    @ProtoField(number = 2)
    String pipelineName;
    @ProtoField(number = 3)
    String result;
    @ProtoField(number = 5)
    String startTime;
    @ProtoField(number = 6)
    String completionTime;
    @ProtoField(number = 7)
    String env;

    @ProtoFactory
    public PipelineStatus(String projectId, String pipelineName, String result, String startTime, String completionTime, String env) {
        this.projectId = projectId;
        this.pipelineName = pipelineName;
        this.result = result;
        this.startTime = startTime;
        this.completionTime = completionTime;
        this.env = env;
    }

    public PipelineStatus(String projectId, String env) {
        this.projectId = projectId;
        this.env = env;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getPipelineName() {
        return pipelineName;
    }

    public void setPipelineName(String pipelineName) {
        this.pipelineName = pipelineName;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getCompletionTime() {
        return completionTime;
    }

    public void setCompletionTime(String completionTime) {
        this.completionTime = completionTime;
    }

    public String getEnv() {
        return env;
    }

    public void setEnv(String env) {
        this.env = env;
    }
}
