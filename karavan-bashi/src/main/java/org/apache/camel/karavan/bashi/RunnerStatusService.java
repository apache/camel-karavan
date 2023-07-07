package org.apache.camel.karavan.bashi;

import com.github.dockerjava.api.model.HealthCheck;
import com.github.dockerjava.api.model.Statistics;
import io.quarkus.scheduler.Scheduled;
import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.json.JsonObject;
import org.apache.camel.karavan.bashi.docker.DockerService;
import org.apache.camel.karavan.bashi.infinispan.InfinispanService;
import org.apache.camel.karavan.bashi.infinispan.PodStatus;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.util.*;

import static org.apache.camel.karavan.bashi.Constants.*;

@ApplicationScoped
public class RunnerStatusService {

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    DockerService dockerService;

    @Inject
    InfinispanService infinispanService;

    private static final Logger LOGGER = Logger.getLogger(RunnerStatusService.class.getName());

    @Scheduled(every = "{karavan.runner-status-interval}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void collectRunnerStatus() {
        System.out.println("collectRunnerStatus");
        dockerService.getRunnerContainer().forEach(container -> {
            String name = container.getNames()[0].replace("/", "");
            String projectId = name.replace("-" + Constants.RUNNER_SUFFIX, "");
            PodStatus ps = getPodStatus(container.getId(), name, projectId, container.getState(), container.getCreated());
            infinispanService.savePodStatus(ps);
        });
    }

    public PodStatus getPodStatus(String id, String name, String projectId, String state, Long created) {
        try {
            boolean initialized = Arrays.asList("running", "restarting").contains(state);
            boolean ready = Arrays.asList("running", "restarting").contains(state);
            boolean terminating = Arrays.asList("paused", "exited").contains(state);
            String creationTimestamp = new Date(created).toString();

            Statistics stats = dockerService.getContainerStats(id);

            String requestMemory = Objects.requireNonNull(stats.getMemoryStats().getUsage()).toString();
            String requestCpu = "N/A";
            String limitMemory = Objects.requireNonNull(stats.getMemoryStats().getLimit()).toString();
            String limitCpu = "N/A";
            return new PodStatus(
                    name,
                    state,
                    initialized,
                    ready,
                    terminating,
                    "",
                    name,
                    projectId,
                    environment,
                    true,
                    requestMemory,
                    requestCpu,
                    limitMemory,
                    limitCpu,
                    creationTimestamp
            );
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage(), ex.getCause());
            return new PodStatus(
                    name,
                    projectId,
                    environment);
        }
    }
}
