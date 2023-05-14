import React, {useState} from 'react';
import {
    Button, Label, Switch, Tab, Tabs,
    Tooltip,
    TooltipPosition
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {Project} from "./ProjectModels";
import RocketIcon from "@patternfly/react-icons/dist/esm/icons/rocket-icon";
import ReloadIcon from "@patternfly/react-icons/dist/esm/icons/bolt-icon";
import TraceIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import {KaravanApi} from "../api/KaravanApi";
import {ProjectEventBus} from "./ProjectEventBus";


interface Props {
    project: Project,
    config: any,
    showConsole: boolean
}

export const RunnerToolbar = (props: Props) => {

    const [podName, setPodName] = useState(props.project.projectId + '-runner');
    const [isJbangRunning, setJbangIsRunning] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [isDeletingPod, setIsDeletingPod] = useState(false);
    const [isReloadingPod, setIsReloadingPod] = useState(false);
    const [isShowingTrace, setIsShowingTrace] = useState(false);

    function jbangRun() {
        setJbangIsRunning(true);
        KaravanApi.runProject(props.project, res => {
            if (res.status === 200 || res.status === 201) {
                setJbangIsRunning(false);
                setPodName(res.data);
                ProjectEventBus.showLog('container', res.data, props.config.environment)
            } else {
                // Todo notification
                setJbangIsRunning(false);
            }
        });
    }

    function reloadRunner() {
        setIsReloadingPod(true);
        KaravanApi.getRunnerReload(props.project.projectId, res => {
            if (res.status === 200 || res.status === 201) {
                setIsReloadingPod(false);
            } else {
                // Todo notification
                setIsReloadingPod(false);
            }
        });
    }

    function deleteRunner() {
        setIsDeletingPod(true);
        KaravanApi.deleteRunner(podName, false, res => {
            if (res.status === 202) {
                setIsDeletingPod(false);
            } else {
                // Todo notification
                setIsDeletingPod(false);
            }
        });
    }

    function showTrace() {
        ProjectEventBus.showTrace(props.project.projectId, !isShowingTrace);
        setIsShowingTrace((prevState) => !prevState);
    }

    return (
            <div className="runner-toolbar">
                {!props.showConsole &&
                    <div className="row">
                        <Tooltip content="Run in development mode" position={TooltipPosition.left}>
                            <Button isLoading={isJbangRunning ? true : undefined}
                                    isSmall
                                    variant={"primary"}
                                    className="project-button"
                                    icon={!isJbangRunning ? <RocketIcon/> : <div></div>}
                                    onClick={() => jbangRun()}>
                                {isJbangRunning ? "..." : "Run"}
                            </Button>
                        </Tooltip>
                    </div>}
                {props.showConsole && <>
                    <div className="row">
                        <Tooltip content="Reload" position={TooltipPosition.left}>
                            <Button isLoading={isReloadingPod ? true : undefined}
                                    isSmall
                                    variant={"primary"}
                                    className="project-button"
                                    icon={!isReloadingPod ? <ReloadIcon/> : <div></div>}
                                    onClick={() => reloadRunner()}>
                                {isReloadingPod ? "..." : "Reload"}
                            </Button>
                        </Tooltip>
                    </div>
                    <div className="row">
                        <Tooltip content="Show trace" position={TooltipPosition.left}>
                            <Button isSmall
                                    variant={"secondary"}
                                    className="project-button"
                                    icon={ <TraceIcon/>}
                                    onClick={() => showTrace()}>
                                {isShowingTrace ? "Runtime" : "Trace"}
                            </Button>
                        </Tooltip>
                    </div>
                    <Tooltip content="Delete runner" position={TooltipPosition.left}>
                        <Button isLoading={isDeletingPod ? true : undefined}
                                isSmall
                                variant={"secondary"}
                                className="project-button"
                                icon={!isRunning ? <DeleteIcon/> : <div></div>}
                                onClick={() => deleteRunner()}>
                            {isDeletingPod ? "..." : "Delete"}
                        </Button>
                    </Tooltip>
                </>}
            </div>
    );
}
