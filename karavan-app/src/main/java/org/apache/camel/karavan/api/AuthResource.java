package org.apache.camel.karavan.api;

import io.quarkus.security.Authenticated;
import io.vertx.core.json.JsonObject;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import org.apache.camel.karavan.cache.AccessUser;
import org.apache.camel.karavan.cache.KaravanCache;
import org.apache.camel.karavan.service.AuthService;
import org.eclipse.microprofile.config.ConfigProvider;
import org.jboss.logging.Logger;

import java.util.Map;

import static org.apache.camel.karavan.service.AuthService.SESSION_MAX_AGE;

@Path("/ui/auth")
@Produces(MediaType.APPLICATION_JSON)
public class AuthResource extends AbstractApiResource {

    private static final Logger LOGGER = Logger.getLogger(AuthResource.class.getName());
    private static final String SESSION_ID = "sessionId";
    private static final String CSRF = "csrf";

    @Inject
    AuthService authService;

    @Inject
    KaravanCache karavanCache;

    @GET
    @Path("/type")
    @Produces(MediaType.TEXT_PLAIN)
    @PermitAll
    public Response authType() throws Exception {
        String authType = ConfigProvider.getConfig().getValue("platform.auth", String.class);
        return Response.ok(authType).build();
    }

    @GET
    @Path("/sso-config")
    @PermitAll
    @Produces(MediaType.APPLICATION_JSON)
    public Response ssoConfig() throws Exception {
        Map<String, String> getSsoConfig = Map.of(
                "url", ConfigProvider.getConfig().getValue("karavan.keycloak.url", String.class),
                "realm", ConfigProvider.getConfig().getValue("karavan.keycloak.realm", String.class),
                "clientId", ConfigProvider.getConfig().getValue("karavan.keycloak.frontend.clientId", String.class)
        );
        return Response.ok(getSsoConfig).build();
    }

    @POST
    @Path("/login")
    @PermitAll
    @Consumes(MediaType.APPLICATION_JSON)
    public Response login(JsonObject body) throws Exception {
        try {
            final AccessUser user = authService.login(body.getString("username"), body.getString("password"));
            var session = authService.createAndSaveSession(user.username, true);
            NewCookie sidCookie = new NewCookie.Builder(SESSION_ID).value(session.sessionId).path("/").maxAge(SESSION_MAX_AGE).secure(true).httpOnly(true).build();
            NewCookie csrfCookie = new NewCookie.Builder(CSRF).value(session.csrfToken).path("/").maxAge(SESSION_MAX_AGE).secure(false).httpOnly(true).build();
            return Response.ok(JsonObject.of("username", user.getUsername(), "roles", user.getRoles()))
                    .cookie(sidCookie).cookie(csrfCookie).build();
        } catch (Exception e) {
            return Response.status(Response.Status.FORBIDDEN).entity(e.getMessage()).build();
        }
    }

    @POST
    @Path("/password")
    @Authenticated
    @Consumes(MediaType.APPLICATION_JSON)
    public Response setPassword(JsonObject body) throws Exception {
        try {
            final var username = getIdentity().getString("username");
            final var currentPassword = body.getString("currentPassword");
            final var password = body.getString("password");
            final AccessUser user = authService.login(username, currentPassword);
            authService.changePassword(username, password, false);
            NewCookie sidCookie = new NewCookie.Builder(SESSION_ID).path("/").maxAge(0).secure(true).httpOnly(true).sameSite(NewCookie.SameSite.LAX).build();
            NewCookie csrfCookie = new NewCookie.Builder(CSRF).path("/").maxAge(60).secure(false).sameSite(NewCookie.SameSite.LAX).build();
            return Response.noContent().cookie(sidCookie).cookie(csrfCookie).build();
        } catch (Exception e) {
            return Response.status(Response.Status.FORBIDDEN).entity(e.getMessage()).build();
        }
    }


    @POST
    @PermitAll
    @Path("/logout")
    public Response logout(@CookieParam(SESSION_ID) String sessionId) throws Exception {
        NewCookie sidCookie = new NewCookie.Builder(SESSION_ID).path("/").maxAge(0).secure(true).httpOnly(true).sameSite(NewCookie.SameSite.LAX).build();
        NewCookie csrfCookie = new NewCookie.Builder(CSRF).path("/").maxAge(60).secure(false).sameSite(NewCookie.SameSite.LAX).build();
        try {
            if (sessionId != null) {
                karavanCache.deleteAccessSession(sessionId);
            }
            return Response.noContent().cookie(sidCookie).cookie(csrfCookie).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(e.getMessage()).cookie(sidCookie).cookie(csrfCookie).build();
        }
    }

    @GET
    @Path("/me")
    @Authenticated
    @Produces("application/json")
    public Response me(@Context SecurityContext sc) {
        var username = getIdentity().getString("username");
        var user = karavanCache.getUser(username);
        return Response.ok(user).build();
    }
}
