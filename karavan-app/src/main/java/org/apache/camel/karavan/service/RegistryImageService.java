/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.apache.camel.karavan.service;

import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.net.PemTrustOptions;
import io.vertx.ext.web.client.WebClientOptions;
import io.vertx.mutiny.core.Vertx;
import io.vertx.mutiny.core.buffer.Buffer;
import io.vertx.mutiny.ext.web.client.HttpRequest;
import io.vertx.mutiny.ext.web.client.HttpResponse;
import io.vertx.mutiny.ext.web.client.WebClient;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.KaravanConstants;
import org.apache.camel.karavan.cache.KaravanCache;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.model.ContainerImage;
import org.apache.camel.karavan.model.RegistryConfig;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Reads container images from an OCI Distribution registry (`/v2/` API), the only API implemented by
 * every registry we care about: Distribution (`registry:5000`), Harbor, Quay, GHCR, ECR, GAR, ACR,
 * Nexus, Artifactory and Docker Hub. Lookup is always per project (`{group}/{projectId}`), so
 * `/v2/_catalog` (unsupported on Hub and ECR) is never used.
 * <p>
 * Note: sizes come from the layer/config descriptors and are therefore <b>compressed</b> sizes,
 * unlike the uncompressed sizes reported by the Docker Engine API.
 */
@ApplicationScoped
public class RegistryImageService {

    private static final Logger LOGGER = Logger.getLogger(RegistryImageService.class.getName());

    private static final String OCI_INDEX = "application/vnd.oci.image.index.v1+json";
    private static final String DOCKER_MANIFEST_LIST = "application/vnd.docker.distribution.manifest.list.v2+json";
    private static final String OCI_MANIFEST = "application/vnd.oci.image.manifest.v1+json";
    private static final String DOCKER_MANIFEST = "application/vnd.docker.distribution.manifest.v2+json";
    private static final String MANIFEST_ACCEPT = String.join(", ", OCI_INDEX, DOCKER_MANIFEST_LIST, OCI_MANIFEST, DOCKER_MANIFEST);

    private static final String DIGEST_HEADER = "Docker-Content-Digest";
    private static final int TIMEOUT = 10000;
    // Tokens are refreshed this many seconds before the registry expires them
    private static final long TOKEN_EXPIRY_MARGIN = 30;

    @ConfigProperty(name = "karavan.environment", defaultValue = KaravanConstants.DEV)
    String environment;

    @ConfigProperty(name = "karavan.container-image.registry-insecure", defaultValue = "false")
    boolean insecure;

    @ConfigProperty(name = "karavan.container-image.registry-ca-configmap")
    Optional<String> caConfigMap;

    @ConfigProperty(name = "karavan.container-image.registry-ca-key", defaultValue = "ca.crt")
    String caConfigMapKey;

    @Inject
    Vertx vertx;

    @Inject
    RegistryService registryService;

    @Inject
    KubernetesService kubernetesService;

    @Inject
    KaravanCache karavanCache;

    private WebClient webClient;
    private volatile String baseUrl;
    private final Map<String, CachedToken> tokens = new ConcurrentHashMap<>();

    private record CachedToken(String header, long expiresAt) {
    }

    private record ManifestInfo(String digest, String configDigest, long size) {
    }

    public synchronized WebClient getWebClient() {
        if (webClient == null) {
            WebClientOptions options = new WebClientOptions().setSsl(false).setKeepAlive(true);
            if (insecure) {
                options.setTrustAll(true).setVerifyHost(false);
            }
            getRegistryCa().ifPresent(ca -> options.setPemTrustOptions(
                    new PemTrustOptions().addCertValue(io.vertx.core.buffer.Buffer.buffer(ca))));
            webClient = WebClient.create(vertx, options);
        }
        return webClient;
    }

    /**
     * Images of a project as stored in the registry, one row per manifest digest with all the tags
     * pointing at it, newest first. Same shape for Docker and Kubernetes.
     */
    public List<ContainerImage> getImagesForProject(String projectId) {
        RegistryConfig config = registryService.getRegistryConfig();
        String repository = config.getGroup() + "/" + projectId;
        try {
            String base = getBaseUrl();
            if (base == null) {
                return List.of();
            }
            String authorization = getAuthorization(base, config, repository);
            List<String> tags = getTags(base, repository, authorization);
            // Tags are shown with the configured registry address, not the address used to call the
            // API, so that the name can be used as an image name in docker-compose/kubernetes.yaml

            String registry =  config.getRegistry();
            if (Objects.equals(config.getRegistry(), "registry:5000")) {
                var container = karavanCache.getPodContainerStatus("registry", environment);
               if (container != null) {
                   var port = container.getPorts().stream().filter(p -> p.getPrivatePort() == 5000).findFirst();
                   if (port.isPresent()) {
                       registry = "localhost:" + port.get().getPublicPort();
                   }
               }
            }
            String imagePrefix = registry + "/" + repository + ":";

            Map<String, List<String>> tagsByDigest = new LinkedHashMap<>();
            Map<String, ContainerImage> imagesByDigest = new LinkedHashMap<>();
            for (String tag : tags) {
                ManifestInfo manifest = getManifest(base, repository, tag, authorization);
                if (manifest == null) {
                    continue;
                }
                tagsByDigest.computeIfAbsent(manifest.digest(), k -> new ArrayList<>()).add(imagePrefix + tag);
                if (!imagesByDigest.containsKey(manifest.digest())) {
                    imagesByDigest.put(manifest.digest(), getImageConfig(base, repository, manifest, authorization));
                }
            }
            return imagesByDigest.entrySet().stream()
                    .map(e -> new ContainerImage(e.getKey(), tagsByDigest.get(e.getKey()),
                            e.getValue().labels(), e.getValue().created(), e.getValue().size()))
                    .sorted(Comparator.comparing(ContainerImage::created).reversed()
                            .thenComparing(s -> s.tags() != null ? String.join(",", s.tags()) : ""))
                    .toList();
        } catch (Exception e) {
            LOGGER.error("Failed to get images for project " + projectId + ": " + getMessage(e));
            return List.of();
        }
    }

    private List<String> getTags(String base, String repository, String authorization) {
        HttpResponse<Buffer> response = send(base + "/v2/" + repository + "/tags/list", authorization, "application/json");
        if (response == null || response.statusCode() == 404) {
            // Repository does not exist yet: the project was never built
            return List.of();
        }
        if (response.statusCode() != 200) {
            LOGGER.warn("Failed to list tags of " + repository + ": " + response.statusCode() + " " + response.statusMessage());
            return List.of();
        }
        JsonArray tags = response.bodyAsJsonObject().getJsonArray("tags");
        if (tags == null) {
            return List.of();
        }
        return tags.stream().filter(t -> t instanceof String).map(Object::toString).toList();
    }

    private ManifestInfo getManifest(String base, String repository, String reference, String authorization) {
        HttpResponse<Buffer> response = send(base + "/v2/" + repository + "/manifests/" + reference, authorization, MANIFEST_ACCEPT);
        if (response == null || response.statusCode() != 200) {
            LOGGER.warn("Failed to get manifest " + repository + ":" + reference
                    + (response != null ? ": " + response.statusCode() + " " + response.statusMessage() : ""));
            return null;
        }
        String digest = response.getHeader(DIGEST_HEADER);
        JsonObject manifest = response.bodyAsJsonObject();
        JsonArray children = manifest.getJsonArray("manifests");
        if (children != null && !children.isEmpty()) {
            // Index/manifest list: describe the linux/amd64 child, keep the index digest as the id
            JsonObject child = selectPlatform(children);
            ManifestInfo childInfo = getManifest(base, repository, child.getString("digest"), authorization);
            if (childInfo == null) {
                return null;
            }
            return new ManifestInfo(digest != null ? digest : childInfo.digest(), childInfo.configDigest(), childInfo.size());
        }
        JsonObject imageConfig = manifest.getJsonObject("config");
        if (imageConfig == null) {
            return null;
        }
        long size = imageConfig.getLong("size", 0L);
        JsonArray layers = manifest.getJsonArray("layers");
        if (layers != null) {
            for (int i = 0; i < layers.size(); i++) {
                size += layers.getJsonObject(i).getLong("size", 0L);
            }
        }
        return new ManifestInfo(digest, imageConfig.getString("digest"), size);
    }

    private JsonObject selectPlatform(JsonArray children) {
        for (int i = 0; i < children.size(); i++) {
            JsonObject child = children.getJsonObject(i);
            JsonObject platform = child.getJsonObject("platform");
            if (platform != null && "linux".equals(platform.getString("os")) && "amd64".equals(platform.getString("architecture"))) {
                return child;
            }
        }
        return children.getJsonObject(0);
    }

    private ContainerImage getImageConfig(String base, String repository, ManifestInfo manifest, String authorization) {
        Long created = null;
        Map<String, String> labels = Map.of();
        if (manifest.configDigest() != null) {
            HttpResponse<Buffer> response = send(base + "/v2/" + repository + "/blobs/" + manifest.configDigest(), authorization, "application/json");
            if (response != null && response.statusCode() == 200) {
                JsonObject config = response.bodyAsJsonObject();
                created = toEpochSeconds(config.getString("created"));
                JsonObject imageLabels = config.getJsonObject("config") != null
                        ? config.getJsonObject("config").getJsonObject("Labels")
                        : null;
                if (imageLabels != null) {
                    labels = new LinkedHashMap<>();
                    for (String key : imageLabels.fieldNames()) {
                        labels.put(key, imageLabels.getString(key));
                    }
                }
            } else {
                LOGGER.warn("Failed to get image config " + repository + "@" + manifest.configDigest());
            }
        }
        return new ContainerImage(manifest.digest(), List.of(), labels, created != null ? created : 0L, manifest.size());
    }

    private Long toEpochSeconds(String created) {
        try {
            return created != null ? Instant.parse(created).getEpochSecond() : null;
        } catch (Exception e) {
            LOGGER.warn("Unparseable image creation date: " + created);
            return null;
        }
    }

    private HttpResponse<Buffer> send(String url, String authorization, String accept) {
        try {
            HttpRequest<Buffer> request = getWebClient().getAbs(url).putHeader("Accept", accept).timeout(TIMEOUT);
            if (authorization != null) {
                request.putHeader("Authorization", authorization);
            }
            return request.send().subscribeAsCompletionStage().toCompletableFuture().get();
        } catch (Exception e) {
            LOGGER.warn("Registry request failed " + url + ": " + getMessage(e));
            return null;
        }
    }

    /**
     * Registry base URL, discovered once by pinging `/v2/`. Registries configured without a scheme
     * are tried over https first, and over http as well when insecure registries are allowed.
     */
    private String getBaseUrl() {
        if (baseUrl != null) {
            return baseUrl;
        }
        String address = registryService.getRegistryAddress();
        List<String> candidates;
        if (address.startsWith("http://") || address.startsWith("https://")) {
            candidates = List.of(address);
        } else if (address.equals("docker.io") || address.equals("index.docker.io")) {
            candidates = List.of("https://registry-1.docker.io");
        } else {
            candidates = insecure
                    ? List.of("https://" + address, "http://" + address)
                    : List.of("https://" + address);
        }
        for (String candidate : candidates) {
            String base = candidate.endsWith("/") ? candidate.substring(0, candidate.length() - 1) : candidate;
            // Any HTTP answer (including 401) means we found the registry API
            if (send(base + "/v2/", null, "application/json") != null) {
                baseUrl = base;
                return baseUrl;
            }
        }
        LOGGER.error("Container image registry is not reachable: " + address);
        return null;
    }

    /**
     * Authorization header for a pull on the given repository: a bearer token obtained from the
     * `WWW-Authenticate` challenge, or plain Basic for registries that use it. Tokens are cached
     * per scope until they expire.
     */
    private String getAuthorization(String base, RegistryConfig config, String repository) {
        String scope = "repository:" + repository + ":pull";
        CachedToken cached = tokens.get(scope);
        if (cached != null && cached.expiresAt() > Instant.now().getEpochSecond()) {
            return cached.header();
        }
        HttpResponse<Buffer> ping = send(base + "/v2/", null, "application/json");
        if (ping == null) {
            return null;
        }
        if (ping.statusCode() != 401) {
            // Open registry: send Basic anyway if credentials are configured, some registries
            // answer 200 on /v2/ but require authentication on private repositories
            return basicHeader(config);
        }
        Map<String, String> challenge = parseChallenge(ping.getHeader("WWW-Authenticate"));
        String realm = challenge.get("realm");
        if (realm == null) {
            return basicHeader(config);
        }
        if (!"bearer".equals(challenge.get("scheme"))) {
            return basicHeader(config);
        }
        StringBuilder url = new StringBuilder(realm)
                .append(realm.contains("?") ? "&" : "?")
                .append("scope=").append(encode(scope));
        if (challenge.get("service") != null) {
            url.append("&service=").append(encode(challenge.get("service")));
        }
        HttpResponse<Buffer> response = send(url.toString(), basicHeader(config), "application/json");
        if (response == null || response.statusCode() != 200) {
            LOGGER.warn("Failed to get registry token for " + scope
                    + (response != null ? ": " + response.statusCode() + " " + response.statusMessage() : ""));
            return basicHeader(config);
        }
        JsonObject body = response.bodyAsJsonObject();
        String token = body.getString("token", body.getString("access_token"));
        if (token == null) {
            return basicHeader(config);
        }
        long expiresIn = body.getLong("expires_in", 300L);
        String header = "Bearer " + token;
        tokens.put(scope, new CachedToken(header, Instant.now().getEpochSecond() + Math.max(expiresIn - TOKEN_EXPIRY_MARGIN, 1)));
        return header;
    }

    private String basicHeader(RegistryConfig config) {
        if (config.getUsername() == null || config.getUsername().isBlank()) {
            return null;
        }
        String credentials = config.getUsername() + ":" + (config.getPassword() != null ? config.getPassword() : "");
        return "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Parses `Bearer realm="https://auth.example.org/token",service="registry.example.org"`
     * into `{scheme: bearer, realm: ..., service: ...}`.
     */
    private Map<String, String> parseChallenge(String header) {
        Map<String, String> result = new LinkedHashMap<>();
        if (header == null || header.isBlank()) {
            return result;
        }
        String trimmed = header.trim();
        int space = trimmed.indexOf(' ');
        if (space < 0) {
            result.put("scheme", trimmed.toLowerCase());
            return result;
        }
        result.put("scheme", trimmed.substring(0, space).toLowerCase());
        for (String part : trimmed.substring(space + 1).split(",")) {
            String[] keyValue = part.split("=", 2);
            if (keyValue.length == 2) {
                result.put(keyValue[0].trim().toLowerCase(), keyValue[1].trim().replaceAll("^\"|\"$", ""));
            }
        }
        return result;
    }

    private Optional<String> getRegistryCa() {
        if (caConfigMap.isEmpty() || caConfigMap.get().isBlank() || !ConfigService.inKubernetes()) {
            return Optional.empty();
        }
        try {
            var configMap = kubernetesService.getConfigMap(caConfigMap.get());
            var data = configMap != null ? configMap.getData() : null;
            return Optional.ofNullable(data != null ? data.get(caConfigMapKey) : null);
        } catch (Exception e) {
            LOGGER.error("Failed to read registry CA from ConfigMap " + caConfigMap.get() + ": " + getMessage(e));
            return Optional.empty();
        }
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String getMessage(Exception e) {
        return e.getCause() != null ? e.getCause().getMessage() : e.getMessage();
    }
}
