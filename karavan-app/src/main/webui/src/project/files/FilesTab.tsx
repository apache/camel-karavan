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
    Badge,
    Bullseye,
    Button,
    EmptyState,
    EmptyStateHeader,
    EmptyStateIcon,
    EmptyStateVariant,
    Label,
    PageSection,
    Panel,
    PanelHeader,
    Tooltip
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {Tbody, Td, Th, Thead, Tr} from '@patternfly/react-table';
import {Table} from '@patternfly/react-table/deprecated';
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import CheckIcon from "@patternfly/react-icons/dist/js/icons/check-icon";
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import {useFilesStore, useFileStore, useProjectStore} from "../../api/ProjectStore";
import {
    getProjectFileTypeTitle,
    getProjectFileTypeByNameTitle,
    ProjectFile
} from "../../api/ProjectModels";
import {FileToolbar} from "./FilesToolbar";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import FileSaver from "file-saver";
import {CreateFileModal} from "./CreateFileModal";
import {DeleteFileModal} from "./DeleteFileModal";
import {UploadFileModal} from "./UploadFileModal";
import {shallow} from "zustand/shallow";
import {CreateIntegrationModal} from "./CreateIntegrationModal";

export function FilesTab () {

    const [files, diff] = useFilesStore((s) => [s.files, s.diff], shallow);
    const [project] = useProjectStore((s) => [s.project], shallow);
    const [setFile] = useFileStore((s) => [s.setFile], shallow);

    function getDate(lastUpdate: number): string {
        if (lastUpdate) {
            const date = new Date(lastUpdate);
            return date.toISOString().slice(0, 19).replace('T',' ');
        } else {
            return "N/A"
        }
    }

    function needCommit(filename: string): boolean {
        return diff && diff[filename] !== undefined;
    }

    function download (file: ProjectFile) {
        if (file) {
            const type = file.name.endsWith("yaml") ? "application/yaml;charset=utf-8" : undefined;
            const f = new File([file.code], file.name, {type: type});
            FileSaver.saveAs(f);
        }
    }

    function canDeleteFiles(): boolean {
        return !['templates', 'services'].includes(project.projectId);
    }

    function isKameletsProject(): boolean {
        return project.projectId === 'kamelets';
    }

    return (
        <PageSection className="project-tab-panel" padding={{default: "padding"}}>
            <Panel>
                <PanelHeader>
                    <FileToolbar/>
                </PanelHeader>
            </Panel>
            <div style={{height:"100%", overflow:"auto"}}>
                <Table aria-label="Files" variant={"compact"} className={"table"}>
                    <Thead>
                        <Tr>
                            <Th key='type' width={20}>Type</Th>
                            <Th key='filename' width={40}>Filename</Th>
                            <Th key='status' width={30}>Status</Th>
                            <Th key='action'></Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {files.map(file => {
                            const type = getProjectFileTypeTitle(file)
                            return <Tr key={file.name}>
                                <Td>
                                    <Badge>{type}</Badge>
                                </Td>
                                <Td>
                                    <Button style={{padding: '6px'}} variant={"link"}
                                            onClick={e => {
                                                setFile('select', file, undefined);
                                            }}>
                                        {file.name}
                                    </Button>
                                </Td>
                                <Td>
                                    {needCommit(file.name) &&
                                        <Label color="grey">{diff[file.name]}</Label>
                                    }
                                    {!needCommit(file.name) &&
                                        <Label color="green" icon={<CheckIcon/>}/>
                                    }
                                </Td>
                                <Td modifier={"fitContent"}>
                                    {canDeleteFiles() &&
                                        <Button className="dev-action-button" style={{padding: '0'}} variant={"plain"}
                                                isDisabled={['application.properties', 'docker-compose.yaml'].includes(file.name)}
                                                onClick={e =>
                                                    setFile('delete', file)
                                        }>
                                            <DeleteIcon/>
                                        </Button>
                                    }
                                    <Tooltip content="Download source" position={"bottom-end"}>
                                        <Button className="dev-action-button"  size="sm" variant="plain" icon={<DownloadIcon/>} onClick={e => download(file)}/>
                                    </Tooltip>
                                </Td>
                            </Tr>
                        })}
                        {diff && Object.keys(diff).map(fileName => {
                            const type = getProjectFileTypeByNameTitle(fileName)
                            return <Tr key={fileName}>
                                <Td><Badge>{type}</Badge></Td>
                                <Td>{fileName}</Td>
                                <Td><Label color="grey">{diff[fileName]}</Label></Td>
                                <Td modifier={"fitContent"}></Td>
                            </Tr>
                        })}
                        {files.length === 0 &&
                            <Tr>
                                <Td colSpan={8}>
                                    <Bullseye>
                                        <EmptyState variant={EmptyStateVariant.sm}>
                                            <EmptyStateHeader titleText="No results found" icon={<EmptyStateIcon icon={SearchIcon}/>} headingLevel="h2" />
                                        </EmptyState>
                                    </Bullseye>
                                </Td>
                            </Tr>
                        }
                    </Tbody>
                </Table>
            </div>
            <UploadFileModal/>
            {!isKameletsProject() && <CreateFileModal/>}
            {isKameletsProject() && <CreateIntegrationModal/>}
            <DeleteFileModal />
        </PageSection>
    )
}
