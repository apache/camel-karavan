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
import {
    Button,
    Badge,
    Tooltip,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import { Td, Tr} from "@patternfly/react-table";
import {Project} from '../api/ProjectModels';
import {
    useLogStore,
} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {useNavigate} from "react-router-dom";

interface Props {
    project: Project
}

export function ResourcesTableRow (props: Props) {

    const [setShowLog] = useLogStore((state) => [state.setShowLog], shallow);
    const navigate = useNavigate();


    const project = props.project;
    const isBuildIn = ['kamelets', 'templates'].includes(project.projectId);
    const commit = project.lastCommit ? project.lastCommit?.substr(0, 7) : "...";
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
            <Td>
                <Tooltip content={project.lastCommit} position={"bottom"}>
                    <Badge className="badge">{commit}</Badge>
                </Tooltip>
            </Td>
        </Tr>
    )
}