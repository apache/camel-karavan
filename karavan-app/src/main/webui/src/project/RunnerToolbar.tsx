import React, {useEffect, useState} from 'react';
import {
    Button,
    Tooltip,
    TooltipPosition
} from '@patternfly/react-core';
import '../designer/karavan.css';
import RocketIcon from "@patternfly/react-icons/dist/esm/icons/rocket-icon";
import ReloadIcon from "@patternfly/react-icons/dist/esm/icons/bolt-icon";
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import {KaravanApi} from "../api/KaravanApi";
import {Project} from "../api/ProjectModels";
import {ProjectEventBus} from "../api/ProjectEventBus";
import {useAppConfigStore} from "../api/ProjectStore";


interface Props {
    project: Project,
    showConsole: boolean,
    reloadOnly: boolean
}

export const RunnerToolbar = (props: Props) => {

    const [podName, setPodName] = useState(props.project.projectId + '-runner');
    const [isJbangRunning, setJbangIsRunning] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [isDeletingPod, setIsDeletingPod] = useState(false);
    const [isReloadingPod, setIsReloadingPod] = useState(false);
    const {config} = useAppConfigStore();

    useEffect(() => {
        const sub1 = ProjectEventBus.onCurrentRunner()?.subscribe((result) => {
            setJbangIsRunning(result === props.project.name);
        });
        return () => {
            sub1.unsubscribe();
        };
    });

    function jbangRun() {
        setJbangIsRunning(true);
        KaravanApi.runProject(props.project, res => {
            if (res.status === 200 || res.status === 201) {
                ProjectEventBus.setCurrentRunner(props.project.name);
                setJbangIsRunning(false);
                setPodName(res.data);
                ProjectEventBus.showLog('container', res.data, config.environment)
            } else {
                // Todo notification
                setJbangIsRunning(false);
                ProjectEventBus.setCurrentRunner(undefined);
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
        ProjectEventBus.setCurrentRunner(undefined);
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

    return (
            <div className="runner-toolbar">
                {!props.showConsole && !props.reloadOnly  &&
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
                {props.reloadOnly &&
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
                }
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
                    <Tooltip content="Stop runner" position={TooltipPosition.left}>
                        <Button isLoading={isDeletingPod ? true : undefined}
                                isSmall
                                variant={"secondary"}
                                className="project-button"
                                icon={!isRunning ? <DeleteIcon/> : <div></div>}
                                onClick={() => deleteRunner()}>
                            {isDeletingPod ? "..." : "Stop"}
                        </Button>
                    </Tooltip>
                </>}
            </div>
    );
}
