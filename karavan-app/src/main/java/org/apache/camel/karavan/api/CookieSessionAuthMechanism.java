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
import org.apache.camel.karavan.cache.KaravanCache;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.Set;

/**
 * This mechanism runs FIRST (due to Priority 1).
 * It checks a RUNTIME property 'auth.strategy' to decide what to do.
 */
@ApplicationScoped
@Priority(1) // <-- This is crucial. It makes this mechanism run BEFORE the OIDC one.
public class CookieSessionAuthMechanism implements HttpAuthenticationMechanism {

    private static final Logger LOGGER = Logger.getLogger(CookieSessionAuthMechanism.class.getName());

    @ConfigProperty(name = "platform.auth", defaultValue = "session")
    String authStrategy;

    @Inject
    KaravanCache karavanCache;

    @Override
    public Uni<SecurityIdentity> authenticate(RoutingContext ctx, IdentityProviderManager idpm) {
        if (!"session".equals(authStrategy)) {
            return Uni.createFrom().nullItem();
        }

        var builder = QuarkusSecurityIdentity.builder();
        try {
            builder.setAnonymous(true);
            var cookie = ctx.request().getCookie("sessionId");
            if (cookie == null) {
                return Uni.createFrom().item(builder.build());
            }

            var session = karavanCache.getAccessSession(cookie.getValue());
            if (session == null) {
                return Uni.createFrom().item(builder.build());
            }

            var user = karavanCache.getUser(session.getUsername());
            if (user == null) {
                return Uni.createFrom().item(builder.build());
            }

            builder.setPrincipal(session::getUsername);
            for (String role : user.getRoles()) {
                builder.addRole(role);
            }
            builder.addAttribute("csrf", session.getCsrfToken());
            builder.setAnonymous(false);
            return Uni.createFrom().item(builder.build());

        } catch (Exception e) {
            LOGGER.error("Error while authenticating session:" + e.getMessage());
            // Error, return anonymous.
            return Uni.createFrom().item(builder.build());
        }
    }

    @Override
    public Uni<ChallengeData> getChallenge(RoutingContext ctx) {
        if (!"session".equals(authStrategy)) {
            // OIDC mode: Let the OIDC mechanism (which will run) create the challenge.
            // Returning null passes control to the next mechanism.
            return Uni.createFrom().nullItem();
        }

        // Session mode: We are in charge. Issue the 401 challenge.
        return Uni.createFrom().item(new ChallengeData(401, "WWW-Authenticate", "Session"));
    }

    @Override
    public Set<Class<? extends AuthenticationRequest>> getCredentialTypes() {
        return Set.of();
    }
}