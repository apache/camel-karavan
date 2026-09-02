package org.apache.camel.karavan.api;

import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.apache.camel.karavan.cache.KaravanCache;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Set;

/**
 * Cross-Site Request Forgery protection for the cookie based ("session") auth strategy.
 * <p>
 * The browser attaches the {@code sessionId} cookie to cross-site requests automatically, so the
 * session cookie alone cannot tell an intentional request from one forged by another origin. Every
 * unsafe request made with a session cookie therefore has to carry the CSRF token of that session in
 * the {@code X-CSRF-Token} header, where only our own page can put it.
 * <p>
 * This is the synchronizer-token check: the header is compared against the token stored server-side
 * in the session, not against the {@code csrf} cookie. The double-submit (header vs cookie) variant
 * would also accept a token planted by an attacker who controls a sibling subdomain.
 * <p>
 * Requests without a {@code sessionId} cookie are left alone: they are either unauthenticated (the
 * auth layer rejects them) or authenticated by a bearer/API-key token, which a browser never sends
 * on its own and which is consequently not forgeable.
 */
@Provider
@ApplicationScoped
@Priority(Priorities.AUTHENTICATION)
public class CsrfFilter implements ContainerRequestFilter {

    private static final Logger LOGGER = Logger.getLogger(CsrfFilter.class.getName());

    public static final String CSRF_HEADER = "X-CSRF-Token";
    private static final String SESSION_ID = "sessionId";
    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS", "TRACE");
    // Login has no session to bind a token to yet.
    private static final Set<String> EXEMPT_PATHS = Set.of("ui/auth/login");

    @ConfigProperty(name = "platform.auth", defaultValue = "session")
    String authStrategy;

    @Inject
    KaravanCache karavanCache;

    @Override
    public void filter(ContainerRequestContext requestContext) {
        if (!"session".equals(authStrategy)) {
            return;
        }
        var path = normalize(requestContext.getUriInfo().getPath());
        if (!requiresCsrfToken(requestContext.getMethod(), path)) {
            return;
        }
        var sessionCookie = requestContext.getCookies().get(SESSION_ID);
        if (sessionCookie == null) {
            return;
        }
        var session = karavanCache.getAccessSession(sessionCookie.getValue());
        if (session == null || session.getExpiredAt() == null || session.getExpiredAt().isBefore(Instant.now())) {
            // Unknown or expired session: not authenticated, so there is no authority to forge.
            return;
        }
        if (karavanCache.getUser(session.getUsername()) == null) {
            // Builder and devmode containers get a short-lived session of their own (its username is a
            // project id, not a user) and post to /platform/file with it. No browser holds that cookie,
            // so those requests cannot be forged and cannot be asked for a token they were never given.
            return;
        }
        if (!tokenMatches(session.getCsrfToken(), requestContext.getHeaderString(CSRF_HEADER))) {
            LOGGER.warnf("SECURITY: missing or invalid CSRF token for %s /%s (user %s)",
                    requestContext.getMethod(), path, session.getUsername());
            requestContext.abortWith(Response.status(Response.Status.FORBIDDEN)
                    .type(MediaType.TEXT_PLAIN)
                    .entity("Missing or invalid CSRF token")
                    .build());
        }
    }

    /**
     * Unsafe methods need the token, except on the endpoints that cannot have one yet. Note that
     * logout is deliberately not exempt: it changes state, so it is forgeable like anything else.
     */
    public static boolean requiresCsrfToken(String method, String path) {
        return !SAFE_METHODS.contains(method) && !EXEMPT_PATHS.contains(normalize(path));
    }

    public static boolean tokenMatches(String expected, String actual) {
        return expected != null && actual != null
                && MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), actual.getBytes(StandardCharsets.UTF_8));
    }

    private static String normalize(String path) {
        var result = path == null ? "" : path;
        while (result.startsWith("/")) {
            result = result.substring(1);
        }
        while (result.endsWith("/")) {
            result = result.substring(0, result.length() - 1);
        }
        return result;
    }
}
