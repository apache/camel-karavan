package org.apache.camel.karavan.informer;

import io.fabric8.kubernetes.api.model.Service;
import io.fabric8.kubernetes.client.informers.ResourceEventHandler;
import org.apache.camel.karavan.model.ServiceStatus;
import org.apache.camel.karavan.service.InfinispanService;
import org.apache.camel.karavan.service.KubernetesService;
import org.jboss.logging.Logger;

public class ServiceEventHandler implements ResourceEventHandler<Service> {

    private static final Logger LOGGER = Logger.getLogger(ServiceEventHandler.class.getName());
    private InfinispanService infinispanService;
    private KubernetesService kubernetesService;

    public ServiceEventHandler(InfinispanService infinispanService, KubernetesService kubernetesService) {
        this.infinispanService = infinispanService;
        this.kubernetesService = kubernetesService;
    }

    @Override
    public void onAdd(Service service) {
        try {
            LOGGER.info("onAdd " + service.getMetadata().getName());
            ServiceStatus ds = getServiceStatus(service);
            infinispanService.saveServiceStatus(ds);
        } catch (Exception e){
            LOGGER.error(e.getMessage());
        }
    }

    @Override
    public void onUpdate(Service oldService, Service newService) {
        try {
            LOGGER.info("onUpdate " + newService.getMetadata().getName());
            ServiceStatus ds = getServiceStatus(newService);
            infinispanService.saveServiceStatus(ds);
        } catch (Exception e){
            LOGGER.error(e.getMessage());
        }
    }

    @Override
    public void onDelete(Service service, boolean deletedFinalStateUnknown) {
        try {
            LOGGER.info("onDelete " + service.getMetadata().getName());
            ServiceStatus ds = new ServiceStatus(
                    service.getMetadata().getName(),
                    service.getMetadata().getNamespace(),
                    kubernetesService.getCluster(),
                    kubernetesService.environment);
            infinispanService.deleteServiceStatus(ds);
        } catch (Exception e){
            LOGGER.error(e.getMessage());
        }
    }

    public ServiceStatus getServiceStatus(Service service) {
        try {
            return new ServiceStatus(
                    service.getMetadata().getName(),
                    service.getMetadata().getNamespace(),
                    kubernetesService.environment,
                    kubernetesService.getCluster(),
                    service.getSpec().getPorts().get(0).getPort(),
                    service.getSpec().getPorts().get(0).getTargetPort().getIntVal(),
                    service.getSpec().getClusterIP(),
                    service.getSpec().getType()
            );
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage());
            return new ServiceStatus(
                    service.getMetadata().getName(),
                    service.getMetadata().getNamespace(),
                    kubernetesService.getCluster(),
                    kubernetesService.environment);
        }
    }
}