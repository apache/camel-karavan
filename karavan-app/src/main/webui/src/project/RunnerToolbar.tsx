import React, {useEffect, useState} from 'react';
import {
    Button, FlexItem,
    Tooltip,
    TooltipPosition
} from '@patternfly/react-core';
import '../designer/karavan.css';
import RocketIcon from "@patternfly/react-icons/dist/esm/icons/rocket-icon";
import ReloadIcon from "@patternfly/react-icons/dist/esm/icons/bolt-icon";
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import {KaravanApi} from "../api/KaravanApi";
import {useAppConfigStore, useProjectStore} from "../api/ProjectStore";
import {ProjectService} from "../api/ProjectService";


export const RunnerToolbar = () => {

    const [isStartingPod, setIsStartingPod] = useState(false);
    const [isDeletingPod, setIsDeletingPod] = useState(false);
    const [isReloadingPod, setIsReloadingPod] = useState(false);
    const {config} = useAppConfigStore();
    const {project, podStatus} = useProjectStore();

    function isRunning() {
        return podStatus.started;
    }

    useEffect(() => {
        console.log("Runner toolbar", podStatus);
        const interval = setInterval(() => {
            if (isRunning()) {
                ProjectService.getRunnerPodStatus(project);
                if (isStartingPod) setIsStartingPod(false);
            }
        }, 1000);
        return () => {
            clearInterval(interval)
        };

    }, []);

    function jbangRun() {
        setIsStartingPod(true);
        ProjectService.runProject(project);
    }

    function reloadRunner() {
        setIsReloadingPod(true);
        KaravanApi.getRunnerReload(project.projectId, res => {
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
        KaravanApi.deleteRunner(project.projectId + "-runner", false, res => {
            if (res.status === 202) {
                setIsDeletingPod(false);
            } else {
                // Todo notification
                setIsDeletingPod(false);
            }
        });
    }

    return (<>
        {!isRunning() && <FlexItem>
            <Tooltip content="Run in development mode" position={TooltipPosition.bottomEnd}>
                <Button isLoading={isStartingPod ? true : undefined}
                        isSmall
                        variant={"primary"}
                        className="project-button"
                        icon={!isStartingPod ? <RocketIcon/> : <div></div>}
                        onClick={() => jbangRun()}>
                    {isStartingPod ? "..." : "Run"}
                </Button>
            </Tooltip>
        </FlexItem>}
        {isRunning() && <FlexItem>
            <Tooltip content="Reload" position={TooltipPosition.bottomEnd}>
                <Button isLoading={isReloadingPod ? true : undefined}
                        isSmall
                        variant={"primary"}
                        className="project-button"
                        icon={!isReloadingPod ? <ReloadIcon/> : <div></div>}
                        onClick={() => reloadRunner()}>
                    {isReloadingPod ? "..." : "Reload"}
                </Button>
            </Tooltip>
        </FlexItem>}
        {isRunning() && <FlexItem>
        <Tooltip content="Stop runner" position={TooltipPosition.bottomEnd}>
            <Button isLoading={isDeletingPod ? true : undefined}
                    isSmall
                    variant={"secondary"}
                    className="project-button"
                    icon={!isRunning ? <DeleteIcon/> : <div></div>}
                    onClick={() => deleteRunner()}>
                {isDeletingPod ? "..." : "Stop"}
            </Button>
        </Tooltip>
        </FlexItem>}
    </>);
}
