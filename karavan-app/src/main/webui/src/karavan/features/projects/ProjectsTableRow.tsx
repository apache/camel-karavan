import React from 'react';
import {Badge, Button, Flex, FlexItem, Tooltip} from '@patternfly/react-core';
import '@features/projects/Complexity.css';
import {Td, Tr} from "@patternfly/react-table";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-circle-icon";
import CopyIcon from "@patternfly/react-icons/dist/esm/icons/copy-icon";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import {shallow} from "zustand/shallow";
import {useNavigate} from "react-router-dom";
import {BUILD_IN_PROJECTS, Project, ProjectCommited} from "@models/ProjectModels";
import {useProjectStore} from "@stores/ProjectStore";
import FileSaver from "file-saver";
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import {ROUTES} from "@app/navigation/Routes";
import {ProjectStatusLabel} from "@features/projects/ProjectStatusLabel";
import {ComplexityProject} from "@features/projects/ComplexityModels";
import {ProjectZipApi} from "@features/projects/ProjectZipApi";
import {ProjectsTableRowComplexity} from "@features/projects/ProjectsTableRowComplexity";
import {ProjectsTableRowTimeLine} from "@features/projects/ProjectsTableRowTimeLine";

TimeAgo.addDefaultLocale(en)

interface Props {
    project: Project
    projectCommited?: ProjectCommited
    complexity: ComplexityProject
    labels: string[]
    selectedLabels: string[]
    onLabelClick: (label: string) => void
}

function ProjectsTableRow(props: Props) {

    const {project, complexity, labels, selectedLabels, onLabelClick, projectCommited} = props;
    const [setProject] = useProjectStore((state) => [state.setProject], shallow);
    const navigate = useNavigate();

    const isBuildIn = BUILD_IN_PROJECTS.includes(project.projectId);

    function downloadProject(projectId: string) {
        ProjectZipApi.downloadZip(projectId, data => {
            FileSaver.saveAs(data, projectId + ".zip");
        });
    }

    return (
        <Tr key={project.projectId} className={"projects-table-row"}>
            <Td modifier='fitContent' style={{paddingInlineEnd: 0, paddingInlineStart: '6px'}}>
                {!isBuildIn && <ProjectStatusLabel projectId={project.projectId}/>}
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
            <Td modifier={"nowrap"} textCenter>
                <ProjectsTableRowTimeLine project={project} projectCommited={projectCommited} />
            </Td>
            <Td noPadding textCenter>
                {!isBuildIn && <ProjectsTableRowComplexity complexity={complexity}/>}
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

export default ProjectsTableRow