package org.apache.camel.karavan.model;

public class PodEvent {

    private String id;
    private String containerName;
    private String reason;
    private String note;
    private String creationTimestamp;

    public PodEvent() {
    }

    public PodEvent(String id, String containerName, String reason, String note, String creationTimestamp) {
        this.id = id;
        this.containerName = containerName;
        this.reason = reason;
        this.note = note;
        this.creationTimestamp = creationTimestamp;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getContainerName() {
        return containerName;
    }

    public void setContainerName(String containerName) {
        this.containerName = containerName;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getCreationTimestamp() {
        return creationTimestamp;
    }

    public void setCreationTimestamp(String creationTimestamp) {
        this.creationTimestamp = creationTimestamp;
    }
}