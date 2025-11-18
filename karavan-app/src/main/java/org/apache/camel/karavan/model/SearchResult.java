package org.apache.camel.karavan.model;

import java.util.ArrayList;
import java.util.List;

public class SearchResult {
    private String projectId = "";
    private List<String> files = new ArrayList<>();

    public SearchResult() {}

    public SearchResult(String projectId, List<String> files) {
        this.projectId = projectId;
        this.files = files;
    }

    // Getters and Setters
    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public List<String> getFiles() {
        return files;
    }

    public void setFiles(List<String> files) {
        this.files = files;
    }
}
