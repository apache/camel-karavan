import React from 'react';
import {Badge, Button, Flex, FlexItem, Tooltip} from '@patternfly/react-core';
import {Td, Tr} from "@patternfly/react-table";
import {shallow} from "zustand/shallow";
import {useNavigate} from "react-router-dom";
import FileSaver from "file-saver";
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import {ROUTES} from "@compass/navigation/Routes";
import {ProjectZipApi} from "../ProjectZipApi";
import {ProjectStatusLabel} from "./ProjectStatusLabel";
import {CamelIcon, OpenApiIcon} from "@designer/icons/KaravanIcons";
import {CogIcon, CopyIcon, DownloadIcon, TimesCircleIcon} from "@patternfly/react-icons";
import {BUILD_IN_PROJECTS, Project, ProjectCommited} from "@models/ProjectModels";
import {ComplexityProject} from "@models/ComplexityModels";
import {PROJECT_WITH_NO_LABELS, useProjectStore} from "@stores/ProjectStore";
import {ProjectsTableRowTimeLine} from "../table/ProjectsTableRowTimeLine";
import {ProjectsTableRowActivity} from "../table/ProjectsTableRowActivity";
import {useAppConfig} from "@compass/useConfig";
import {ProjectLabelSize} from "@shared/ui/ProjectLabelSize";
import {ProjectLabelRoutes} from "@shared/ui/ProjectLabelRoutes";

TimeAgo.addDefaultLocale(en)

interface Props {
    project: Project
    projectCommited?: ProjectCommited
    complexity: ComplexityProject
    activeUsers: string[]
    labels: string[]
    selectedLabels: string[]
}

function ProjectsTableRow(props: Props) {

    const {project, complexity, activeUsers, labels, selectedLabels, projectCommited} = props;
    const {isDev} = useAppConfig();
    const [setProject] = useProjectStore((state) => [state.setProject], shallow);
    const navigate = useNavigate();
    const form = new Intl.NumberFormat('en-US');

    const isBuildIn = BUILD_IN_PROJECTS.includes(project.projectId);
    let icon = <CogIcon/>;
    if (!isBuildIn) {
        if (complexity.exposesOpenApi) {
            icon = <OpenApiIcon width={20} height={20}/>;
        } else {
            icon = CamelIcon(undefined, 16, 16);
        }
    }

    function downloadProject(projectId: string) {
        ProjectZipApi.downloadZip(projectId, data => {
            FileSaver.saveAs(data, projectId + ".zip");
        });
    }

    return (
        <Tr key={project.projectId} className={"projects-table-row"}>
            <Td modifier='fitContent' style={{paddingInlineEnd: 0, paddingInlineStart: '6px'}}>
                <div style={{display: "flex", justifyContent: "center"}}>
                    {icon}
                </div>
            </Td>
            <Td>
                <Button style={{padding: '6px', paddingInlineStart: 0}} variant={"link"} onClick={e => {
                    navigate(`${ROUTES.PROJECTS}/${project.projectId}`);
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
                            {labels.filter(l => l !== PROJECT_WITH_NO_LABELS).map((label) => (
                                <Badge key={label} isRead={!selectedLabels.includes(label)} style={{fontWeight: 'normal', cursor: 'pointer'}}>
                                    {label}
                                </Badge>
                            ))}
                        </div>
                    }
                </div>
            </Td>
            <Td modifier={"fitContent"} style={{textAlign: "right"}}>
                <ProjectLabelSize complexity={complexity} full={true}/>
            </Td>
            <Td modifier={"fitContent"} style={{textAlign: "right"}}>
                <ProjectLabelRoutes complexity={complexity} full={true}/>
            </Td>
            <Td modifier={"nowrap"} textCenter>
                <ProjectsTableRowTimeLine project={project} projectCommited={projectCommited}/>
            </Td>
            <Td noPadding>
                {!isBuildIn && <ProjectsTableRowActivity activeUsers={activeUsers}/>}
            </Td>
            <Td noPadding>
                {!isBuildIn && <ProjectStatusLabel projectId={project.projectId}/>}
            </Td>
            <Td modifier={"fitContent"}>
                <Flex direction={{default: "row"}} justifyContent={{default: "justifyContentFlexEnd"}} spaceItems={{default: 'spaceItemsNone'}} flexWrap={{default: 'nowrap'}}>
                    {!isBuildIn &&
                        <FlexItem>
                            <Tooltip content={"Delete"} position={"bottom"}>
                                <Button className="dev-action-button"
                                        isDisabled={!isDev}
                                        isInline={!isDev}
                                        variant={"link"}
                                        isDanger
                                        icon={<TimesCircleIcon/>}
                                        onClick={e => {
                                    setProject(project, "delete");
                                }}></Button>
                            </Tooltip>
                        </FlexItem>
                    }
                    {!isBuildIn &&
                        <FlexItem>
                            <Tooltip content={"Copy"} position={"bottom"}>
                                <Button className="dev-action-button"
                                        isDisabled={!isDev}
                                        isInline={!isDev}
                                        variant={"link"}
                                        icon={<CopyIcon/>}
                                        onClick={e => {
                                            setProject(project, "copy");
                                        }}></Button>
                            </Tooltip>
                        </FlexItem>
                    }
                    <FlexItem>
                        <Tooltip content={"Export"} position={"bottom-end"}>
                            <Button className="dev-action-button"
                                    isDisabled={!isDev}
                                    isInline={!isDev}
                                    variant={"link"}
                                    icon={<DownloadIcon/>}
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

export default ProjectsTableRow