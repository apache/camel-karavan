package org.apache.camel.karavan;

import java.util.Optional;

import javax.inject.Inject;

import io.fabric8.kubernetes.api.model.OwnerReference;
import io.fabric8.kubernetes.api.model.OwnerReferenceBuilder;
import io.fabric8.kubernetes.api.model.Service;
import io.fabric8.kubernetes.api.model.apps.Deployment;
import io.fabric8.kubernetes.client.KubernetesClient;

public abstract class AbstractResources {

    private Karavan karavan;

    @Inject
    KubernetesClient client;

    protected Optional<Deployment> checkDeploymentExists(String name){
        return Optional.ofNullable(client.apps().deployments().inNamespace(client.getNamespace()).withName(name).get());
    }

    protected Optional<Service> checkServiceExists(String name) {
        return Optional.ofNullable(client.services().inNamespace(client.getNamespace()).withName(name).get());
    }

    protected void deleteDeployment(String name){
        client.apps().deployments().inNamespace(client.getNamespace()).withName(name).delete();
    }

    protected void deleteService(String name){
        client.services().inNamespace(client.getNamespace()).withName(name).delete();
    }

    protected OwnerReference createOwnerReference(Karavan resource) {
        final var metadata = resource.getMetadata();
        return new OwnerReferenceBuilder()
                .withUid(metadata.getUid())
                .withApiVersion(resource.getApiVersion())
                .withName(metadata.getName())
                .withKind(resource.getKind())
                .build();
    }

    public Karavan getKaravan() {
        return karavan;
    }

    public void setKaravan(Karavan karavan) {
        this.karavan = karavan;
    }

}