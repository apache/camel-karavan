package org.apache.camel.karavan.service;

import io.vertx.core.Vertx;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import org.apache.camel.karavan.cache.KaravanCache;
import org.apache.camel.karavan.cache.ProjectFileCommitDiff;
import org.apache.camel.karavan.cache.ProjectFolderCommit;
import org.apache.camel.karavan.cache.SystemCommit;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.diff.DiffEntry;
import org.eclipse.jgit.diff.DiffFormatter;
import org.eclipse.jgit.diff.RawTextComparator;
import org.eclipse.jgit.errors.MissingObjectException;
import org.eclipse.jgit.lib.Constants;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.ObjectLoader;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.treewalk.AbstractTreeIterator;
import org.eclipse.jgit.treewalk.CanonicalTreeParser;
import org.eclipse.jgit.treewalk.EmptyTreeIterator;
import org.eclipse.jgit.util.io.DisabledOutputStream;
import org.eclipse.microprofile.context.ManagedExecutor;
import org.jboss.logging.Logger;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.StreamSupport;

@Singleton
public class GitHistoryService {

    private static final Logger LOGGER = Logger.getLogger(GitHistoryService.class.getName());

    @Inject
    ManagedExecutor managedExecutor;

    @Inject
    Vertx vertx;

    @Inject
    GitService gitService;

    @Inject
    KaravanCache karavanCache;

    public void importProjectCommits(String projectId) {
        LOGGER.info("Import commits for " + projectId);
        managedExecutor.runAsync(() -> {
            var commits = getProjectCommits(projectId, 10);
            karavanCache.saveProjectLastCommits(projectId, commits);
        });
    }

    public void importCommits() {
        LOGGER.info("Import commits for system");
        managedExecutor.runAsync(() -> {
            var commits = getCommits( 100);
            karavanCache.saveSystemCommits(commits);
        });
    }

    public List<SystemCommit> getCommits(int maxCount) {
        List<SystemCommit> result = new ArrayList<>();
        try {
            Git pollGit = gitService.getGit(true, vertx.fileSystem().createTempDirectoryBlocking("commits"));
            if (pollGit == null) return result;

            // Grab the repository reference to pass to our helper
            Repository repository = pollGit.getRepository();

            Iterable<RevCommit> commits = pollGit.log()
                    .setMaxCount(maxCount)
                    .all()
                    .call();

            StreamSupport.stream(commits.spliterator(), false)
                    .sorted(Comparator.comparingInt(RevCommit::getCommitTime).reversed())
                    .forEach(commit -> {
                        try {
                            // Get the folders modified in this specific commit
                            List<String> modifiedFolders = getChangedFoldersInCommit(repository, commit);

                            SystemCommit systemCommit = new SystemCommit(
                                    commit.getId().getName(),
                                    commit.getAuthorIdent().getName(),
                                    commit.getAuthorIdent().getEmailAddress(),
                                    commit.getCommitTime() * 1000L,
                                    commit.getShortMessage(),
                                    modifiedFolders // <-- Injected here
                            );
                            result.add(systemCommit);
                        } catch (Exception e) {
                            LOGGER.error("Error building diffs for commit " + commit.getId().getName(), e);
                        }
                    });

        } catch (Exception e) {
            LOGGER.error("Error", e);
        }

        return result;
    }

    private List<String> getChangedFoldersInCommit(Repository repository, RevCommit commit) throws IOException {
        Set<String> changedFolders = new HashSet<>();

        // DisabledOutputStream ensures we don't print the actual file diffs to the console
        try (DiffFormatter diffFormatter = new DiffFormatter(DisabledOutputStream.INSTANCE);
             RevWalk revWalk = new RevWalk(repository)) {

            diffFormatter.setRepository(repository);
            diffFormatter.setDetectRenames(true);

            AbstractTreeIterator parentTreeParser;

            if (commit.getParentCount() > 0) {
                // For standard/merge commits, compare against the first parent
                RevCommit parent = revWalk.parseCommit(commit.getParent(0).getId());
                parentTreeParser = new CanonicalTreeParser(null, repository.newObjectReader(), parent.getTree().getId());
            } else {
                // For the initial root commit, compare against an empty tree
                parentTreeParser = new EmptyTreeIterator();
            }

            AbstractTreeIterator commitTreeParser = new CanonicalTreeParser(null, repository.newObjectReader(), commit.getTree().getId());

            // Calculate the differences
            List<DiffEntry> diffs = diffFormatter.scan(parentTreeParser, commitTreeParser);

            for (DiffEntry diff : diffs) {
                // If the file was deleted, getNewPath() returns /dev/null, so we must use getOldPath()
                String path = (diff.getChangeType() == DiffEntry.ChangeType.DELETE)
                        ? diff.getOldPath()
                        : diff.getNewPath();

                // Extract the folder path from the file path
                int lastSlash = path.lastIndexOf('/');

                // If lastSlash is -1, the file is in the root directory.
                // You can change "/" to "" depending on your preference.
                String folder = (lastSlash == -1) ? "/" : path.substring(0, lastSlash);

                changedFolders.add(folder); // Set automatically deduplicates
            }
        }

        return new ArrayList<>(changedFolders);
    }

    public List<ProjectFolderCommit> getProjectCommits(String projectId, int maxCount) {
        List<ProjectFolderCommit> result = new ArrayList<>();
        try {
            Git pollGit = gitService.getGit(true, vertx.fileSystem().createTempDirectoryBlocking("commits"));
            if (pollGit == null) return result;

            Repository repo = pollGit.getRepository();

            Iterable<RevCommit> commits = pollGit.log()
                    .setMaxCount(maxCount)
                    .all()
                    .addPath(projectId)
                    .call();
            StreamSupport.stream(commits.spliterator(), false)
                    .sorted(Comparator.comparingInt(RevCommit::getCommitTime).reversed())
                    .forEach(commit -> {
                        try {
                            List<ProjectFileCommitDiff> diffs = buildDiffsWithBeforeAfter(repo, commit, projectId);

                            ProjectFolderCommit projectCommit = new ProjectFolderCommit(
                                    commit.getId().getName(),
                                    projectId,
                                    commit.getAuthorIdent().getName(),
                                    commit.getAuthorIdent().getEmailAddress(),
                                    commit.getCommitTime() * 1000L,
                                    commit.getShortMessage(),
                                    diffs
                            );

                            result.add(projectCommit);
                        } catch (Exception e) {
                            LOGGER.error("Error building diffs for commit " + commit.getId().getName(), e);
                        }
                    });

        } catch (Exception e) {
            LOGGER.error("Error", e);
        }

        return result;
    }

    private List<ProjectFileCommitDiff> buildDiffsWithBeforeAfter(Repository repo, RevCommit commit, String projectId) throws Exception {
        List<ProjectFileCommitDiff> out = new ArrayList<>();

        try (RevWalk revWalk = new RevWalk(repo)) {
            revWalk.parseHeaders(commit);

            RevCommit parent = commit.getParentCount() > 0 ? revWalk.parseCommit(commit.getParent(0).getId()) : null;

            AbstractTreeIterator oldTreeIter = (parent == null)
                    ? new EmptyTreeIterator()
                    : treeIterator(repo, parent);

            AbstractTreeIterator newTreeIter = treeIterator(repo, commit);

            // 1) Collect DiffEntry list
            List<DiffEntry> entries;
            try (DiffFormatter df = new DiffFormatter(DisabledOutputStream.INSTANCE)) {
                df.setRepository(repo);
                df.setDiffComparator(RawTextComparator.DEFAULT);
                df.setDetectRenames(true);

                entries = df.scan(oldTreeIter, newTreeIter);
            }

            // 2) For each entry, produce: diff text + before/after
            for (DiffEntry entry : entries) {
                // Optional: keep only diffs under the project path
                if (!isUnderProjectPath(entry, projectId)) continue;

                String patchText = formatUnifiedDiff(repo, entry);

                String before = readBlobAsText(repo, entry.getOldId().toObjectId());
                String after  = readBlobAsText(repo, entry.getNewId().toObjectId());

                // For added/deleted files, one side will be /dev/null and ObjectId may be zero
                if (isZeroId(entry.getOldId().toObjectId())) before = null;
                if (isZeroId(entry.getNewId().toObjectId())) after = null;

                ProjectFileCommitDiff d = new ProjectFileCommitDiff();
                d.setChangeType(entry.getChangeType().name());
                d.setOldPath(entry.getOldPath());
                d.setNewPath(entry.getNewPath());
                d.setDiff(patchText);
                d.setBefore(before);
                d.setAfter(after);

                out.add(d);
            }
        }

        return out;
    }

    private AbstractTreeIterator treeIterator(Repository repo, RevCommit commit) throws Exception {
        try (RevWalk revWalk = new RevWalk(repo)) {
            RevCommit parsed = revWalk.parseCommit(commit.getId());
            ObjectId treeId = parsed.getTree().getId();

            CanonicalTreeParser parser = new CanonicalTreeParser();
            try (var reader = repo.newObjectReader()) {
                parser.reset(reader, treeId);
            }
            return parser;
        }
    }

    private String formatUnifiedDiff(Repository repo, DiffEntry entry) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        try (DiffFormatter df = new DiffFormatter(baos)) {
            df.setRepository(repo);
            df.setDiffComparator(RawTextComparator.DEFAULT);
            df.setDetectRenames(true);
            df.format(entry);
        }

        return baos.toString(StandardCharsets.UTF_8);
    }

    private String readBlobAsText(Repository repo, ObjectId id) throws Exception {
        if (id == null || isZeroId(id)) return null;

        try {
            ObjectLoader loader = repo.open(id, Constants.OBJ_BLOB);

            // If you expect huge files, consider a size cap
            byte[] bytes = loader.getBytes();

            // If you need binary detection, add it here (e.g., scan for 0x00)
            return new String(bytes, StandardCharsets.UTF_8);
        } catch (MissingObjectException e) {
            // Blob not available (should be rare unless repo state is odd)
            return null;
        }
    }

    private boolean isZeroId(ObjectId id) {
        return id == null || ObjectId.zeroId().equals(id);
    }

    private boolean isUnderProjectPath(DiffEntry entry, String projectId) {
        // projectId is used as a path prefix in addPath(projectId)
        // but diff scan can still contain unrelated entries in some setups; this is a safe filter.
        String p = projectId.endsWith("/") ? projectId : projectId + "/";
        String oldPath = entry.getOldPath() == null ? "" : entry.getOldPath();
        String newPath = entry.getNewPath() == null ? "" : entry.getNewPath();

        // DiffEntry uses DiffEntry.DEV_NULL for added/deleted sides
        if (DiffEntry.DEV_NULL.equals(oldPath)) oldPath = "";
        if (DiffEntry.DEV_NULL.equals(newPath)) newPath = "";

        return oldPath.startsWith(p) || newPath.startsWith(p) || oldPath.equals(projectId) || newPath.equals(projectId);
    }
}
