package org.apache.camel.karavan.model;

import java.util.List;

public class CommitInfo {
    private String commitId;
    private Integer time;
    private List<GitRepo> repos;

    public CommitInfo(String commitId, Integer time) {
        this.commitId = commitId;
        this.time = time;
    }

    public CommitInfo(String commitId, Integer time, List<GitRepo> repos) {
        this.commitId = commitId;
        this.time = time;
        this.repos = repos;
    }

    public String getCommitId() {
        return commitId;
    }

    public void setCommitId(String commitId) {
        this.commitId = commitId;
    }

    public Integer getTime() {
        return time;
    }

    public void setTime(Integer time) {
        this.time = time;
    }

    public List<GitRepo> getRepos() {
        return repos;
    }

    public void setRepos(List<GitRepo> repos) {
        this.repos = repos;
    }

    @Override
    public String toString() {
        return "CommitInfo{" +
                "commitId='" + commitId + '\'' +
                ", time=" + time +
                ", repos=" + repos +
                '}';
    }
}
