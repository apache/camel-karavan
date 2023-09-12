import React from 'react';
import {
    Badge, Card,
    CardBody, DescriptionList, DescriptionListDescription, DescriptionListGroup, DescriptionListTerm,
    PageSection
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {useAppConfigStore} from "../../api/ProjectStore";
import {ContainerPanel} from "./ContainerPanel";
import {DeploymentPanel} from "./DeploymentPanel";

export function ProjectContainerTab() {

    const {config} = useAppConfigStore();

    return (
        <PageSection className="project-tab-panel project-build-panel" padding={{default: "padding"}}>
            <div>
                {config.environments.map(env =>
                    <Card className="project-status">
                        <CardBody>
                            <DescriptionList isHorizontal horizontalTermWidthModifier={{default: '20ch'}}>
                                <DescriptionListGroup>
                                    <DescriptionListTerm>Environment</DescriptionListTerm>
                                    <DescriptionListDescription>
                                        <Badge className="badge">{env}</Badge>
                                    </DescriptionListDescription>
                                </DescriptionListGroup>
                                <DescriptionListGroup>
                                    <DescriptionListTerm>Deployment</DescriptionListTerm>
                                    <DescriptionListDescription>
                                        <DeploymentPanel key={env} env={env}/>
                                    </DescriptionListDescription>
                                </DescriptionListGroup>
                                <DescriptionListGroup>
                                    <DescriptionListTerm>Containers</DescriptionListTerm>
                                    <DescriptionListDescription>
                                        <ContainerPanel key={env} env={env}/>
                                    </DescriptionListDescription>
                                </DescriptionListGroup>
                            </DescriptionList>
                        </CardBody>
                    </Card>
                )}
            </div>
        </PageSection>
    )
}
