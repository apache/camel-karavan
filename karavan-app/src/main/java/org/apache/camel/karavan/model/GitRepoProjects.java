package org.apache.camel.karavan.model;

public class GitRepoProjects {
    private String projectId;
    private String lastCommit;
    private Long lastCommitTimestamp;
    private String filename;
    private String fileCode;
    private Long fileLastUpdate;

    public GitRepoProjects(String projectId, String lastCommit, Long lastCommitTimestamp, String filename, String fileCode, Long fileLastUpdate) {
        this.projectId = projectId;
        this.lastCommit = lastCommit;
        this.lastCommitTimestamp = lastCommitTimestamp;
        this.filename = filename;
        this.fileCode = fileCode;
        this.fileLastUpdate = fileLastUpdate;
    }

    public String getProjectId() {
        return projectId;
    }

    public String getLastCommit() {
        return lastCommit;
    }

    public Long getLastCommitTimestamp() {
        return lastCommitTimestamp;
    }

    public String getFilename() {
        return filename;
    }

    public String getFileCode() {
        return fileCode;
    }

    public Long getFileLastUpdate() {
        return fileLastUpdate;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public void setLastCommit(String lastCommit) {
        this.lastCommit = lastCommit;
    }

    public void setLastCommitTimestamp(Long lastCommitTimestamp) {
        this.lastCommitTimestamp = lastCommitTimestamp;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public void setFileCode(String fileCode) {
        this.fileCode = fileCode;
    }

    public void setFileLastUpdate(Long fileLastUpdate) {
        this.fileLastUpdate = fileLastUpdate;
    }

}
