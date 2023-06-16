import React, {useEffect, useRef, useState} from 'react';
import {
    Card,
    CardBody, Flex, FlexItem, Divider
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {PodStatus, Project} from "./ProjectModels";
import {RunnerToolbar} from "./RunnerToolbar";
import {RunnerInfoPod} from "./RunnerInfoPod";
import {RunnerInfoContext} from "./RunnerInfoContext";
import {RunnerInfoMemory} from "./RunnerInfoMemory";
import {KaravanApi} from "../api/KaravanApi";
import {ProjectEventBus} from "./ProjectEventBus";
import {RunnerInfoTrace} from "./RunnerInfoTrace";

export function isRunning(status: PodStatus): boolean {
    return status.phase === 'Running' && !status.terminating;
}


interface Props {
    project: Project,
    config: any,
}

export const ProjectDevelopment = (props: Props) => {

    const [podStatus, setPodStatus] = useState(new PodStatus());
    const previousValue = useRef(new PodStatus());
    const [memory, setMemory] = useState({});
    const [jvm, setJvm] = useState({});
    const [context, setContext] = useState({});
    const [trace, setTrace] = useState({});
    const [showTrace, setShowTrace] = useState(false);
    const [refreshTrace, setRefreshTrace] = useState(true);


    useEffect(() => {
        previousValue.current = podStatus;
        const sub1 = ProjectEventBus.onShowTrace()?.subscribe((result) => {
            if (result) setShowTrace(result.show);
        });
        const sub2 = ProjectEventBus.onRefreshTrace()?.subscribe((result) => {
            setRefreshTrace(result);
        });
        const interval = setInterval(() => {
            onRefreshStatus();
        }, 1000);
        return () => {
            sub1.unsubscribe();
            sub2.unsubscribe();
            clearInterval(interval)
        };

    }, [podStatus]);

    function onRefreshStatus() {
        const projectId = props.project.projectId;
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
        if (refreshTrace) {
            KaravanApi.getRunnerConsoleStatus(projectId, "trace", res => {
                if (res.status === 200) {
                    setTrace(res.data);
                } else {
                    setTrace({});
                }
            })
        }
    }

    function showConsole(): boolean {
        return podStatus.phase !== '';
    }

    const {project, config} = props;
    return (
        <Card className="project-development">
            <CardBody>
                <Flex direction={{default: "row"}}
                      justifyContent={{default: "justifyContentSpaceBetween"}}>
                    {!showTrace && <FlexItem flex={{default: "flex_1"}}>
                        <RunnerInfoPod podStatus={podStatus} config={config} showConsole={showConsole()}/>
                    </FlexItem>}
                    {showConsole() && !showTrace && <>
                        <Divider orientation={{default: "vertical"}}/>
                        <FlexItem flex={{default: "flex_1"}}>
                            <RunnerInfoMemory jvm={jvm} memory={memory} config={config} showConsole={showConsole()}/>
                        </FlexItem>
                        <Divider orientation={{default: "vertical"}}/>
                        <FlexItem flex={{default: "flex_1"}}>
                            <RunnerInfoContext context={context} config={config} showConsole={showConsole()}/>
                        </FlexItem>
                    </>}
                    {showConsole() && showTrace && <FlexItem flex={{default: "flex_1"}} style={{margin:"0"}}>
                        <RunnerInfoTrace trace={trace} refreshTrace={refreshTrace}/>
                    </FlexItem>}
                    <Divider orientation={{default: "vertical"}}/>
                    <FlexItem>
                        <RunnerToolbar project={project} config={config} showConsole={showConsole()} reloadOnly={false}/>
                    </FlexItem>
                </Flex>
            </CardBody>
        </Card>
    )
}
