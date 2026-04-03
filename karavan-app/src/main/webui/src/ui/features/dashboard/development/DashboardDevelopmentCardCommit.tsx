import React from 'react';
import {SystemCommit} from "@stores/CommitsStore";
import {Button, Content, HelperText, HelperTextItem, Label, ProgressStep} from "@patternfly/react-core";
import TimeAgo from "javascript-time-ago";
import {Commit} from "@carbon/icons-react";
import {useActivityStore} from "@stores/ActivityStore";

interface Props {
    commit: SystemCommit
}

export function DashboardDevelopmentCardCommit(props: Props): React.ReactElement {

    const {commit} = props;
    const {usersActivities} = useActivityStore();
    const userHeartbeat = usersActivities?.HEARTBEAT?.[commit.authorName];
    const alive = userHeartbeat !== undefined;
    const commitId = commit.id?.substring((commit.id?.length - 6) || 0);
    const timeAgo = new TimeAgo('en-US')
    const projectsCount = commit?.projectIds?.length || 0;
    const projectId = `${commit?.projectIds?.at(0)}` + (projectsCount > 1 ? ` (+${projectsCount - 1})` : "");

    return (
        <ProgressStep
            className={"commit-progress-step"}
            variant={alive ? "success" : "info"}
            icon={<Commit className={"carbon"} style={{height: "20px", width:"20px"}}/>}
            description={
                <div className={"commit-description"}>
                    <Content component='p' style={{flex: 1, fontWeight: "bold"}}>{commit.authorName}</Content>
                    <Label color="green" variant="filled" isCompact>
                        {timeAgo.format(new Date(commit.commitTime))}
                    </Label>
                </div>
            }
            id={commit.id}
            titleId="basic-alignment-step1-title"
            aria-label="completed step, step with success"
        >
            <HelperText className={"commit-card"}>
                <HelperTextItem>
                    {projectId && <Button variant={"link"} isInline>{projectId}</Button>}
                </HelperTextItem>
                <HelperTextItem>
                    {commit.message}
                </HelperTextItem>
            </HelperText>
        </ProgressStep>
    )
}