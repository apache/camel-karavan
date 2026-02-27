import React, {ReactElement, useEffect, useState} from 'react';
import {Badge, Bullseye, Button, EmptyState, EmptyStateVariant, Flex, Label, Tooltip} from '@patternfly/react-core';
import '@features/projects/Complexity.css';
import {InnerScrollContainer, OuterScrollContainer, Table, Tbody, Td, Th, Thead, Tr} from '@patternfly/react-table';
import {CheckIcon, DownloadIcon, EditIcon, FileCsvIcon, FileIcon, OutlinedCopyIcon, SearchIcon, ShareAltIcon, TimesIcon} from '@patternfly/react-icons';
import {useAppConfigStore, useFilesStore, useFileStore, useProjectStore} from "@stores/ProjectStore";
import {
    APPLICATION_PROPERTIES,
    BUILD_IN_FILES,
    BUILD_IN_PROJECTS,
    DOCKER_COMPOSE,
    DOCKER_STACK,
    getProjectFileTypeByNameTitle,
    getProjectFileTypeTitle,
    KUBERNETES_YAML,
    ProjectFile,
    ProjectType
} from "@models/ProjectModels";
import FileSaver from "file-saver";
import {shallow} from "zustand/shallow";
import {ProjectService} from "@services/ProjectService";
import {FilesToolbar} from "@features/project/files/FilesToolbar";
import {UploadFileModal} from "@features/project/files/UploadFileModal";
import {DeleteFileModal} from "@features/project/files/DeleteFileModal";
import {DiffFileModal} from "@features/project/files/DiffFileModal";
import {CreateFileModal} from "@features/project/files/CreateFileModal";
import {CreateProjectModal} from "@features/project/files/CreateProjectModal";
import {FileCopyForEnvModal} from "./FileCopyForEnvModal";
import {CopyIcon} from "@patternfly/react-icons/dist/esm/icons/copy-icon";
import {DockerIcon} from "@patternfly/react-icons/dist/js/icons/docker-icon";
import {KubernetesIcon} from "@features/project/designer/icons/ComponentIcons";
import {JKubeIcon} from "@features/project/designer/icons/KaravanIcons";
import {camelIcon, CamelUi} from "@features/project/designer/utils/CamelUi";
import {KaravanApi} from "@api/KaravanApi";
import {ModalConfirmation} from "@shared/ui/ModalConfirmation";
import {EventBus} from "@features/project/designer/utils/EventBus";
import {useSearchStore} from "@stores/SearchStore";
import {ComplexityProject} from "@features/projects/ComplexityModels";
import {ComplexityApi} from "@features/projects/ComplexityApi";
import {SvgIcon} from "@shared/icons/SvgIcon";
import {RenameFileModal} from "@features/project/RenameFileModal";

interface FilesTabWithComplexityProps {
    sortProjectFiles?: (files: ProjectFile[]) => ProjectFile[]
}

export function FilesTab(props: FilesTabWithComplexityProps) {

    const {sortProjectFiles} = props;
    const [config] = useAppConfigStore((s) => [s.config], shallow);
    const [files, diff, selectedFileNames, selectFile, unselectFile, setSelectedFileNames]
        = useFilesStore((s) => [s.files, s.diff, s.selectedFileNames, s.selectFile, s.unselectFile, s.setSelectedFileNames], shallow);
    const [project, setTabIndex] = useProjectStore((s) => [s.project, s.setTabIndex], shallow);
    const [setFile] = useFileStore((s) => [s.setFile], shallow);
    const [search, searchResults] = useSearchStore((s) => [s.search, s.searchResults], shallow)
    const [id, setId] = useState<string>('');
    const [kameletName, setKameletName] = useState<string>();
    const [openShareKamelet, setOpenShareKamelet] = useState<boolean>(false);
    const [complexity, setComplexity] = useState<ComplexityProject>(new ComplexityProject());
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
        onRefresh();
        setSelectedFileNames([]);
    }, []);

    useEffect(() => {
        ComplexityApi.getComplexityProject(project.projectId, complexity => {
            setComplexity(complexity || new ComplexityProject());
        })
    }, [files]);

    function onRefresh() {
        if (project.projectId) {
            ProjectService.refreshProjectFiles(project.projectId);
        }
    }

    function shareKamelet() {
        if (project.projectId && kameletName) {
            KaravanApi.copyProjectFile(project.projectId, kameletName, ProjectType.kamelets.toString(), kameletName, true, res => {
                setOpenShareKamelet(false)
                onRefresh();
                if (res?.status === 200) {
                    EventBus.sendAlert("Shared", "Kamelet shared but not commited!", "warning")
                } else {
                    EventBus.sendAlert("Error", "Error publishing kamelet", "danger")
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

    function getIcon(name: string): ReactElement {
        if (name.endsWith(".camel.yaml") || name.endsWith(".kamelet.yaml")) {
            return CamelUi.getIconFromSource(camelIcon);
        } else if (name.endsWith(DOCKER_COMPOSE)) {
            return <DockerIcon className='icon-docker'/>;
        } else if (name.endsWith(DOCKER_STACK)) {
            return <DockerIcon className='icon-docker'/>;
        } else if (name.endsWith(KUBERNETES_YAML)) {
            return KubernetesIcon('icon-k8s');
        } else if (name.endsWith(".jkube.yaml")) {
            return JKubeIcon();
        } else if (name.endsWith(".java")) {
            return <SvgIcon icon='jar'/>
        } else if (name.endsWith(".groovy")) {
            return <SvgIcon icon='groovy2'/>
        } else if (name === APPLICATION_PROPERTIES) {
            return <SvgIcon icon='ini'/>
        } else if (name.endsWith(".json")) {
            return <SvgIcon icon='json'/>
        } else if (name.endsWith(".yaml")) {
            return <SvgIcon icon='yaml' height={24} width={24}/>
        } else if (name.endsWith(".sql")) {
            return <SvgIcon icon='db'/>
        } else if (name.endsWith(".xml")) {
            return <SvgIcon icon='xml'/>
        } else if (name.endsWith(".xslt")) {
            return <SvgIcon icon='xsl'/>
        } else if (name.endsWith(".md")) {
            return <SvgIcon icon='markdown'/>
        } else if (name.endsWith(".csv")) {
            return <FileCsvIcon/>;
        } else {
            return <FileIcon/>;
        }
    }

    function sortFiles(files: ProjectFile[]): ProjectFile[] {
        return files.sort((f1, f2) => {
            // Priority order
            const extensionOrder = [
                '.camel.yaml',
                '.java',
                DOCKER_COMPOSE,
                '.jkube.yaml',
                KUBERNETES_YAML,
                '.md'
            ];

            // Handle specific prefixes for some extensions
            const prefixOrder = ['test.', 'uat.', 'prod.'];

            const isSpecificFile = (file: ProjectFile, target: string) => file.name === target;
            const hasExtension = (file: ProjectFile, ext: string) => file.name.endsWith(ext);
            const getPrefixOrder = (name: string) => {
                for (let i = 0; i < prefixOrder.length; i++) {
                    if (name.startsWith(prefixOrder[i])) return i;
                }
                return 0; // If no matching prefix, place last in prefix order
            };

            // "application.properties" always comes first
            if (isSpecificFile(f1, APPLICATION_PROPERTIES)) return -1;
            if (isSpecificFile(f2, APPLICATION_PROPERTIES)) return 1;

            // Compare based on extension order
            const f1ExtIndex = extensionOrder.findIndex(ext => hasExtension(f1, ext));
            const f2ExtIndex = extensionOrder.findIndex(ext => hasExtension(f2, ext));

            if (f1ExtIndex !== f2ExtIndex) return f1ExtIndex - f2ExtIndex;

            // Handle sorting for "docker-compose.yaml", ".jkube.yaml", "kubernetes.yaml"
            if ([DOCKER_COMPOSE, KUBERNETES_YAML].includes(extensionOrder[f1ExtIndex])) {
                const f1PrefixOrder = getPrefixOrder(f1.name);
                const f2PrefixOrder = getPrefixOrder(f2.name);
                if (f1PrefixOrder !== f2PrefixOrder) return f1PrefixOrder - f2PrefixOrder;
            }

            // For same extension, sort by name
            return f1.name.localeCompare(f2.name);
        });
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

        const sortedFiles: ProjectFile[] = sortProjectFiles?.(allFiles) ?? sortFiles(allFiles) ?? [];
        let rows = sortedFiles.map((file, rowIndex) => {
            const type = getProjectFileTypeTitle(file)
            const diffType = diff[file.name];
            const isForOtherEnv = forOtherEnvironment(file.name);
            const prefix = getEnvSpecificPrefix(file.name);
            const icon = getIcon(file.name);
            const isInfra = isInfraFile(file.name);
            const isKamelet = file?.name.endsWith(".kamelet.yaml");
            const missEnvs = getMissingEnvs(file.name);
            const canBeRenamed = !isInfra && !BUILD_IN_FILES.includes(file.name);
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
                    <Td>
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
                            {!isBuildInProject && isKamelet &&
                                <Tooltip content="Share kamelet" position={"left"}>
                                    <Button className="dev-action-button" variant={"plain"} onClick={e => {
                                        setKameletName(file.name);
                                        setOpenShareKamelet(true);
                                    }}>
                                        <ShareAltIcon/>
                                    </Button>
                                </Tooltip>
                            }
                            <Button className="dev-action-button" variant={"plain"} style={{color: 'var(--pf-t--global--icon--color--status--danger--default)'}}
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
            {<ModalConfirmation message='Share Kamelet?' isOpen={openShareKamelet} onCancel={() => setOpenShareKamelet(false)} onConfirm={shareKamelet}/>}
        </>


    return (
        <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
            <FilesToolbar/>
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
                                <Th key='status' width={20}>Status</Th>
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
        </div>
    )
}