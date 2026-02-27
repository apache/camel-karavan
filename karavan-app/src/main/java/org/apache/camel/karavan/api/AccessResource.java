package org.apache.camel.karavan.api;

import io.vertx.core.json.JsonObject;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.apache.camel.karavan.cache.AccessRole;
import org.apache.camel.karavan.cache.AccessUser;
import org.apache.camel.karavan.cache.KaravanCache;
import org.apache.camel.karavan.service.AuthService;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import static org.apache.camel.karavan.service.AuthService.*;

@Path("/ui/access")
public class AccessResource extends AbstractApiResource {

    @Inject
    KaravanCache karavanCache;

    @Inject
    AuthService authService;

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
}