import React from 'react';
import {Badge, Button, Flex, FlexItem, Label, Tooltip} from '@patternfly/react-core';
import './Complexity.css';
import {Td, Tr} from "@patternfly/react-table";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-circle-icon";
import CopyIcon from "@patternfly/react-icons/dist/esm/icons/copy-icon";
import DevmodeIcon from "@patternfly/react-icons/dist/js/icons/dev-icon";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import CheckIcon from "@patternfly/react-icons/dist/js/icons/check-icon";
import {shallow} from "zustand/shallow";
import {useNavigate} from "react-router-dom";
import {BUILD_IN_PROJECTS, Project} from "@/api/ProjectModels";
import {useAppConfigStore, useLogStore, useProjectStore, useStatusesStore} from "@/api/ProjectStore";
import {ProjectZipApi} from "./ProjectZipApi";
import {ComplexityProject} from "./ComplexityModels";
import {ProjectsTableRowComplexity} from "./ProjectsTableRowComplexity";
import {ProjectsTableRowActivity} from "./ProjectsTableRowActivity";
import FileSaver from "file-saver";
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import {PackageIcon} from '@patternfly/react-icons';
import {ROUTES} from "@/custom/Routes";

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
    const [setProject] = useProjectStore((state) => [state.setProject, state.setOperation], shallow);
    const [setShowLog] = useLogStore((state) => [state.setShowLog], shallow);
    const navigate = useNavigate();

    function getEnvironments(): string [] {
        return config.environments && Array.isArray(config.environments) ? Array.from(config.environments) : [];
    }

    function getStatusByEnvironments(name: string): [string, any, boolean] [] {
        return getEnvironments().map(e => {
            const env: string = e as string;
            if (config.infrastructure === 'kubernetes') {
                if (env === 'dev') {
                    const statusD = deployments.find(d => d.projectId === name && d.env === env && d.readyReplicas === d.replicas);
                    const statusC = containers.find(d => d.projectId === name && d.containerName === name && d.env === env && d.state === 'running' && d.type === 'devmode')
                    return [env, (statusD !== undefined && statusD != null) || (statusC !== undefined && statusC != null), (statusC !== undefined && statusC != null)];
                } else {
                    const status = deployments.find(d => d.projectId === name && d.env === env && d.readyReplicas === d.replicas);
                    return [env, (status !== undefined && status != null), false];
                }
            } else {
                const status = containers.find(d => d.projectId === name && d.containerName === name && d.env === env && d.state === 'running');
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
        <Tr key={project.projectId}>
            <Td style={{verticalAlign: "middle"}}>
                <Button style={{padding: '6px'}} variant={"link"} onClick={e => {
                    // setProject(project, "select");
                    setShowLog(false, 'none');
                    // ProjectEventBus.selectProject(project);
                    navigate(`${ROUTES.INTEGRATIONS}/${project.projectId}`);
                }}>
                    {project.projectId}
                </Button>
            </Td>
            <Td style={{verticalAlign: "middle"}}>
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
            <Td style={{verticalAlign: "middle"}} isActionCell>
                <div style={{display: "flex", gap: "3px", marginLeft: '16px', marginRight: '16px'}}>
                    {getLastUpdateCell()}
                </div>
            </Td>
            <Td noPadding textCenter style={{verticalAlign: "middle"}}>
                {!isBuildIn &&
                    <div style={{display: "flex", gap: "3px", justifyContent: 'center', marginLeft: '16px', marginRight: '16px'}}>
                        {getStatusByEnvironments(project.projectId).map(value => {
                            const env = value[0];
                            const active = value[1];
                            const color = active ? "green" : "grey"
                            const style = active ? {fontWeight: "bold"} : {}
                            const isDevmode = value[2];
                            const icon = isDevmode ? <DevmodeIcon/> : <PackageIcon/>;
                            const showIcon = env === 'dev' && active;
                            return (
                                <Label key={value.toString()} style={style} color={color} className='env-label' icon={showIcon && icon}>
                                    {value[0]}
                                </Label>
                            )
                        })}
                    </div>
                }
            </Td>
            <Td noPadding textCenter style={{verticalAlign: "middle"}}>
                {!isBuildIn && <ProjectsTableRowComplexity complexity={complexity}/>}
            </Td>
            <Td noPadding style={{verticalAlign: "middle"}}>
                {!isBuildIn && <ProjectsTableRowActivity activeUsers={activeUsers}/>}
            </Td>
            <Td className="project-action-buttons" modifier={"fitContent"} style={{verticalAlign: "middle"}}>
                {!isBuildIn &&
                    <Flex direction={{default: "row"}} justifyContent={{default: "justifyContentFlexEnd"}} spaceItems={{default: 'spaceItemsNone'}} flexWrap={{default: 'nowrap'}}>
                        <FlexItem>
                            <Tooltip content={"Delete Integration"} position={"bottom"}>
                                <Button className="dev-action-button" variant={"link"} isDanger icon={<DeleteIcon/>} onClick={e => {
                                    setProject(project, "delete");
                                }}></Button>
                            </Tooltip>
                        </FlexItem>
                        <FlexItem>
                            <Tooltip content={"Copy Integration"} position={"bottom"}>
                                <Button className="dev-action-button" variant={"plain"} icon={<CopyIcon/>}
                                        onClick={e => {
                                            setProject(project, "copy");
                                        }}></Button>
                            </Tooltip>
                        </FlexItem>
                        <FlexItem>
                            <Tooltip content={"Export Integration"} position={"bottom-end"}>
                                <Button className="dev-action-button" variant={"plain"} icon={<DownloadIcon/>}
                                        onClick={e => {
                                            downloadProject(project.projectId);
                                        }}></Button>
                            </Tooltip>
                        </FlexItem>
                    </Flex>
                }
            </Td>
        </Tr>
    )
}