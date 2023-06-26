import React from 'react';
import {
    Badge,
    Button,
    Bullseye,
    EmptyState,
    EmptyStateVariant,
    EmptyStateIcon,
    Title, PageSection, PanelHeader, Panel, Tooltip,
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {TableComposable, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import {useFilesStore, useFileStore} from "../../api/ProjectStore";
import {getProjectFileType, ProjectFile} from "../../api/ProjectModels";
import {FileToolbar} from "./FilesToolbar";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import FileSaver from "file-saver";


export const FilesTab = () => {

    const {files} = useFilesStore();

    function getDate(lastUpdate: number): string {
        if (lastUpdate) {
            const date = new Date(lastUpdate);
            return date.toDateString() + ' ' + date.toLocaleTimeString();
        } else {
            return "N/A"
        }
    }

    function download (file: ProjectFile) {
        if (file) {
            const type = file.name.endsWith("yaml") ? "application/yaml;charset=utf-8" : undefined;
            const f = new File([file.code], file.name, {type: type});
            FileSaver.saveAs(f);
        }
    }

    return (
        <PageSection className="project-tab-panel" padding={{default: "padding"}}>
            <Panel>
                <PanelHeader>
                    <FileToolbar/>
                </PanelHeader>
            </Panel>
            <TableComposable aria-label="Files" variant={"compact"} className={"table"}>
                <Thead>
                    <Tr>
                        <Th key='type' width={20}>Type</Th>
                        <Th key='filename' width={40}>Filename</Th>
                        <Th key='lastUpdate' width={30}>Updated</Th>
                        <Th key='action'></Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {files.map(file => {
                        const type = getProjectFileType(file)
                        return <Tr key={file.name}>
                            <Td>
                                <Badge>{type}</Badge>
                            </Td>
                            <Td>
                                <Button style={{padding: '6px'}} variant={"link"}
                                        onClick={e =>
                                            useFileStore.setState({file: file, operation: "select"})
                                }>
                                    {file.name}
                                </Button>
                            </Td>
                            <Td>
                                {getDate(file.lastUpdate)}
                            </Td>
                            <Td modifier={"fitContent"}>
                                {file.projectId !== 'templates' &&
                                    <Button style={{padding: '0'}} variant={"plain"}
                                            isDisabled={file.name === 'application.properties'}
                                            onClick={e =>
                                                useFileStore.setState({file: file, operation: "delete"})
                                    }>
                                        <DeleteIcon/>
                                    </Button>
                                }
                                <Tooltip content="Download source" position={"bottom-end"}>
                                    <Button isSmall variant="plain" icon={<DownloadIcon/>} onClick={e => download(file)}/>
                                </Tooltip>
                            </Td>
                        </Tr>
                    })}
                    {files.length === 0 &&
                        <Tr>
                            <Td colSpan={8}>
                                <Bullseye>
                                    <EmptyState variant={EmptyStateVariant.small}>
                                        <EmptyStateIcon icon={SearchIcon}/>
                                        <Title headingLevel="h2" size="lg">
                                            No results found
                                        </Title>
                                    </EmptyState>
                                </Bullseye>
                            </Td>
                        </Tr>
                    }
                </Tbody>
            </TableComposable>
        </PageSection>
    )
}
