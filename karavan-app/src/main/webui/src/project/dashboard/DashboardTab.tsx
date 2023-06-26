import React, {useEffect, useRef, useState} from 'react';
import {
    Card,
    CardBody, Flex, FlexItem, Divider, PageSection
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {RunnerInfoPod} from "./RunnerInfoPod";
import {RunnerInfoContext} from "./RunnerInfoContext";
import {RunnerInfoMemory} from "./RunnerInfoMemory";
import {KaravanApi} from "../../api/KaravanApi";
import {PodStatus} from "../../api/ProjectModels";
import {useAppConfigStore, useProjectStore} from "../../api/ProjectStore";
import {ProjectEventBus} from "../../api/ProjectEventBus";

export function isRunning(status: PodStatus): boolean {
    return status.phase === 'Running' && !status.terminating;
}

export const DashboardTab = () => {

    const {project, setProject} = useProjectStore();
    const [podStatus, setPodStatus] = useState(new PodStatus());
    const previousValue = useRef(new PodStatus());
    const [memory, setMemory] = useState({});
    const [jvm, setJvm] = useState({});
    const [context, setContext] = useState({});
    const {config} = useAppConfigStore();

    useEffect(() => {
        previousValue.current = podStatus;
        const interval = setInterval(() => {
            onRefreshStatus();
        }, 1000);
        return () => {
            clearInterval(interval)
        };

    }, [podStatus]);

    function onRefreshStatus() {
        const projectId = project.projectId;
        const name = projectId + "-runner";
        KaravanApi.getRunnerPodStatus(projectId, name, res => {
            if (res.status === 200) {
                setPodStatus(res.data);
                if (isRunning(res.data) && !isRunning(previousValue.current)) {
                    ProjectEventBus.showLog('container', res.data.name, config.environment);
                }
            } else {
                ProjectEventBus.showLog('container', name, config.environment, false);
                setPodStatus(new PodStatus({name: name}));
            }
        });
        KaravanApi.getRunnerConsoleStatus(projectId, "memory", res => {
            if (res.status === 200) {
                setMemory(res.data);
            } else {
                setMemory({});
            }
        })
        KaravanApi.getRunnerConsoleStatus(projectId, "jvm", res => {
            if (res.status === 200) {
                setJvm(res.data);
            } else {
                setJvm({});
            }
        })
        KaravanApi.getRunnerConsoleStatus(projectId, "context", res => {
            if (res.status === 200) {
                setContext(res.data);
            } else {
                setContext({});
            }
        })
    }

    function showConsole(): boolean {
        return podStatus.phase !== '';
    }

    return (
        <PageSection className="project-tab-panel" padding={{default: "padding"}}>
            <Card className="project-development">
                <CardBody>
                    <Flex direction={{default: "row"}}
                          justifyContent={{default: "justifyContentSpaceBetween"}}>
                        <FlexItem flex={{default: "flex_1"}}>
                            <RunnerInfoPod podStatus={podStatus} config={config}/>
                        </FlexItem>
                        <Divider orientation={{default: "vertical"}}/>
                        <FlexItem flex={{default: "flex_1"}}>
                            <RunnerInfoMemory jvm={jvm} memory={memory} showConsole={showConsole()}/>
                        </FlexItem>
                        <Divider orientation={{default: "vertical"}}/>
                        <FlexItem flex={{default: "flex_1"}}>
                            <RunnerInfoContext context={context} showConsole={showConsole()}/>
                        </FlexItem>
                    </Flex>
                </CardBody>
            </Card>
        </PageSection>
    )
}
