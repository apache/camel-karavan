import React, {useEffect, useRef, useState} from 'react';
import {
    Card,
    CardBody, Flex, FlexItem, Divider, PageSection
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {PodStatus} from "../ProjectModels";
import {RunnerInfoPod} from "./RunnerInfoPod";
import {RunnerInfoContext} from "./RunnerInfoContext";
import {RunnerInfoMemory} from "./RunnerInfoMemory";
import {KaravanApi} from "../../api/KaravanApi";
import {ProjectEventBus} from "../ProjectEventBus";
import {useProjectStore} from "../ProjectStore";

export function isRunning(status: PodStatus): boolean {
    return status.phase === 'Running' && !status.terminating;
}

interface Props {
    config: any,
}

export const DashboardTab = (props: Props) => {

    const {project, setProject} = useProjectStore();
    const [podStatus, setPodStatus] = useState(new PodStatus());
    const previousValue = useRef(new PodStatus());
    const [memory, setMemory] = useState({});
    const [jvm, setJvm] = useState({});
    const [context, setContext] = useState({});

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
                    ProjectEventBus.showLog('container', res.data.name, props.config.environment);
                }
            } else {
                ProjectEventBus.showLog('container', name, props.config.environment, false);
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

    const {config} = props;
    return (
        <PageSection className="project-bottom" padding={{default: "padding"}}>
            <Card className="project-development">
                <CardBody>
                    <Flex direction={{default: "row"}}
                          justifyContent={{default: "justifyContentSpaceBetween"}}>
                        <FlexItem flex={{default: "flex_1"}}>
                            <RunnerInfoPod podStatus={podStatus} config={config}/>
                        </FlexItem>
                        <Divider orientation={{default: "vertical"}}/>
                        <FlexItem flex={{default: "flex_1"}}>
                            <RunnerInfoMemory jvm={jvm} memory={memory} config={config} showConsole={showConsole()}/>
                        </FlexItem>
                        <Divider orientation={{default: "vertical"}}/>
                        <FlexItem flex={{default: "flex_1"}}>
                            <RunnerInfoContext context={context} config={config} showConsole={showConsole()}/>
                        </FlexItem>
                    </Flex>
                </CardBody>
            </Card>
        </PageSection>
    )
}
