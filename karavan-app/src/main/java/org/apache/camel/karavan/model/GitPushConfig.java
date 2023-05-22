package org.apache.camel.karavan.model;

public class GitPushConfig {
    private String userName;
    private String commitMessage;
    private String repoUri;
    private String branch;
    private String userEmail;

    public GitPushConfig(String userName, String commitMessage, String repoUri, String branch, String userEmail) {
        this.userName = userName;
        this.commitMessage = commitMessage;
        this.repoUri = repoUri;
        this.branch = branch;
        this.userEmail = userEmail;
    }

    public String getUsername() {
        return userName;
    }

    public void setUsername(String username) {
        this.userName = userName;
    }

    public String getCommitMessage() {
        return commitMessage;
    }

    public void setCommitMessage(String commitMessage) {
        this.commitMessage = commitMessage;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.commitMessage = userEmail;
    }
    public String getUri() {
        return repoUri;
    }

    public void setUri(String uri) {
        this.repoUri = repoUri;
    }

    public String getBranch() {
        return branch;
    }

    public void setBranch(String branch) {
        this.branch = branch;
    }
}
