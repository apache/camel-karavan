package org.apache.camel.karavan.docker;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Default;
import jakarta.inject.Inject;
import org.apache.camel.karavan.service.ConfigService;
import org.eclipse.microprofile.health.HealthCheck;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.Readiness;

@Default
@Readiness
@ApplicationScoped
public class DockerHealthCheck implements HealthCheck {

    @Inject
    DockerService dockerService;

    @Override
    public HealthCheckResponse call() {
        if (!ConfigService.inKubernetes()) {
            return dockerService.checkDocker() ? HealthCheckResponse.named("Docker").up().build() : HealthCheckResponse.named("Docker").down().build();
        }
        return HealthCheckResponse.named("Docker").up().build();
    }
}