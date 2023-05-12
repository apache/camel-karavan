import React, {useState} from 'react';
import {
    Button,
    Tooltip,
    TooltipPosition
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {Project} from "./ProjectModels";
import RocketIcon from "@patternfly/react-icons/dist/esm/icons/rocket-icon";
import PlayIcon from "@patternfly/react-icons/dist/esm/icons/play-icon";
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

    function deleteRunner() {
        setIsDeletingPod(true);
        KaravanApi.deleteRunner(podName, res => {
            if (res.status === 202) {
                setIsDeletingPod(false);
            } else {
                // Todo notification
                setIsDeletingPod(false);
            }
        });
    }

    return (
        <React.Fragment>
            <div className="runner-toolbar">
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
                </div>
                {props.showConsole && <>
                    <div className="row">
                        <Tooltip content="Delete pod" position={TooltipPosition.left}>
                            <Button isLoading={isDeletingPod ? true : undefined}
                                    isSmall
                                    variant={"secondary"}
                                    className="project-button"
                                    icon={!isRunning ? <DeleteIcon/> : <div></div>}
                                    onClick={() => deleteRunner()}>
                                {isDeletingPod ? "..." : "Delete"}
                            </Button>
                        </Tooltip>
                    </div>
                </>}
            </div>
        </React.Fragment>
    );
}
