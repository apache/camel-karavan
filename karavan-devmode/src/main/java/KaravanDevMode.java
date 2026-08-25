import org.apache.camel.dsl.jbang.core.commands.CamelJBangMain;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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

public class KaravanDevMode {

    private static final Logger LOGGER = LoggerFactory.getLogger(KaravanDevMode.class.getName());

    public static void main(String... args) throws Exception {
        var projectId = System.getenv("PROJECT_ID");
        var isBuildMode = Objects.equals(System.getenv("RUN_IN_BUILD_MODE"), "true");

        if (isBuildMode && args.length == 1 && args[0].equals("fetchBuildScriptFromPlatform")) {
            Path targetDir = Path.of(System.getenv("BUILDER_PATH"));
            fetchFilesFromPlatform("configuration", "build.sh", targetDir);
        } else {
            if (!isBuildMode) {
                Path targetDir = Path.of(System.getenv("CODE_DIR"));
                fetchFilesFromPlatform(projectId, null, targetDir);
            }
            // Start Camel JBang
            CamelJBangMain.run(args);
        }
    }

    private static void fetchFilesFromPlatform(String projectId, String filename, Path targetDir) {
        String platformHost = System.getenv("KARAVAN_HOST");
        String sessionId = System.getenv("BUILDER_SESSION_ID");

        String url = "http://" + platformHost + "/platform/internal/sources/" + projectId + (filename != null ? "/" + filename : "");
        LOGGER.info("Fetching project files from Platform...");

        try {
            HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder().uri(URI.create(url)).GET();
            requestBuilder.header("Cookie", "sessionId=" + sessionId);
            HttpResponse<InputStream> response = client.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofInputStream());
            if (response.statusCode() == 200) {
                unzipStream(response.body(), targetDir);
                LOGGER.info("Files successfully downloaded and extracted.");
            } else {
                LOGGER.info("Failed to fetch project files. Platform returned HTTP " + response.statusCode());
            }
        } catch (Exception e) {
            LOGGER.error("Error establishing connection to Platform: " + e.getMessage());
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
                            LOGGER.warn("Failed to set executable permission on: {}", resolvedPath.toAbsolutePath());
                        }
                    }

                    LOGGER.info("Extracted file: {}", resolvedPath.toAbsolutePath());
                }
                zis.closeEntry();
            }
        }
    }
}