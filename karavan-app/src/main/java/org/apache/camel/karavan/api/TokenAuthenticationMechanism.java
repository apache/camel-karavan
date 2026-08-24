package org.apache.camel.karavan.api;

import io.quarkus.security.identity.IdentityProviderManager;
import io.quarkus.security.identity.SecurityIdentity;
import io.quarkus.security.identity.request.AuthenticationRequest;
import io.quarkus.security.runtime.QuarkusSecurityIdentity;
import io.quarkus.vertx.http.runtime.security.ChallengeData;
import io.quarkus.vertx.http.runtime.security.HttpAuthenticationMechanism;
import io.smallrye.mutiny.Uni;
import io.vertx.ext.web.RoutingContext;
import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.cache.AccessToken;
import org.apache.camel.karavan.cache.KaravanCache;
import org.jboss.logging.Logger;

import java.util.Set;

import static org.apache.camel.karavan.service.AuthService.ROLE_SERVICE_ACCOUNT;

/**
 * Dedicated Authentication Mechanism for external clients.
 * Runs secondary to CookieSessionAuthMechanism (Priority 1).
 */
@ApplicationScoped
@Priority(2)
public class TokenAuthenticationMechanism implements HttpAuthenticationMechanism {

    private static final Logger LOGGER = Logger.getLogger(TokenAuthenticationMechanism.class.getName());
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String API_KEY_HEADER = "X-API-Key";

    @Inject
    KaravanCache karavanCache;

    @Override
    public Uni<SecurityIdentity> authenticate(RoutingContext ctx, IdentityProviderManager idpm) {
        String token = extractToken(ctx);

        // If no token is provided, pass control to the next mechanism (e.g., OIDC)
        if (token == null || token.isBlank()) {
            return Uni.createFrom().nullItem();
        }

        try {
            // 1. Hash the raw incoming token instantly to prevent database/cache exposure
            String hashedToken = org.apache.commons.codec.digest.DigestUtils.sha256Hex(token);

            // 2. Query the cache for the metadata object instead of a raw String
            AccessToken metadata = karavanCache.getToken(hashedToken);

            // 3. Fallback to anonymous if token doesn't exist or is expired
            if (metadata == null || metadata.isExpired()) {
                LOGGER.warn("SECURITY: Invalid, revoked, or expired API Token attempted.");
                return Uni.createFrom().item(QuarkusSecurityIdentity.builder().setAnonymous(true).build());
            }

            // 4. Build the identity and pass the scopes down the request chain
            QuarkusSecurityIdentity.Builder builder = QuarkusSecurityIdentity.builder()
                    .setPrincipal(metadata::ownerName)
                    .addRole(ROLE_SERVICE_ACCOUNT)
                    .addAttribute("allowedProjectIds", metadata.allowedProjectIds())
                    .addAttribute("clientName", metadata.clientName())
                    .setAnonymous(false);

            LOGGER.infof("Trace: Authenticated", metadata.clientName(), metadata.ownerName());
            return Uni.createFrom().item(builder.build());

        } catch (Exception e) {
            LOGGER.error("Error while validating API token: " + e.getMessage());
            return Uni.createFrom().item(QuarkusSecurityIdentity.builder().setAnonymous(true).build());
        }
    }

    @Override
    public Uni<ChallengeData> getChallenge(RoutingContext ctx) {
        // Return null to allow fallback challenge mechanisms (OIDC/Session) to execute
        return Uni.createFrom().nullItem();
    }

    @Override
    public Set<Class<? extends AuthenticationRequest>> getCredentialTypes() {
        return Set.of();
    }

    /**
     * Extracts the token from standard M2M headers.
     */
    private String extractToken(RoutingContext ctx) {
        // 1. Prefer Authorization: Bearer
        String authHeader = ctx.request().getHeader(AUTHORIZATION_HEADER);
        if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
            return authHeader.substring(BEARER_PREFIX.length()).trim();
        }

        // 2. Fallback to X-API-Key
        String apiKeyHeader = ctx.request().getHeader(API_KEY_HEADER);
        if (apiKeyHeader != null && !apiKeyHeader.isBlank()) {
            return apiKeyHeader.trim();
        }

        return null;
    }
}