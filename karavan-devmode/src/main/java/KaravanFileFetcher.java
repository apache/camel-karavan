import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class KaravanFileFetcher {

    public static void fetchFilesFromPlatform(String projectId, String filename, Path targetDir) {
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