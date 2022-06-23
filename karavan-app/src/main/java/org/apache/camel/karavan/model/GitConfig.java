package org.apache.camel.karavan.model;

public class GitConfig {
    private String uri;
    private String username;
    private String password;
    private String mainBranch;

    public GitConfig(String uri, String username, String password, String mainBranch) {
        this.uri = uri;
        this.username = username;
        this.password = password;
        this.mainBranch = mainBranch;
    }

    public String getUri() {
        return uri;
    }

    public void setUri(String uri) {
        this.uri = uri;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getMainBranch() {
        return mainBranch;
    }

    public void setMainBranch(String mainBranch) {
        this.mainBranch = mainBranch;
    }
}
