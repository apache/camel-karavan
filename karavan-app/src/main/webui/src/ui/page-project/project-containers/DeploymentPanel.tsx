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
import {Flex, FlexItem, Label, LabelGroup, Tooltip,} from '@patternfly/react-core';
import '@designer/karavan.css';
import {ErrorCircleOIcon, RunningIcon} from "@patternfly/react-icons";
import {useProjectStore} from "@stores/ProjectStore";
import {useDeploymentStatusesStore} from "@stores/DeploymentStatusesStore";

export function DeploymentPanel () {

    const project = useProjectStore(s => s.project);
    const deployments = useDeploymentStatusesStore((s) => s.deployments);

    const deploymentStatus = deployments.find(d => d.projectId === project?.projectId);
    const ok = (deploymentStatus && deploymentStatus?.readyReplicas > 0
        && (deploymentStatus.unavailableReplicas === 0 || deploymentStatus.unavailableReplicas === undefined || deploymentStatus.unavailableReplicas === null)
        && deploymentStatus?.replicas === deploymentStatus?.readyReplicas)

    return (
        <Flex justifyContent={{default: "justifyContentSpaceBetween"}} alignItems={{default: "alignItemsCenter"}}
              style={{paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16}}
        >
            <FlexItem flex={{default: 'flex_2'}}>
                {deploymentStatus && <LabelGroup numLabels={3}>
                    <Tooltip content={"Ready Replicas / Replicas"} position={"left"}>
                        <Label icon={ok ? <RunningIcon/> : <ErrorCircleOIcon/>}
                               color={ok ? "green" : "grey"}>{"Replicas: " + deploymentStatus.readyReplicas + " / " + deploymentStatus.replicas}</Label>
                    </Tooltip>
                    {deploymentStatus.unavailableReplicas > 0 &&
                        <Tooltip content={"Unavailable replicas"} position={"right"}>
                            <Label icon={<ErrorCircleOIcon/>} color={"red"}>{deploymentStatus.unavailableReplicas}</Label>
                        </Tooltip>
                    }
                </LabelGroup>}
                {deploymentStatus === undefined && <Label icon={<ErrorCircleOIcon/>} color={"grey"}>No deployments</Label>}
            </FlexItem>
        </Flex>
    )
}
