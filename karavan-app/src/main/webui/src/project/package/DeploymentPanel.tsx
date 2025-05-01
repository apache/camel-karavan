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
    Flex,
    FlexItem,
    Label,
    LabelGroup,
    Tooltip,
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import UpIcon from "@patternfly/react-icons/dist/esm/icons/running-icon";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import {useProjectStore, useStatusesStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";

export function DeploymentPanel () {

    const [project] = useProjectStore((s) => [s.project], shallow);
    const [deployments] = useStatusesStore((s) => [s.deployments], shallow);

    const deploymentStatus = deployments.find(d => d.projectId === project?.projectId);
    const ok = (deploymentStatus && deploymentStatus?.readyReplicas > 0
        && (deploymentStatus.unavailableReplicas === 0 || deploymentStatus.unavailableReplicas === undefined || deploymentStatus.unavailableReplicas === null)
        && deploymentStatus?.replicas === deploymentStatus?.readyReplicas)

    return (
        <Flex justifyContent={{default: "justifyContentSpaceBetween"}} alignItems={{default: "alignItemsCenter"}}>
            <FlexItem flex={{default: 'flex_2'}}>
                {deploymentStatus && <LabelGroup numLabels={3}>
                    <Tooltip content={"Ready Replicas / Replicas"} position={"left"}>
                        <Label icon={ok ? <UpIcon/> : <DownIcon/>}
                               color={ok ? "green" : "grey"}>{"Replicas: " + deploymentStatus.readyReplicas + " / " + deploymentStatus.replicas}</Label>
                    </Tooltip>
                    {deploymentStatus.unavailableReplicas > 0 &&
                        <Tooltip content={"Unavailable replicas"} position={"right"}>
                            <Label icon={<DownIcon/>} color={"red"}>{deploymentStatus.unavailableReplicas}</Label>
                        </Tooltip>
                    }
                </LabelGroup>}
                {deploymentStatus === undefined && <Label icon={<DownIcon/>} color={"grey"}>No deployments</Label>}
            </FlexItem>
        </Flex>
    )
}
