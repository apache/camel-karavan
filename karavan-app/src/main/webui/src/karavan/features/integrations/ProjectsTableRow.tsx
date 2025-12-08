import React from 'react';
import {Badge, Button, Flex, FlexItem, Label, Tooltip} from '@patternfly/react-core';
import './Complexity.css';
import {Td, Tr} from "@patternfly/react-table";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-circle-icon";
import CopyIcon from "@patternfly/react-icons/dist/esm/icons/copy-icon";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import CheckIcon from "@patternfly/react-icons/dist/js/icons/check-icon";
import {shallow} from "zustand/shallow";
import {useNavigate} from "react-router-dom";
import {BUILD_IN_PROJECTS, Project} from "@models/ProjectModels";
import {useAppConfigStore, useProjectStore, useStatusesStore} from "@stores/ProjectStore";
import {ProjectZipApi} from "./ProjectZipApi";
import {ComplexityProject} from "./ComplexityModels";
import {ProjectsTableRowComplexity} from "./ProjectsTableRowComplexity";
import {ProjectsTableRowActivity} from "./ProjectsTableRowActivity";
import FileSaver from "file-saver";
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import {ROUTES} from "@app/navigation/Routes";
import {ProjectStatusLabel} from "@features/integrations/ProjectStatusLabel";

TimeAgo.addDefaultLocale(en)

interface Props {
    project: Project
    complexity: ComplexityProject
    activeUsers: string[]
    labels: string[]
    selectedLabels: string[]
    onLabelClick: (label: string) => void
}

export function ProjectsTableRow(props: Props) {

    const [deployments, containers] = useStatusesStore((state) => [state.deployments, state.containers], shallow)
    const {config} = useAppConfigStore();
    const [setProject] = useProjectStore((state) => [state.setProject], shallow);
    const navigate = useNavigate();

    function getEnvironments(): string [] {
        return config.environments && Array.isArray(config.environments) ? Array.from(config.environments) : [];
    }

    function getStatusByEnvironments(projectId: string): [string, any, boolean] [] {
        return getEnvironments().map(e => {
            const env: string = e as string;
            if (config.infrastructure === 'kubernetes') {
                if (env === 'dev') {
                    const statusD = deployments.find(d => d.projectId === projectId && d.env === env && d.readyReplicas === d.replicas);
                    const statusC = containers.find(d => d.projectId === projectId && d.containerName === projectId && d.env === env && d.state === 'running' && d.type === 'devmode')
                    return [env, (statusD !== undefined && statusD != null) || (statusC !== undefined && statusC != null), (statusC !== undefined && statusC != null)];
                } else {
                    const status = deployments.find(d => d.projectId === projectId && d.env === env && d.readyReplicas === d.replicas);
                    return [env, (status !== undefined && status != null), false];
                }
            } else {
                const status = containers.find(d => d.projectId === projectId && d.containerName === projectId && d.env === env && d.state === 'running');
                return [env, (status !== undefined && status != null), status?.type === 'devmode'];
            }
        });
    }

    function downloadProject(projectId: string) {
        ProjectZipApi.downloadZip(projectId, data => {
            FileSaver.saveAs(data, projectId + ".zip");
        });
    }

    function getLastUpdateCell() {
        const commit = project.lastCommit ? project.lastCommit?.substr(0, 7) : undefined;
        const commitTimeStamp = commit !== undefined ? project.lastCommitTimestamp : 0;
        const lastUpdateDate = complexity.lastUpdateDate;
        const lastUpdateNotCommited = lastUpdateDate > commitTimeStamp;
        const timeAgo = new TimeAgo('en-US')
        if (lastUpdateNotCommited) {
            return (<div style={{textWrap: 'nowrap'}}>{timeAgo.format(new Date(lastUpdateDate))}</div>)
        } else {
            return (
                <Label color='green' icon={<CheckIcon/>}>
                    <div style={{textWrap: 'nowrap'}}>{timeAgo.format(new Date(commitTimeStamp))}</div>
                </Label>
            )
        }
    }

    const {project, complexity, activeUsers, labels, selectedLabels, onLabelClick} = props;
    const isBuildIn = BUILD_IN_PROJECTS.includes(project.projectId);
    return (
        <Tr key={project.projectId} style={{verticalAlign: "middle"}}>
            <Td modifier='fitContent' style={{paddingInlineEnd: 0, paddingInlineStart: '6px'}}>
                {!isBuildIn && <ProjectStatusLabel project={project}/>}
            </Td>
            <Td>
                <Button style={{padding: '6px', paddingInlineStart: 0}} variant={"link"} onClick={e => {
                    navigate(`${ROUTES.INTEGRATIONS}/${project.projectId}`);
                }}>
                    {project.projectId}
                </Button>
            </Td>
            <Td>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'start', justifyContent: 'start', gap: '3px'}}>
                    <div>
                        {project.name}
                    </div>
                    {labels.length > 0 &&
                        <div style={{display: 'flex', flexDirection: 'row', gap: '3px'}}>
                            {labels.map((label) => (
                                <Badge key={label} isRead={!selectedLabels.includes(label)} style={{fontWeight: 'normal', cursor: 'pointer'}}
                                       onClick={event => onLabelClick(label)}>
                                    {label}
                                </Badge>
                            ))}
                        </div>
                    }
                </div>
            </Td>
            <Td isActionCell>
                <div style={{display: "flex", gap: "3px", marginLeft: '16px', marginRight: '16px'}}>
                    {getLastUpdateCell()}
                </div>
            </Td>
            <Td noPadding textCenter>
                {!isBuildIn && <ProjectsTableRowComplexity complexity={complexity}/>}
            </Td>
            <Td noPadding>
                {!isBuildIn && <ProjectsTableRowActivity activeUsers={activeUsers}/>}
            </Td>
            <Td className="project-action-buttons" modifier={"fitContent"}>
                <Flex direction={{default: "row"}} justifyContent={{default: "justifyContentFlexEnd"}} spaceItems={{default: 'spaceItemsNone'}} flexWrap={{default: 'nowrap'}}>
                    {!isBuildIn &&
                        <FlexItem>
                            <Tooltip content={"Delete"} position={"bottom"}>
                                <Button className="dev-action-button" variant={"link"} isDanger icon={<DeleteIcon/>} onClick={e => {
                                    setProject(project, "delete");
                                }}></Button>
                            </Tooltip>
                        </FlexItem>
                    }
                    {!isBuildIn &&
                        <FlexItem>
                            <Tooltip content={"Copy"} position={"bottom"}>
                                <Button className="dev-action-button" variant={"link"} icon={<CopyIcon/>}
                                        onClick={e => {
                                            setProject(project, "copy");
                                        }}></Button>
                            </Tooltip>
                        </FlexItem>
                    }
                    <FlexItem>
                        <Tooltip content={"Export"} position={"bottom-end"}>
                            <Button className="dev-action-button" variant={"link"} icon={<DownloadIcon/>}
                                    onClick={e => {
                                        downloadProject(project.projectId);
                                    }}></Button>
                        </Tooltip>
                    </FlexItem>
                </Flex>
            </Td>
        </Tr>
    )
}