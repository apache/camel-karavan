/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import {Badge, Button, Flex, FlexItem, Label, Tooltip} from '@patternfly/react-core';
import '../designer/karavan.css';
import {Td, Tr} from "@patternfly/react-table";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import CopyIcon from "@patternfly/react-icons/dist/esm/icons/copy-icon";
import {Project} from '../api/ProjectModels';
import {useAppConfigStore, useLogStore, useProjectStore, useStatusesStore,} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {useNavigate} from "react-router-dom";

interface Props {
    project: Project
}

export function ProjectsTableRow (props: Props) {

    const [deployments, containers] = useStatusesStore((state) => [state.deployments, state.containers], shallow)
    const {config} = useAppConfigStore();
    const [setProject] = useProjectStore((state) => [state.setProject, state.setOperation], shallow);
    const [setShowLog] = useLogStore((state) => [state.setShowLog], shallow);
    const navigate = useNavigate();

    function getEnvironments(): string [] {
        return config.environments && Array.isArray(config.environments) ? Array.from(config.environments) : [];
    }

    function getStatusByEnvironments(name: string): [string, any] [] {
        return getEnvironments().map(e => {
            const env: string = e as string;
            const status = config.infrastructure === 'kubernetes'
                ? deployments.find(d => d.projectId === name && d.env === env)
                : containers.find(d => d.projectId === name && d.env === env);
            return [env, status != null];
        });
    }

    const project = props.project;
    const isBuildIn = ['kamelets', 'templates'].includes(project.projectId);
    const commit = project.lastCommit ? project.lastCommit?.substr(0, 7) : undefined;
    return (
        <Tr key={project.projectId}>
            <Td>
                <Button style={{padding: '6px'}} variant={"link"} onClick={e => {
                    // setProject(project, "select");
                    setShowLog(false, 'none');
                    // ProjectEventBus.selectProject(project);
                    navigate("/projects/"+ project.projectId);
                }}>
                    {project.projectId}
                </Button>
            </Td>
            <Td>{project.name}</Td>
            <Td>{project.description}</Td>
            <Td isActionCell>
                {commit && <Tooltip content={project.lastCommit} position={"bottom"}>
                    <Badge className="badge">{commit}</Badge>
                </Tooltip>}
            </Td>
            <Td noPadding>
                {!isBuildIn &&
                    <div style={{display: "flex", gap:"2px"}}>
                        {getStatusByEnvironments(project.projectId).map(value => {
                            const active = value[1];
                            const color = active ? "green" : "grey"
                            const style = active ? {fontWeight: "bold"} : {}
                            return <Label style={style} color={color} >{value[0]}</Label>
                        })}
                    </div>
                }
            </Td>
            <Td className="project-action-buttons">
                {!isBuildIn &&
                    <Flex direction={{default: "row"}} justifyContent={{default: "justifyContentFlexEnd"}}
                          spaceItems={{default: 'spaceItemsNone'}}>
                        <FlexItem>
                            <Tooltip content={"Copy project"} position={"bottom"}>
                                <Button className="dev-action-button" variant={"plain"} icon={<CopyIcon/>}
                                        onClick={e => {
                                            setProject(project, "copy");
                                        }}></Button>
                            </Tooltip>
                        </FlexItem>
                        <FlexItem>
                            <Tooltip content={"Delete project"} position={"bottom"}>
                                <Button className="dev-action-button" variant={"plain"} icon={<DeleteIcon/>} onClick={e => {
                                    setProject(project, "delete");
                                }}></Button>
                            </Tooltip>
                        </FlexItem>
                    </Flex>
                }
            </Td>
        </Tr>
    )
}