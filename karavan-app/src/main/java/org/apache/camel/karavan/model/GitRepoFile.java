package org.apache.camel.karavan.model;

public class GitRepoFile {
    private String name;
    private Long lastCommitTimestamp;
    private String body;

    public GitRepoFile(String name, Long lastCommitTimestamp, String body) {
        this.name = name;
        this.lastCommitTimestamp = lastCommitTimestamp;
        this.body = body;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getLastCommitTimestamp() {
        return lastCommitTimestamp;
    }

    public void setLastCommitTimestamp(Long lastCommitTimestamp) {
        this.lastCommitTimestamp = lastCommitTimestamp;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }
}
