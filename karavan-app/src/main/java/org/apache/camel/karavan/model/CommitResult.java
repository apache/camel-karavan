package org.apache.camel.karavan.model;

import org.apache.camel.karavan.cache.ProjectFolder;
import org.eclipse.jgit.transport.RemoteRefUpdate;

import java.util.List;

public record CommitResult (ProjectFolder projectFolder, List<RemoteRefUpdate.Status> statuses, List<String> messages, String commitId, Long commitTime) {}

