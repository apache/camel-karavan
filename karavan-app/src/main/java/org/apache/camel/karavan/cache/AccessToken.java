package org.apache.camel.karavan.cache;

import java.time.Instant;
import java.util.Set;

public record AccessToken(
        String hashedToken,
        String ownerName,          // The username of the developer who generated the token
        String clientName,
        Set<String> allowedProjectIds, // Scoped access limits (ABAC). Supports exact matches or ["*"]
        Instant createdAt,
        Instant expiresAt
) {

    /**
     * Checks if the token has surpassed its expiration timestamp.
     */
    public boolean isExpired() {
        return expiresAt != null && Instant.now().isAfter(expiresAt);
    }

    /**
     * Checks whether the external agent has authorization to access a specific project.
     * Supports a wildcard "*" for unrestricted developer-level access.
     */
    public boolean hasProjectAccess(String projectId) {
        if (isExpired()) {
            return false;
        }
        if (allowedProjectIds == null || allowedProjectIds.isEmpty()) {
            return false;
        }
        return allowedProjectIds.contains("*") || allowedProjectIds.contains(projectId);
    }
}