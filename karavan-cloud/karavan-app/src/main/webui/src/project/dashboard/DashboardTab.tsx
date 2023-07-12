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
import React, {useEffect, useState} from 'react';
import {
    Card,
    CardBody, Flex, FlexItem, Divider, PageSection
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {InfoPod} from "./InfoPod";
import {InfoContext} from "./InfoContext";
import {InfoMemory} from "./InfoMemory";
import {KaravanApi} from "../../api/KaravanApi";
import {useProjectStore} from "../../api/ProjectStore";

export const DashboardTab = () => {

    const {project, podStatus} = useProjectStore();
    const [memory, setMemory] = useState({});
    const [jvm, setJvm] = useState({});
    const [context, setContext] = useState({});

    useEffect(() => {
        const interval = setInterval(() => {
            onRefreshStatus();
        }, 2000);
        return () => {
            clearInterval(interval)
        };

    }, [podStatus]);

    function onRefreshStatus() {
        const projectId = project.projectId;
        KaravanApi.getDevModeStatus(projectId, "memory", res => {
            if (res.status === 200) {
                setMemory(res.data);
            } else {
                setMemory({});
            }
        })
        KaravanApi.getDevModeStatus(projectId, "jvm", res => {
            if (res.status === 200) {
                setJvm(res.data);
            } else {
                setJvm({});
            }
        })
        KaravanApi.getDevModeStatus(projectId, "context", res => {
            if (res.status === 200) {
                setContext(res.data);
            } else {
                setContext({});
            }
        })
    }

    function showConsole(): boolean {
        return podStatus.ready;
    }

    return (
        <PageSection className="project-tab-panel" padding={{default: "padding"}}>
            <Card className="project-development">
                <CardBody>
                    <Flex direction={{default: "row"}}
                          justifyContent={{default: "justifyContentSpaceBetween"}}>
                        <FlexItem flex={{default: "flex_1"}}>
                            <InfoPod podStatus={podStatus}/>
                        </FlexItem>
                        <Divider orientation={{default: "vertical"}}/>
                        <FlexItem flex={{default: "flex_1"}}>
                            <InfoMemory jvm={jvm} memory={memory} showConsole={showConsole()}/>
                        </FlexItem>
                        <Divider orientation={{default: "vertical"}}/>
                        <FlexItem flex={{default: "flex_1"}}>
                            <InfoContext context={context} showConsole={showConsole()}/>
                        </FlexItem>
                    </Flex>
                </CardBody>
            </Card>
        </PageSection>
    )
}
