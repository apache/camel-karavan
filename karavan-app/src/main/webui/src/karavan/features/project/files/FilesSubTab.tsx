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
import {Badge, Bullseye, Button, EmptyState, EmptyStateVariant, Flex, Label, Tooltip} from '@patternfly/react-core';
import {InnerScrollContainer, OuterScrollContainer, Table, Tbody, Td, Th, Thead, Tr} from '@patternfly/react-table';
import {CheckIcon, DownloadIcon, EditIcon, OutlinedCopyIcon, SearchIcon, ShareAltIcon, TimesIcon} from '@patternfly/react-icons';
import {useAppConfigStore, useFilesStore, useFileStore, useProjectStore} from "@stores/ProjectStore";
import {
    APPLICATION_PROPERTIES,
    BUILD_IN_FILES,
    BUILD_IN_PROJECTS,
    DOCKER_COMPOSE,
    getProjectFileTypeByNameTitle,
    getProjectFileTypeTitle,
    KUBERNETES_YAML,
    ProjectFile,
    ProjectType
} from "@models/ProjectModels";
import {shallow} from "zustand/shallow";
import {UploadFileModal} from "@features/project/files/UploadFileModal";
import {DeleteFileModal} from "@features/project/files/DeleteFileModal";
import {DiffFileModal} from "@features/project/files/DiffFileModal";
import {CreateFileModal} from "@features/project/files/CreateFileModal";
import {CreateProjectModal} from "@features/project/files/CreateProjectModal";
import {CopyIcon} from "@patternfly/react-icons/dist/esm/icons/copy-icon";
import {KaravanApi} from "@api/KaravanApi";
import {ModalConfirmation} from "@shared/ui/ModalConfirmation";
import {EventBus} from "@features/project/designer/utils/EventBus";
import {useSearchStore} from "@stores/SearchStore";
import {RenameFileModal} from "@features/project/RenameFileModal";
import {FileCopyForEnvModal} from "@features/project/files/FileCopyForEnvModal";
import {CamelUtil} from "@karavan-core/api/CamelUtil";
import {download, getIcon, sortFiles} from "@features/project/files/FilesTabUtils";
import {ProjectService} from "@services/ProjectService";
import TimeAgo from "javascript-time-ago";


interface FilesSubTabProps {
    sortFiles?: (files: ProjectFile[]) => ProjectFile[]
}

export function FilesSubTab(props: FilesSubTabProps) {

    const {sortFiles: sorFiles} = props;
    const [config] = useAppConfigStore((s) => [s.config], shallow);
    const [files, diff, selectedFileNames, selectFile, unselectFile, setSelectedFileNames]
        = useFilesStore((s) => [s.files, s.diff, s.selectedFileNames, s.selectFile, s.unselectFile, s.setSelectedFileNames], shallow);
    const {commitedFiles} = useFilesStore();
    const [project, setTabIndex] = useProjectStore((s) => [s.project, s.setTabIndex], shallow);
    const [setFile] = useFileStore((s) => [s.setFile], shallow);
    const [search, searchResults] = useSearchStore((s) => [s.search, s.searchResults], shallow)
    const [id, setId] = useState<string>('');
    const [fileNameToShare, setFileNameToShare] = useState<string>();
    const [openShare, setOpenShare] = useState<"kamelet" | "template" | undefined>();
    const [showCopy, setShowCopy] = useState<boolean>(false);
    const [showRename, setShowRename] = useState<boolean>(false);
    const [missingEnvs, setMissingEnvs] = useState<string[]>([]);

    const filenames = files.map(f => f.name);
    const deletedFilenames: string[] = Object.getOwnPropertyNames(diff)
        .map(name => diff[name] === 'DELETED' ? name : '')
        .filter(name => name !== '' && !filenames.includes(name));
    const deletedFiles: ProjectFile[] = deletedFilenames.map(d => new ProjectFile(d, project.projectId, '', 0));
    const filedFound = searchResults.filter(s => s.projectId === project.projectId)?.at(0)?.files || [];
    const allFiles = files.concat(deletedFiles).filter(f => filedFound.includes(f.name) || search === '');
    const isBuildInProject = BUILD_IN_PROJECTS.includes(project.projectId);
    const envs = config.environments

    useEffect(() => {
        const wrongFiles = files.filter(f => f.projectId !== project?.projectId).length > 0;
        if (wrongFiles) {
            onRefresh();
        }
        setSelectedFileNames([]);
    }, [project?.projectId]);

    function onRefresh(){
        if (project.projectId) {
            ProjectService.refreshProjectFiles(project.projectId);
        }
    }

    function shareRoute() {
        if (project.projectId && fileNameToShare && openShare !== undefined) {
            KaravanApi.copyProjectFile(project.projectId, fileNameToShare, ProjectType.kamelets, fileNameToShare, true, res => {
                setOpenShare(undefined);
                onRefresh();
                if (res?.status === 200) {
                    EventBus.sendAlert("Shared", "Shared but not commited!", "warning")
                } else {
                    EventBus.sendAlert("Error", "Error sharing", "danger")
                }
            })
        }
    }

    function needCommit(filename: string): boolean {
        return diff && diff[filename] !== undefined;
    }

    function getEnvSpecificPrefix(filename: string): [boolean, string, string] {
        if (isBuildInProject && (filename.startsWith('builder.') )) {
            return [false, filename, filename];
        } else if (filename.endsWith("." + KUBERNETES_YAML)) {
            const name = filename.replace(KUBERNETES_YAML, '').replace('.', '');
            return [name.length > 0, name, filename.substring(name.length + 1)];
        } else if (filename.endsWith("." + DOCKER_COMPOSE)) {
            const name = filename.replace(DOCKER_COMPOSE, '').replace('.', '');
            return [name.length > 0, name, filename.substring(name.length + 1)];
        } else {
            return [false, filename, filename];
        }
    }

    function canDeleteFiles(filename: string): boolean {
        if (deletedFilenames.includes(filename)) {
            return false;
        } else if (project.projectId === ProjectType.configuration.toString()) {
            return !config.configFilenames.includes(filename) && !BUILD_IN_FILES.includes(filename);
        } else if (config.infrastructure === 'kubernetes') {
            if (filename === DOCKER_COMPOSE) {
                return true;
            }
            if (filename !== APPLICATION_PROPERTIES) {
                return true;
            }
        } else {
            if (filename === KUBERNETES_YAML) {
                return true;
            }
        }
        return ![APPLICATION_PROPERTIES, DOCKER_COMPOSE, KUBERNETES_YAML].includes(filename);
    }

    function isInfraFile(name: string): boolean {
        return name === DOCKER_COMPOSE || name === KUBERNETES_YAML;
    }

    function getMissingEnvs(name: string): string[] {
        const missingEnvs: string[] = [];
        for (const env of envs.filter(e => e !== 'dev')) {
            const file = `${env}.${name}`;
            if (!filenames.includes(file)) {
                missingEnvs.push(env);
            }
        }
        return missingEnvs;
    }

    function isKameletsProject(): boolean {
        return project.projectId === 'kamelets';
    }

    function forOtherEnvironment(filename: string): boolean {
        const currentEnv = config.environment;

        if (filename.endsWith("." + KUBERNETES_YAML) || filename.endsWith("." + DOCKER_COMPOSE)) {
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

    function getTableBody() {
        const deletedFiles = diff ? Object.keys(diff).filter(f => diff[f] === 'DELETE').map(fileName => {
            const type = getProjectFileTypeByNameTitle(fileName)
            return <Tr key={fileName} style={{verticalAlign: "middle"}}>
                <Td><Badge>{type}</Badge></Td>
                <Td>{fileName}</Td>
                <Td><Label color="grey">{diff[fileName]}</Label></Td>
                <Td modifier={"fitContent"}></Td>
            </Tr>
        }) : []

        const sortedFiles: ProjectFile[] = sorFiles?.(allFiles) ?? sortFiles(allFiles) ?? [];
        let rows = sortedFiles.map((file, rowIndex) => {
            const type = getProjectFileTypeTitle(file)
            const diffType = diff[file.name];
            const isForOtherEnv = forOtherEnvironment(file.name);
            const prefix = getEnvSpecificPrefix(file.name);
            const icon = getIcon(file.name);
            const isInfra = isInfraFile(file.name);
            const isKamelet = file?.name.endsWith(".kamelet.yaml");
            const hasRouteTemplate = CamelUtil.hasRouteTemplateDefinitions(file);
            const missEnvs = getMissingEnvs(file.name);
            const canBeRenamed = !isInfra && !BUILD_IN_FILES.includes(file.name);
            const commitTime = commitedFiles?.find(f => f.name === file.name)?.commitTime;
            const timeAgo = new TimeAgo('en-US')
            return (
                <Tr key={file.name} style={{verticalAlign: "middle"}}>
                    <Td style={{verticalAlign: "middle"}}
                        select={{
                            rowIndex,
                            onSelect: (_event, isSelecting) => {
                                if (isSelecting) {
                                    selectFile(file.name);
                                } else {
                                    unselectFile(file.name);
                                }
                            },
                            isSelected: selectedFileNames.includes(file.name),
                        }}
                    />
                    <Td style={{verticalAlign: "middle"}} textCenter>
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                            {icon}
                        </div>
                    </Td>
                    <Td>
                        <div style={{display: 'flex', flexDirection: 'row', gap: '0', alignItems: 'center', paddingLeft: '16px'}}>
                            {prefix[0] && <Badge isRead={prefix[0]} style={{paddingLeft: '2px', paddingRight: '2px'}}>{prefix[1]}.</Badge>}
                            <Button style={{padding: '4px'}} variant={isForOtherEnv ? 'plain' : 'link'}
                                    onClick={e => {
                                        setFile('select', file, undefined);
                                        setTabIndex(0);
                                    }}>
                                {prefix[2]}
                            </Button>
                        </div>
                    </Td>
                    <Td modifier={"fitContent"} style={{textAlign: "right"}}>
                        {commitTime ? timeAgo.format(new Date(commitTime)) : undefined}
                    </Td>
                    <Td modifier={"fitContent"} style={{textAlign: "right"}}>
                        {timeAgo.format(new Date(file?.lastUpdate))}
                    </Td>
                    <Td textCenter>
                        {needCommit(file.name) &&
                            <Tooltip content="Show diff" position={"right"}>
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
                            </Tooltip>
                        }
                        {!needCommit(file.name) &&
                            <Label color="green" icon={<CheckIcon/>}/>
                        }
                    </Td>
                    <Td modifier={"fitContent"} style={{textAlign: "right"}}>
                        {file?.code.length}
                    </Td>
                    <Td modifier={"fitContent"}>
                        <Flex direction={{default: "row"}} justifyContent={{default: "justifyContentFlexEnd"}} spaceItems={{default: 'spaceItemsNone'}}
                              flexWrap={{default: 'nowrap'}}>
                            {isInfra && missEnvs.length > 0 &&
                                <Tooltip content="Copy for environment" position={"left"}>
                                    <Button className="dev-action-button" variant={"plain"}
                                            onClick={e => {
                                                setFile('copy', file);
                                                setMissingEnvs(missEnvs);
                                                setShowCopy(true);
                                            }}>
                                        <CopyIcon/>
                                    </Button>
                                </Tooltip>
                            }
                            {!isBuildInProject && (isKamelet || hasRouteTemplate) &&
                                <Tooltip content="Share" position={"left"}>
                                    <Button className="dev-action-button" variant={"plain"} onClick={e => {
                                        setFileNameToShare(file.name);
                                        setOpenShare(isKamelet ? "kamelet" : "template");
                                    }}>
                                        <ShareAltIcon/>
                                    </Button>
                                </Tooltip>
                            }
                            {canBeRenamed &&
                                <Tooltip content="Rename" position={"left"}>
                                    <Button className="dev-action-button" variant={"plain"}
                                            onClick={e => {
                                                setFile('rename', file);
                                                setShowRename(true);
                                            }}>
                                        <EditIcon/>
                                    </Button>
                                </Tooltip>
                            }
                            <Button className="dev-action-button"
                                    variant={"plain"}
                                    style={{color: canDeleteFiles(file.name) ? 'var(--pf-t--global--icon--color--status--danger--default)' : 'var(--pf-t--global--icon--color--disabled)'}}
                                    isDisabled={!canDeleteFiles(file.name)}
                                    onClick={e =>
                                        setFile('delete', file)
                                    }>
                                <TimesIcon/>
                            </Button>
                            <Tooltip content="Download source" position={"bottom-end"}>
                                <Button className="dev-action-button" size="sm" variant="plain" icon={<DownloadIcon/>} onClick={e => download(file)}/>
                            </Tooltip>
                        </Flex>
                    </Td>
                </Tr>
            )
        });
        rows.push(...deletedFiles);
        return rows;
    }

    function getTableEmpty() {
        return (
            <Tr>
                <Td colSpan={8}>
                    <Bullseye>
                        <EmptyState variant={EmptyStateVariant.sm} titleText="No results found" icon={SearchIcon} headingLevel="h2"/>
                    </Bullseye>
                </Td>
            </Tr>
        )
    }

    const modalWindows =
        <>
            <UploadFileModal/>
            <DeleteFileModal/>
            {showCopy && <FileCopyForEnvModal show={showCopy} environments={missingEnvs} close={() => setShowCopy(false)}/>}
            <DiffFileModal id={id}/>
            {!isKameletsProject() && <CreateFileModal/>}
            {isKameletsProject() && <CreateProjectModal/>}
            {showRename &&
                <RenameFileModal
                    show={showRename}
                    onRename={() => {
                        onRefresh();
                        setShowRename(false);
                    }}
                    onClose={() => {
                        setShowRename(false);
                    }}/>
            }
            {
                <ModalConfirmation
                    message={openShare === "kamelet" ? 'Share Kamelet?' : "Share Template?"}
                    isOpen={openShare !== undefined}
                    onCancel={() => setOpenShare(undefined)}
                    onConfirm={shareRoute}
                />
            }
        </>

    return (
        <>
            {modalWindows}
            <OuterScrollContainer>
                <InnerScrollContainer>
                    <Table aria-label="Files" variant={"compact"} className={"files-table"} isStickyHeader>
                        <Thead>
                            <Tr>
                                <Th
                                    select={{
                                        onSelect: (_event, isSelecting) => selectAllFiles(isSelecting),
                                        isSelected: selectedFileNames.length === allFiles.length
                                    }}
                                    aria-label="Row select"
                                />
                                <Th key='type' modifier='fitContent' textCenter>Type</Th>
                                <Th key='filename' width={40} style={{paddingLeft: '24px'}}>Filename</Th>
                                <Th key='lastCommit' width={20} style={{textAlign: "right"}}>Commit</Th>
                                <Th key='lastUpdate' width={20} style={{textAlign: "right"}}>Update</Th>
                                <Th key='status' width={20} textCenter>Status</Th>
                                <Th key='size' width={20} style={{textAlign: 'right'}}>Size</Th>
                                <Th key='action' aria-label="action"></Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {files.length > 0 ? getTableBody() : getTableEmpty()}
                        </Tbody>
                    </Table>
                </InnerScrollContainer>
            </OuterScrollContainer>
        </>
    )
}