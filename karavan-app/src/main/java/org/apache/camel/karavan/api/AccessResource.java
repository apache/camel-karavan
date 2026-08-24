package org.apache.camel.karavan.api;

import io.vertx.core.json.JsonObject;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.apache.camel.karavan.cache.AccessRole;
import org.apache.camel.karavan.cache.AccessToken;
import org.apache.camel.karavan.cache.AccessUser;
import org.apache.camel.karavan.cache.KaravanCache;
import org.apache.camel.karavan.service.AuthService;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.apache.camel.karavan.service.AuthService.*;

@Path("/ui/access")
public class AccessResource extends AbstractApiResource {

    @Inject
    KaravanCache karavanCache;

    @Inject
    AuthService authService;

    public record SessionInfo(String username, long createdAt, long expiredAt) {}

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/sessions")
    @RolesAllowed({ROLE_ADMIN})
    public List<SessionInfo> getAllSessions() {
        return karavanCache.getAccessSessions().stream().map(s -> new SessionInfo(s.username, s.createdAtMillis, s.expiredAt.toEpochMilli())).toList();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/users")
    @RolesAllowed({ROLE_ADMIN, ROLE_DEVELOPER})
    public List<AccessUser> getAllUsers() {
        return karavanCache.getUsers();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/roles")
    @RolesAllowed({ROLE_ADMIN})
    public List<AccessRole> getAllRoles() {
        return karavanCache.getRoles();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/tokens")
    @RolesAllowed({ROLE_ADMIN})
    public List<AccessToken> getAllTokens() {
        return karavanCache.getTokens().stream()
                .map(t -> new AccessToken(t.hashedToken().substring(0, 16), t.ownerName(), t.clientName(), t.allowedProjectIds(), t.createdAt(), t.expiresAt()))
                .toList();
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed({ROLE_ADMIN})
    @Path("/users")
    public Response addUser(AccessUser user) {
        karavanCache.saveUser(user, true);
        return Response.ok().entity(user).build();
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed({ROLE_ADMIN})
    @Path("/roles")
    public Response addRole(AccessRole role) {
        karavanCache.saveRole(role, true);
        return Response.ok().entity(role).build();
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed({ROLE_ADMIN, ROLE_DEVELOPER})
    @Path("/tokens")
    public Response generateToken(GenerateTokenRequest request) {
        try {
            // 1. Handle defaults if the frontend omits them
            int expiresInDays = (request.expiresInDays() != null && request.expiresInDays() > 0)
                    ? request.expiresInDays()
                    : 30;

            Set<String> allowedProjectIds = (request.allowedProjectIds() != null && !request.allowedProjectIds().isEmpty())
                    ? request.allowedProjectIds()
                    : Set.of("*"); // Default to all projects if none specified

            // 2. Generate a secure random raw token
            SecureRandom random = new SecureRandom();
            byte[] bytes = new byte[32];
            random.nextBytes(bytes);
            String rawToken = "tal_" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

            // 3. Hash the raw token via SHA-256
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            String hashedToken = HexFormat.of().formatHex(encodedhash);

            // 4. Extract the current user to set as the owner
            String ownerName = getIdentity().getString("username");

            // 5. Create the Metadata Record
            AccessToken tokenMetadata = new AccessToken(
                    hashedToken,
                    ownerName,
                    request.clientName(),
                    allowedProjectIds,
                    Instant.now(),
                    Instant.now().plus(expiresInDays, ChronoUnit.DAYS)
            );

            // 6. Save ONLY the hashed metadata to the cache
            karavanCache.saveToken(tokenMetadata, true);

            // 7. Return the strict Response DTO
            GenerateTokenResponse response = new GenerateTokenResponse(rawToken, tokenMetadata);
            return Response.ok(response).build();

        } catch (Exception e) {
            return Response.serverError().entity(e.getMessage()).build();
        }
    }

    @PUT
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed({ROLE_USER})
    @Path("/users")
    public Response updateUser(AccessUser user) {
        var name = getIdentity().getString("username");
        if (Objects.equals(name, user.username)) {
            var currentUser = karavanCache.getUser(user.username);
            user.setRoles(currentUser.getRoles());
            karavanCache.saveUser(user, true);
            return Response.ok().entity(user).build();
        } else  {
            return Response.status(Response.Status.FORBIDDEN).build();
        }
    }

    @PUT
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed({ROLE_ADMIN})
    @Path("/userRole")
    public Response changeUserRole(JsonObject message) {
        var username = message.getString("username");
        var role = message.getString("role");
        var command = message.getString("command");
        var currentUser = karavanCache.getUser(username);
        List<String> roles = new ArrayList<>(currentUser.getRoles());
        if (Objects.equals(command, "add")) {
            roles.add(role);
        } else if (Objects.equals(command, "remove")) {
            roles.remove(role);
        }
        currentUser.setRoles(roles);
        karavanCache.saveUser(currentUser, true);
        return Response.ok().entity(currentUser).build();
    }

    @PUT
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed({ROLE_ADMIN})
    @Path("/users/{status}")
    public Response setUserStatus(AccessUser user, @PathParam("status") String status) {
        user.setStatus(AccessUser.UserStatus.valueOf(status));
        karavanCache.saveUser(user, true);
        return Response.ok().entity(user).build();
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed({ROLE_ADMIN})
    @Path("/users/{username}")
    public Response deleteUser(@PathParam("username") String username) {
        try {
            var user = karavanCache.getUser(username);
            user.setStatus(AccessUser.UserStatus.DELETED);
            karavanCache.saveUser(user, true);
            return Response.accepted().build();
        } catch (Exception e) {
            return Response.notModified().build();
        }
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed({ROLE_ADMIN})
    @Path("/sessions/{username}")
    public Response deleteSession(@PathParam("username") String username) {
        try {
            karavanCache.deleteAccessSessionByUsername(username);
            return Response.accepted().build();
        } catch (Exception e) {
            return Response.notModified().build();
        }
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed({ROLE_ADMIN})
    @Path("/roles/{name}")
    public Response deleteRole(@PathParam("name") String name) {
        try {
            if (!Objects.equals(ROLE_ADMIN, name) && !Objects.equals(ROLE_USER, name) && !Objects.equals(ROLE_DEVELOPER, name)) {
                var role = karavanCache.getRole(name);
                if (role != null) {
                    karavanCache.deleteRole(role);
                    return Response.accepted().build();
                }
            }
            return Response.notModified().build();
        } catch (Exception e) {
            return Response.notModified().build();
        }
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed({ROLE_ADMIN})
    @Path("/tokens/{hashedToken}")
    public Response deleteToken(@PathParam("hashedToken") String hashedToken) {
        try {
            karavanCache.deleteToken(hashedToken);
            return Response.accepted().build();
        } catch (Exception e) {
            return Response.notModified().build();
        }
    }

    @POST
    @Path("/password")
    @RolesAllowed({ROLE_ADMIN})
    @Consumes(MediaType.APPLICATION_JSON)
    public Response changePassword(JsonObject body) throws Exception {
        try {
            final var adminUsername = getIdentity().getString("username");
            final var currentPassword = body.getString("currentPassword");
            final var username = body.getString("username");
            final var password = body.getString("password");
            authService.login(adminUsername, currentPassword);
            authService.changePassword(username, password, true);
            return Response.noContent().build();
        } catch (Exception e) {
            return Response.status(Response.Status.FORBIDDEN).entity(e.getMessage()).build();
        }
    }

    public record GenerateTokenRequest(
            String clientName,
            Set<String> allowedProjectIds,
            Integer expiresInDays
    ) {}

    public record GenerateTokenResponse(
            String rawToken,
            AccessToken metadata
    ) {}
}