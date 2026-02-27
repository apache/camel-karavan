package org.apache.camel.karavan.model;

public record PathCommitDetails(String projectId, String fileName, String commitId, Long commitTime, String content, boolean isFolder) { }
