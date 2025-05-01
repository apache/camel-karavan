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
    CardBody, CardHeader, DescriptionList, DescriptionListDescription, DescriptionListGroup, DescriptionListTerm,
    PageSection, Text, TextContent
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {useAppConfigStore} from "../../api/ProjectStore";
import {ContainerEnvironmentPanel} from "./ContainerEnvironmentPanel";
import {DeploymentPanel} from "./DeploymentPanel";
import {ContainerButtons} from "./ContainerButtons";
import {DeploymentButtons} from "./DeploymentButtons";

export function ContainerPanel() {

    const {config} = useAppConfigStore();
    const env = config.environment;

    function getTitle(title: string, width: string = 'auto') {
        return (
            <TextContent style={{width: width}}>
                <Text component='h4'>{title}</Text>
            </TextContent>
        )
    }

    return (
        <PageSection className="project-tab-panel project-build-panel" padding={{default: "noPadding"}}>
            <Card key={env} className="project-status">
                <CardBody>
                    <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'start', gap: '16px'}}>
                        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center', gap: '16px', width: '200px'}}>
                            {getTitle("Environment", '90px')}
                            <Badge className="badge">{env}</Badge>
                        </div>
                        <div style={{flex: '2', display: 'flex', flexDirection: 'row', justifyContent: 'end', alignItems: 'center', gap: '16px'}}>
                            {env === config.environment && config.infrastructure !== 'kubernetes' && <ContainerButtons env={env}/>}
                            {env === config.environment && config.infrastructure === 'kubernetes' && <DeploymentButtons env={env}/>}
                        </div>
                    </div>
                    {config.infrastructure === 'kubernetes' &&
                        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'start', gap: '16px', paddingTop: '16px'}}>
                            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center', gap: '16px'}}>
                                {getTitle("Deployment", '90px')}
                            </div>
                            <div style={{flex: '3', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '16px'}}>
                                <DeploymentPanel/>
                            </div>
                        </div>
                    }
                    <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'start', gap: '16px', paddingTop: '16px'}}>
                        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center', gap: '16px'}}>
                            {getTitle("Containers", '90px')}
                        </div>
                        <div style={{flex: '3', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '16px'}}>
                            <ContainerEnvironmentPanel env={env}/>
                        </div>
                    </div>
                </CardBody>
            </Card>
    </PageSection>
    )
}
