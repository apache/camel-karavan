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

    public boolean isExpired() {
        return expiresAt != null && Instant.now().isAfter(expiresAt);
    }
}