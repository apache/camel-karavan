package org.apache.camel.karavan.model;

import java.util.List;

public class GitRepo {
    private String name;
    private String commitId;
    private Long lastCommitTimestamp;
    private List<GitRepoFile> files;

    public GitRepo(String name, String commitId, Long lastCommitTimestamp, List<GitRepoFile> files) {
        this.name = name;
        this.commitId = commitId;
        this.lastCommitTimestamp = lastCommitTimestamp;
        this.files = files;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCommitId() {
        return commitId;
    }

    public void setCommitId(String commitId) {
        this.commitId = commitId;
    }

    public Long getLastCommitTimestamp() {
        return lastCommitTimestamp;
    }

    public void setLastCommitTimestamp(Long lastCommitTimestamp) {
        this.lastCommitTimestamp = lastCommitTimestamp;
    }

    public List<GitRepoFile> getFiles() {
        return files;
    }

    public void setFiles(List<GitRepoFile> files) {
        this.files = files;
    }
}
