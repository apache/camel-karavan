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
import {Badge, Button, Tooltip,} from '@patternfly/react-core';
import '@/integration-designer/karavan.css';
import {Td, Tr} from "@patternfly/react-table";
import {Project} from '@/api/ProjectModels';
import {useLogStore} from "@/api/ProjectStore";
import {shallow} from "zustand/shallow";
import {useNavigate} from "react-router-dom";
import {ROUTES} from "@/main/Routes";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import {ProjectZipApi} from "@/integrations/ProjectZipApi";
import FileSaver from "file-saver";

interface Props {
    project: Project
}

export function ResourcesTableRow (props: Props) {

    const [setShowLog] = useLogStore((state) => [state.setShowLog], shallow);
    const navigate = useNavigate();

    const project = props.project;
    const commit = project.lastCommit ? project.lastCommit?.substr(0, 7) : undefined;


    function downloadProject(projectId: string) {
        ProjectZipApi.downloadZip(projectId, data => {
            FileSaver.saveAs(data, projectId + ".zip");
        });
    }

    return (
        <Tr key={project.projectId} style={{verticalAlign: "middle"}}>
            <Td>
                <Button style={{padding: '6px'}} variant={"link"} onClick={e => {
                    // setProject(project, "select");
                    setShowLog(false, 'none');
                    // ProjectEventBus.selectProject(project);
                    navigate(`${ROUTES.RESOURCES}/${project.projectId}`);
                }}>
                    {project.projectId}
                </Button>
            </Td>
            <Td>{project.name}</Td>
            <Td>
                {commit && <Tooltip content={project.lastCommit} position={"bottom"}>
                    <Badge className="badge">{commit}</Badge>
                </Tooltip>}
            </Td>
            <Td>
                <Tooltip content={"Export"} position={"bottom-end"}>
                    <Button className="dev-action-button" variant={"plain"} icon={<DownloadIcon/>}
                            onClick={e => {
                                downloadProject(project.projectId);
                            }}></Button>
                </Tooltip>
            </Td>
        </Tr>
    )
}