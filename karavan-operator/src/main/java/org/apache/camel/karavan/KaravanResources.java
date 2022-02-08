package org.apache.camel.karavan;

import java.util.Map;
import java.util.Optional;

import javax.enterprise.context.ApplicationScoped;

import io.fabric8.kubernetes.api.model.IntOrString;
import io.fabric8.kubernetes.api.model.Service;
import io.fabric8.kubernetes.api.model.ServiceBuilder;
import io.fabric8.kubernetes.api.model.apps.Deployment;
import io.fabric8.kubernetes.api.model.apps.DeploymentBuilder;

import static org.apache.camel.karavan.Constants.KARAVAN_IMAGE;

@ApplicationScoped
public class KaravanResources extends AbstractResources {


    public void createResources(Karavan karavan) {
        this.setKaravan(karavan);
        createFrontendDeployment(karavan);
        createFrontendService();
    }

    private void createFrontendDeployment(Karavan karavan) {
        Optional<Deployment> potentialDeployment = checkDeploymentExists(Constants.NAME);

        if (potentialDeployment.isEmpty()) {
            Deployment deployment1 = new DeploymentBuilder()
                    .withNewMetadata()
                    .withName(Constants.NAME)
                    .withLabels(Constants.DEFAULT_LABELS)
                    .withOwnerReferences(this.createOwnerReference(this.getKaravan()))
                    .endMetadata()

                    .withNewSpec()
                    .withReplicas(karavan.getSpec().getInstances())
                    .withNewSelector()
                    .addToMatchLabels(Constants.DEFAULT_LABELS)
                    .endSelector()

                    .withNewTemplate()
                    .withNewMetadata()
                    .addToLabels(Constants.DEFAULT_LABELS)
                    .endMetadata()

                    .withNewSpec()
                        .addNewContainer()
                            .withName(Constants.NAME)
                            .withImage(KARAVAN_IMAGE)
                            .withImagePullPolicy("Always")
                            .addNewEnv()
                                .withName(Constants.KARAVAN_MODE)
                                .withValue(karavan.getSpec().getMode())
                            .endEnv()
                            .addNewPort()
                                .withContainerPort(8080)
                                .withName(Constants.NAME)
                            .endPort()
                        .endContainer()
//                    .withServiceAccount(Constants.NAME)
                    .endSpec()
                    .endTemplate()
                    .endSpec()
                    .build();
            client.apps().deployments().inNamespace(client.getNamespace()).create(deployment1);
        } else { //We are maybe dealing with an update
            //EnvVar envar = potentialDeployment.get().getSpec().getTemplate().getSpec().getContainers().get(0).
            client.apps().deployments().inNamespace(client.getNamespace())
                    .withName(Constants.NAME).edit(d -> new DeploymentBuilder(d)
                            .editSpec()
                            .editTemplate().editSpec()
                            .editFirstContainer()
                            .editFirstEnv()
                            .withValue(karavan.getSpec().getMode())
                            .endEnv()
                            .endContainer()
                            .endSpec()
                            .endTemplate()
                            .endSpec()
                            .build());
        }
    }


    private void createFrontendService() {
        if (checkServiceExists(Constants.NAME).isEmpty()) {
            Service service = new ServiceBuilder()
                    .withNewMetadata()
                        .withName(Constants.NAME)
                        .withLabels(Constants.DEFAULT_LABELS)
                    .endMetadata()
                    .withNewSpec()
                        .withType("NodePort")
                        .addNewPort()
                            .withName(Constants.NAME)
                            .withPort(80)
                            .withTargetPort(new IntOrString(8080))
                            .withNodePort(31171)
                            .withProtocol("TCP")
                        .endPort()
                        .withSelector(Constants.DEFAULT_LABELS)
                    .endSpec()
                    .build();
            client.services().inNamespace(client.getNamespace()).create(service);
        }
    }
}