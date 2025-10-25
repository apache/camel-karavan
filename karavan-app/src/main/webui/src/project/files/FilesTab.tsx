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
import React, {useEffect, useState} from 'react';
import {Badge, Bullseye, Button, EmptyState, EmptyStateVariant, Label, Tooltip} from '@patternfly/react-core';
import {InnerScrollContainer, OuterScrollContainer, Table, Tbody, Td, Th, Thead, Tr} from '@patternfly/react-table';
import {CheckIcon, DownloadIcon, OutlinedCopyIcon, SearchIcon, TimesIcon} from '@patternfly/react-icons';
import {useAppConfigStore, useFilesStore, useFileStore, useProjectStore} from "@/api/ProjectStore";
import {APPLICATION_PROPERTIES, DOCKER_COMPOSE, getProjectFileTypeByNameTitle, getProjectFileTypeTitle, ProjectFile, ProjectType} from "@/api/ProjectModels";
import {FilesToolbar} from "./FilesToolbar";
import FileSaver from "file-saver";
import {CreateFileModal} from "./CreateFileModal";
import {DeleteFileModal} from "./DeleteFileModal";
import {UploadFileModal} from "./UploadFileModal";
import {shallow} from "zustand/shallow";
import {CreateIntegrationModal} from "./CreateIntegrationModal";
import {DiffFileModal} from "./DiffFileModal";
import {ProjectService} from "@/api/ProjectService";

export function FilesTab() {

    const [config] = useAppConfigStore((s) => [s.config], shallow);
    const [files, diff, selectedFileNames, selectFile, unselectFile, setSelectedFileNames] = useFilesStore((s) => [s.files, s.diff, s.selectedFileNames, s.selectFile, s.unselectFile, s.setSelectedFileNames], shallow);
    const [project, setTabIndex] = useProjectStore((s) => [s.project, s.setTabIndex], shallow);
    const [setFile] = useFileStore((s) => [s.setFile], shallow);
    const [id, setId] = useState<string>('');

    const filenames = files.map(f => f.name);
    const deletedFilenames: string[] = Object.getOwnPropertyNames(diff)
        .map(name => diff[name] === 'DELETED' ? name : '')
        .filter(name => name !== '' && !filenames.includes(name));
    const deletedFiles: ProjectFile[] = deletedFilenames.map(d => new ProjectFile(d, project.projectId, '', 0))
    const allFiles = files.concat(deletedFiles);

    useEffect(() => {
        onRefresh();
        setSelectedFileNames([]);
    }, []);

    function onRefresh() {
        if (project.projectId) {
            ProjectService.refreshProjectFiles(project.projectId);
        }
    }

    function needCommit(filename: string): boolean {
        return diff && diff[filename] !== undefined;
    }

    function download(file: ProjectFile) {
        if (file) {
            const type = file.name.endsWith("yaml") ? "application/yaml;charset=utf-8" : undefined;
            const f = new File([file.code], file.name, {type: type});
            FileSaver.saveAs(f);
        }
    }

    function canDeleteFiles(filename: string): boolean {
        if (deletedFilenames.includes(filename)) {
            return false;
        } else if (project.projectId === ProjectType.templates.toString()) {
            return false;
        } else if (project.projectId === ProjectType.configuration.toString()) {
            return !config.configFilenames.includes(filename);
        } else if (config.infrastructure === 'kubernetes') {
            return filename !== APPLICATION_PROPERTIES;
        }
        return ![APPLICATION_PROPERTIES, DOCKER_COMPOSE].includes(filename);
    }

    function isKameletsProject(): boolean {
        return project.projectId === 'kamelets';
    }

    function forOtherEnvironment(filename: string): boolean {
        const currentEnv = config.environment;
        const envs = config.environments;

        if (filename.endsWith(".jkube.yaml") || filename.endsWith("." + DOCKER_COMPOSE)) {
            const parts = filename.split('.');
            const prefix = parts[0] && envs.includes(parts[0]) ? parts[0] : undefined;
            if (prefix && envs.includes(prefix) && prefix !== currentEnv) {
                return true;
            }
            if (!prefix) {
                const prefixedFilename = `${currentEnv}.${filename}`;
                return allFiles.map(f => f.name).includes(prefixedFilename);
            }
        }
        return false;
    }

    function selectAllFiles(isSelecting: boolean) {
        if (isSelecting) {
            allFiles.forEach(file => selectFile(file.name))
        } else {
            allFiles.forEach(file => unselectFile(file.name))
        }
    }

    return (<div>
            <FilesToolbar/>
            <OuterScrollContainer>
                <InnerScrollContainer>
                    <Table aria-label="Files" variant={"compact"} className={"table"} isStickyHeader>
                        <Thead>
                            <Tr>
                                <Th
                                    select={{
                                        onSelect: (_event, isSelecting) => selectAllFiles(isSelecting), isSelected: selectedFileNames.length === allFiles.length
                                    }}
                                    aria-label="Row select"
                                />
                                <Th key='type' width={20}>Type</Th>
                                <Th key='filename' width={40}>Filename</Th>
                                <Th key='status' width={30}>Status</Th>
                                <Th key='action'></Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {allFiles.map((file, rowIndex) => {
                                const type = getProjectFileTypeTitle(file)
                                const diffType = diff[file.name];
                                const isForOtherEnv = forOtherEnvironment(file.name);
                                return (<Tr key={file.name}>
                                        <Td
                                            select={{
                                                rowIndex, onSelect: (_event, isSelecting) => {
                                                    if (isSelecting) {
                                                        selectFile(file.name);
                                                    } else {
                                                        unselectFile(file.name);
                                                    }
                                                }, isSelected: selectedFileNames.includes(file.name),
                                            }}
                                        />
                                        <Td>
                                            <Badge isRead={isForOtherEnv}>{type}</Badge>
                                        </Td>
                                        <Td>
                                            <Button style={{padding: '6px'}} variant={isForOtherEnv ? 'plain' : 'link'}
                                                    onClick={e => {
                                                        setFile('select', file, undefined);
                                                        setTabIndex(0);
                                                    }}>
                                                {file.name}
                                            </Button>
                                        </Td>
                                        <Td>
                                            {needCommit(file.name) && <Tooltip content="Show diff" position={"right"}>
                                                <Label color="grey">
                                                    <Button size="sm" variant="link" className='karavan-labeled-button'
                                                            icon={<OutlinedCopyIcon/>}
                                                            onClick={e => {
                                                                setFile('diff', file, undefined);
                                                                setId(Math.random().toString());
                                                            }}>
                                                        {diffType}
                                                    </Button>
                                                </Label>
                                            </Tooltip>}
                                            {!needCommit(file.name) && <Label color="green" icon={<CheckIcon/>}/>}
                                        </Td>
                                        <Td modifier={"fitContent"}>
                                            <Button icon={<TimesIcon/>} className="dev-action-button" variant={"plain"}
                                                    isDisabled={!canDeleteFiles(file.name)}
                                                    onClick={e => setFile('delete', file)}/>
                                            <Tooltip content="Download source" position={"bottom-end"}>
                                                <Button className="dev-action-button" size="sm" variant="plain" icon={<DownloadIcon/>} onClick={e => download(file)}/>
                                            </Tooltip>
                                        </Td>
                                    </Tr>)
                            })}
                            {diff && Object.keys(diff).filter(f => diff[f] === 'DELETE').map(fileName => {
                                const type = getProjectFileTypeByNameTitle(fileName)
                                return <Tr key={fileName}>
                                    <Td><Badge>{type}</Badge></Td>
                                    <Td>{fileName}</Td>
                                    <Td><Label color="grey">{diff[fileName]}</Label></Td>
                                    <Td modifier={"fitContent"}></Td>
                                </Tr>
                            })}
                            {files.length === 0 && <Tr>
                                <Td colSpan={8}>
                                    <Bullseye>
                                        <EmptyState headingLevel="h2" icon={SearchIcon} titleText="No results found" variant={EmptyStateVariant.sm}>
                                        </EmptyState>
                                    </Bullseye>
                                </Td>
                            </Tr>}
                        </Tbody>
                    </Table>
                </InnerScrollContainer>
            </OuterScrollContainer>
            <UploadFileModal/>
            <DeleteFileModal/>
            <DiffFileModal id={id}/>
            {!isKameletsProject() && <CreateFileModal/>}
            {isKameletsProject() && <CreateIntegrationModal/>}
        </div>)
}
