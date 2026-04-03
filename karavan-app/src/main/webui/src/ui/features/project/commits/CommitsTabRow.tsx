import React, {useState} from 'react';
import {Tbody, Td, Tr} from '@patternfly/react-table';
import {ProjectFolderCommit} from "@stores/CommitsStore";
import TimeAgo from "javascript-time-ago";
import {Project} from "@models/ProjectModels";
import GitDiffViewer from "@features/project/commits/GitDiffViewer";
import {ArrowRightIcon} from "@patternfly/react-icons";
import {Card, CardBody, CardHeader, Content, Divider} from "@patternfly/react-core";

interface CommitsTabRowProps {
    commit: ProjectFolderCommit,
    rowIndex: number,
    project: Project,
}

function CommitsTabRow(props: CommitsTabRowProps) {

    const {commit, rowIndex, project} = props;
    const [expanded, setExpanded] = useState<boolean>(false);
    const timeAgo = new TimeAgo('en-US')
    const diffs = commit.diffs.filter(diff => diff.newPath?.startsWith(project.projectId));
    return (
        <Tbody key={rowIndex} isExpanded={expanded}>
            <Tr key={rowIndex} style={{verticalAlign: "middle"}} isContentExpanded={expanded}>
                <Td
                    expand={
                        {
                            rowIndex,
                            isExpanded: expanded,
                            onToggle: () => setExpanded(!expanded),
                            expandId: 'composable-expandable-example'
                        }
                    }
                />
                <Td style={{verticalAlign: "middle", fontFamily: "monospace"}}>
                    {commit.id.substring(0, 8)}
                </Td>
                <Td modifier={"fitContent"} style={{textAlign: "right"}}>
                    {timeAgo.format(new Date(commit.commitTime))}
                </Td>
                <Td>{commit.authorName}</Td>
                <Td>{commit.authorEmail}</Td>
                <Td modifier={"wrap"}>
                    {commit.message}
                </Td>
                <Td modifier='fitContent' style={{textAlign: "right"}}>
                    {diffs?.length}
                </Td>
            </Tr>
            <Tr isExpanded={expanded}>
                <Td/>
                <Td colSpan={5}>
                    <div style={{display: "flex", flexDirection: "column"}}>
                        {diffs.map((diff, index) => {
                            const oldPath = diff.oldPath?.replace(`${project.projectId}/`, "");
                            const newPath = diff.newPath?.replace(`${project.projectId}/`, "");
                            return (
                                <Card key={index} isCompact>
                                    <CardHeader>
                                        <div style={{display: "flex", flexDirection: "row", gap: 16, justifyContent: "space-between", alignItems: "center", fontWeight: "bold"}}>
                                            <div>{diff.changeType}</div>
                                            <div>{oldPath}</div>
                                            <ArrowRightIcon/>
                                            <div>{newPath}</div>
                                            <div style={{flex: 1}}>
                                                <Content component={'p'} style={{textAlign: 'end'}}>{new Date(commit.commitTime).toISOString()}</Content>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <Divider/>
                                    <CardBody>
                                        <GitDiffViewer
                                            originalText={diff.before}
                                            modifiedText={diff.after}/>
                                    </CardBody>
                                </Card>
                            )
                        })}
                    </div>
                </Td>
            </Tr>
        </Tbody>
    )
}

export default CommitsTabRow