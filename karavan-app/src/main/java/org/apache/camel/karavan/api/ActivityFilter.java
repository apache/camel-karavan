package org.apache.camel.karavan.api;

import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.UriInfo;
import jakarta.ws.rs.ext.Provider;
import org.apache.camel.karavan.cache.ProjectFolder;
import org.apache.camel.karavan.model.ActivityContainer;
import org.apache.camel.karavan.model.ActivityProject;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.util.Objects;

import static org.apache.camel.karavan.KaravanEvents.ON_PROJECT_ACTIVITY;

@Provider
@ApplicationScoped
public class ActivityFilter extends AbstractApiResource implements ContainerResponseFilter, ContainerRequestFilter {

    private static final Logger LOG = Logger.getLogger(ActivityFilter.class);
    private static final String projectIdKey = "projectId";
    private static final String nameKey = "name";
    private static final String usernameKey = "username";

    @Context
    UriInfo info;

    @Inject
    EventBus eventBus;

    @Override
    public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext) throws IOException {
        final String method = requestContext.getMethod();
        final String path = info.getPath();

        if (path.startsWith("/ui/devmode")
                || path.startsWith("/ui/project")
                || path.startsWith("/ui/project/build")
                || path.startsWith("/ui/project/traces")
                || path.startsWith("/ui/file")
                || path.startsWith("/ui/container")
                || path.startsWith("/ui/project/status/camel")
                || path.startsWith("/ui/catalog/create")
                || path.startsWith("/ui/infrastructure/deployment")) {
            checkParameters(method, path, requestContext, responseContext);
        }
    }

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        final String path = info.getPath();
        if (path.startsWith("/ui/logwatch")) {
            var containerName = info.getPathParameters().get(nameKey).get(0);
            var userName = info.getPathParameters().get(usernameKey).get(0);
            eventBus.publish(ON_PROJECT_ACTIVITY, JsonObject.mapFrom(new ActivityContainer(userName, containerName)));
        }
    }

    private void checkParameters(String method, String path, ContainerRequestContext requestContext, ContainerResponseContext responseContext) {
        try {
            var user = getIdentity();
            var userName = user.getString("username");
//            eventBus.publish(ON_USER_ACTIVITY, JsonObject.mapFrom(new ActivityUser(userName)));

            if (info.getPathParameters().containsKey(projectIdKey)) {
                var projectId = info.getPathParameters().get(projectIdKey).get(0);
                eventBus.publish(ON_PROJECT_ACTIVITY, JsonObject.mapFrom(ActivityProject.createAdd(userName, projectId)));
            } else if (info.getQueryParameters().containsKey(projectIdKey)) {
                var projectId = info.getQueryParameters().get(projectIdKey).get(0);
                eventBus.publish(ON_PROJECT_ACTIVITY, JsonObject.mapFrom(ActivityProject.createAdd(userName, projectId)));
            } else  if (path.startsWith("/ui/devmode") || !Objects.equals(method, "GET")) {
                if (responseContext.getEntity() instanceof ProjectFolder projectFolder) {
                    eventBus.publish(ON_PROJECT_ACTIVITY, JsonObject.mapFrom(ActivityProject.createAdd(userName, projectFolder.getProjectId())));
                } else if (responseContext.getEntity() instanceof String string) {
                    var json = new JsonObject(string);
                    var projectId = json.getString(projectIdKey);
                    eventBus.publish(ON_PROJECT_ACTIVITY, JsonObject.mapFrom(ActivityProject.createAdd(userName, projectId)));
                }
            }
        } catch (Exception ignored) {}
    }
}

