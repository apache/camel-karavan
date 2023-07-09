package org.apache.camel.karavan.handler;

import io.fabric8.kubernetes.api.model.Service;
import io.fabric8.kubernetes.client.informers.ResourceEventHandler;
import org.apache.camel.karavan.datagrid.DatagridService;
import org.apache.camel.karavan.datagrid.model.ServiceStatus;
import org.apache.camel.karavan.service.KubernetesService;
import org.jboss.logging.Logger;

public class ServiceEventHandler implements ResourceEventHandler<Service> {

    private static final Logger LOGGER = Logger.getLogger(ServiceEventHandler.class.getName());
    private DatagridService datagridService;
    private KubernetesService kubernetesService;

    public ServiceEventHandler(DatagridService datagridService, KubernetesService kubernetesService) {
        this.datagridService = datagridService;
        this.kubernetesService = kubernetesService;
    }

    @Override
    public void onAdd(Service service) {
        try {
            LOGGER.info("onAdd " + service.getMetadata().getName());
            ServiceStatus ds = getServiceStatus(service);
            datagridService.saveServiceStatus(ds);
        } catch (Exception e){
            LOGGER.error(e.getMessage());
        }
    }

    @Override
    public void onUpdate(Service oldService, Service newService) {
        try {
            LOGGER.info("onUpdate " + newService.getMetadata().getName());
            ServiceStatus ds = getServiceStatus(newService);
            datagridService.saveServiceStatus(ds);
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
            datagridService.deleteServiceStatus(ds);
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