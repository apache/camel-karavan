/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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

    const env = config.environment;
    return (
        <PageSection className="project-tab-panel project-build-panel" padding={{default: "padding"}}>
            <div>
                <Card key={env} className="project-status">
                    <CardBody>
                        <DescriptionList isHorizontal horizontalTermWidthModifier={{default: '20ch'}}>
                            <DescriptionListGroup>
                                <DescriptionListTerm>Environment</DescriptionListTerm>
                                <DescriptionListDescription>
                                    <Badge className="badge">{env}</Badge>
                                </DescriptionListDescription>
                            </DescriptionListGroup>
                            {config.infrastructure === 'kubernetes' &&
                                <DescriptionListGroup>
                                    <DescriptionListTerm>Deployment</DescriptionListTerm>
                                    <DescriptionListDescription>
                                        <DeploymentPanel env={env}/>
                                    </DescriptionListDescription>
                                </DescriptionListGroup>
                            }
                            <DescriptionListGroup>
                                <DescriptionListTerm>Containers</DescriptionListTerm>
                                <DescriptionListDescription>
                                    <ContainerPanel env={env}/>
                                </DescriptionListDescription>
                            </DescriptionListGroup>
                        </DescriptionList>
                    </CardBody>
                </Card>
            </div>
        </PageSection>
    )
}
