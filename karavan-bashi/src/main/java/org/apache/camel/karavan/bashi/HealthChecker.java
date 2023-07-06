package org.apache.camel.karavan.bashi;

import com.github.dockerjava.api.model.Container;
import io.quarkus.scheduler.Scheduled;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class HealthChecker {

    private static final Logger LOGGER = Logger.getLogger(HealthChecker.class.getName());

    private static final ConcurrentHashMap<String, Container> containers = new ConcurrentHashMap<>();

//    @Scheduled(every = "{karavan.health-checker-interval}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
//    void collectHealthStatuses() {
//        containers.forEach((s, s2) -> {
//            LOGGER.infof("HealthCheck for %s", s);
//        });
//    }

//    public void addContainer(Container container){
//        containers.put(container.getId(), container);
//    }
//
//    public void removeContainer(String id){
//        containers.remove(id);
//    }
}
