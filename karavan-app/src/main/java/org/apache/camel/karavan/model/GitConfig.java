package org.apache.camel.karavan.model;

public class GitConfig {
    private String uri;
    private String username;
    private String password;
    private String branch;

    public GitConfig(String uri, String username, String password, String branch) {
        this.uri = uri;
        this.username = username;
        this.password = password;
        this.branch = branch;
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

    public String getBranch() {
        return branch;
    }

    public void setBranch(String branch) {
        this.branch = branch;
    }

}
