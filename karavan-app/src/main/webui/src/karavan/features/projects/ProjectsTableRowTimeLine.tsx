import React from 'react';
import {Label, ProgressStep, ProgressStepper} from '@patternfly/react-core';
import '@features/projects/Complexity.css';
import {Project, ProjectCommited} from "@models/ProjectModels";
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import './ProjectsTableRowTimeLine.css'
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import {InProgress} from "@carbon/icons-react";

TimeAgo.addDefaultLocale(en)

interface Props {
    project: Project
    projectCommited?: ProjectCommited
}

export function ProjectsTableRowTimeLine(props: Props) {

    const {project, projectCommited} = props;
    const timeAgo = new TimeAgo('en-US')

    const commitTimeStamp = projectCommited !== undefined ? projectCommited.lastCommitTimestamp : 0;
    const commited = commitTimeStamp !== 0;
    const lastUpdate = project.lastUpdate;
    const synced = lastUpdate === commitTimeStamp;
    const commitIcon = commited ? <CheckCircleIcon/> : undefined;
    const commitLabel = commited ? timeAgo.format(new Date(commitTimeStamp)) : 'No commits yet';
    const savedIcon = synced ? <CheckCircleIcon/> : <InProgress/>;
    const savedLabel = synced ? '' : timeAgo.format(new Date(lastUpdate));
    return (
        <div className="projects-table-progress-stepper-wrapper">
            <ProgressStepper isCenterAligned className={"projects-table-progress-stepper"}>
                <ProgressStep icon={commitIcon} variant={commited ? "success" : "default"} id="commit" titleId="commit" aria-label="commit">
                    {!synced && <div style={{textWrap: 'nowrap'}}>{commitLabel}</div>}
                </ProgressStep>
                <ProgressStep icon={savedIcon} isCurrent={!synced} variant={synced ? "success" : "default"} id="saved" titleId="saved" aria-label="saved">
                    <div style={{textWrap: 'nowrap'}}>{savedLabel}</div>
                </ProgressStep>
            </ProgressStepper>
            {synced &&
                <Label color={"green"} isCompact className={"commit-label"}>
                    {commitLabel}
                </Label>
            }
        </div>
    )
}