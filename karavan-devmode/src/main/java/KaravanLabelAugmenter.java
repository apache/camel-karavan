import org.apache.maven.model.Model;
import org.apache.maven.model.io.xpp3.MavenXpp3Reader;
import org.apache.maven.model.io.xpp3.MavenXpp3Writer;
import org.codehaus.plexus.util.xml.Xpp3Dom;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Objects;

import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class KaravanLabelAugmenter {

    /**
     * Adds the two Karavan labels to the JKube plugin of the exported pom.xml, so that every resource JKube
     * generates carries them. The pom is written by `camel export` on each build and cannot be prepared in
     * advance, which is why it is patched here rather than shipped.
     */
    public static void addKaravanLabels(String[] args, String projectId) {
        Path pom = exportDir(args).resolve("pom.xml");
        if (!Files.exists(pom)) {
            System.out.printf("No pom.xml at %s - Karavan labels not added", pom.toAbsolutePath());
            return;
        }
        try {
            Model model;
            try (var reader = Files.newBufferedReader(pom)) {
                model = new MavenXpp3Reader().read(reader);
            }
            var plugin = model.getBuild() == null ? null : model.getBuild().getPlugins().stream()
                    .filter(p -> Objects.equals(p.getGroupId(), "org.eclipse.jkube"))
                    .findFirst().orElse(null);
            if (plugin == null) {
                return;
            }
            if (plugin.getConfiguration() == null) {
                plugin.setConfiguration(new Xpp3Dom("configuration"));
            }
            var all = child(child(child((Xpp3Dom) plugin.getConfiguration(), "resources"), "labels"), "all");
            var id = model.getArtifactId() != null ? model.getArtifactId() : projectId;
            addProperty(all, "org.apache.camel.karavan/type", "packaged");
            addProperty(all, "org.apache.camel.karavan/projectId", id);

            try (var writer = Files.newBufferedWriter(pom)) {
                new MavenXpp3Writer().write(writer, model);
            }
            System.out.printf("Added Karavan labels to %s (projectId %s)%n", pom.toAbsolutePath(), id);
        } catch (Exception e) {
            System.out.println("Could not add Karavan labels to " + pom.toAbsolutePath() + ": " + e.getMessage());
        }
    }

    /** {@code --dir=} of the export command, which is where the pom is written. Defaults to the cwd. */
    private static Path exportDir(String... args) {
        for (var arg : args) {
            if (arg.startsWith("--dir=")) {
                return Path.of(arg.substring("--dir=".length()));
            }
        }
        return Path.of(".");
    }

    private static Xpp3Dom child(Xpp3Dom parent, String name) {
        var existing = parent.getChild(name);
        if (existing != null) {
            return existing;
        }
        var created = new Xpp3Dom(name);
        parent.addChild(created);
        return created;
    }

    private static void addProperty(Xpp3Dom all, String name, String value) {
        for (var property : all.getChildren("property")) {
            var child = property.getChild("name");
            if (child != null && Objects.equals(child.getValue(), name)) {
                return;
            }
        }
        var property = new Xpp3Dom("property");
        var nameNode = new Xpp3Dom("name");
        nameNode.setValue(name);
        var valueNode = new Xpp3Dom("value");
        valueNode.setValue(value);
        property.addChild(nameNode);
        property.addChild(valueNode);
        all.addChild(property);
    }

    private static void fetchFilesFromPlatform(String projectId, String filename, Path targetDir) {
        String platformHost = System.getenv("PLATFORM_HOST");
        String sessionId = System.getenv("BUILDER_SESSION_ID");

        String url = "http://" + platformHost + "/platform/internal/sources/" + projectId + (filename != null ? "/" + filename : "");
        System.out.println("Fetching project " + projectId + " files from Platform...");

        try {
            HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder().uri(URI.create(url)).GET();
            requestBuilder.header("Cookie", "sessionId=" + sessionId);
            HttpResponse<InputStream> response = client.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofInputStream());
            if (response.statusCode() == 200) {
                unzipStream(response.body(), targetDir);
                System.out.println("Files successfully downloaded and extracted.");
            } else {
                System.out.println("Failed to fetch project files. Platform returned HTTP " + response.statusCode());
            }
        } catch (Exception e) {
            e.printStackTrace();
            var causeMessage = e.getCause() != null ? e.getCause().getMessage() : e.getMessage();
            var message = "Error: " + causeMessage;
            System.out.println(message);
        }
    }

    private static void unzipStream(InputStream inputStream, Path targetDir) throws Exception {
        try (ZipInputStream zis = new ZipInputStream(inputStream)) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                Path resolvedPath = targetDir.resolve(entry.getName()).normalize();

                // Zip Slip vulnerability prevention
                if (!resolvedPath.startsWith(targetDir)) {
                    throw new RuntimeException("Invalid ZIP entry path: " + entry.getName());
                }

                if (entry.isDirectory()) {
                    Files.createDirectories(resolvedPath);
                } else {
                    Files.createDirectories(resolvedPath.getParent());
                    try (OutputStream os = Files.newOutputStream(resolvedPath)) {
                        zis.transferTo(os);
                    }

                    // Mark file as executable if it is a shell script
                    if (entry.getName().endsWith(".sh")) {
                        boolean success = resolvedPath.toFile().setExecutable(true, false); // true = executable, false = for all users (not just owner)
                        if (!success) {
                            System.out.printf("Failed to set executable permission on: %s", resolvedPath.toAbsolutePath());
                        }
                    }

                    System.out.printf("Extracted file: %s", resolvedPath.toAbsolutePath());
                }
                zis.closeEntry();
            }
        }
    }
}