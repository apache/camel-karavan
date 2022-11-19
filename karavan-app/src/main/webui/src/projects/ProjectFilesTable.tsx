import React from 'react';
import {
    Badge,
    Breadcrumb,
    BreadcrumbItem,
    Button,
    PageSection,
    Text,
    TextContent,
    Bullseye,
    EmptyState,
    EmptyStateVariant,
    EmptyStateIcon,
    Title,
    ModalVariant,
    Modal,
    Flex,
    FlexItem,
    CodeBlockCode,
    CodeBlock, Skeleton, Tabs, Tab
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {MainToolbar} from "../MainToolbar";
import {KaravanApi} from "../api/KaravanApi";
import {getProjectFileType, Project, ProjectFile, ProjectFileTypes} from "./ProjectModels";
import {CamelUi} from "../designer/utils/CamelUi";
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import {TableComposable, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import {KaravanDesigner} from "../designer/KaravanDesigner";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import DownloadImageIcon from "@patternfly/react-icons/dist/esm/icons/image-icon";
import FileSaver from "file-saver";
import Editor from "@monaco-editor/react";
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {CreateFileModal} from "./CreateFileModal";
import {PropertiesEditor} from "./PropertiesEditor";
import {ProjectModel, ProjectProperty} from "karavan-core/lib/model/ProjectModel";
import {ProjectModelApi} from "karavan-core/lib/api/ProjectModelApi";
import {KubernetesAPI} from "../designer/utils/KubernetesAPI";
import {UploadModal} from "./UploadModal";
import {ProjectInfo} from "./ProjectInfo";
import {ProjectOperations} from "./ProjectOperations";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import PushIcon from "@patternfly/react-icons/dist/esm/icons/code-branch-icon";
import {ProjectPageToolbar} from "./ProjectPageToolbar";

interface Props {
    files: ProjectFile[],
    onOpenDeleteConfirmation: (file: ProjectFile) => void,
    onSelect: (file: ProjectFile) => void,
}

interface State {

}

export class ProjectFilesTable extends React.Component<Props, State> {

    public state: State = {};

    getDate(lastUpdate: number):string {
        if (lastUpdate) {
            const date = new Date(lastUpdate);
            return date.toDateString() + ' ' + date.toLocaleTimeString();
        } else {
            return "N/A"
        }
    }

    render() {
        const {files, onOpenDeleteConfirmation, onSelect} = this.props;
        return (
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
                                        onClick={e => onSelect.call(this, file)}>
                                    {file.name}
                                </Button>
                            </Td>
                            <Td>
                                {this.getDate(file.lastUpdate)}
                            </Td>
                            <Td modifier={"fitContent"}>
                                {file.projectId !== 'templates' &&
                                    <Button style={{padding: '0'}} variant={"plain"}
                                            isDisabled={file.name === 'application.properties'}
                                            onClick={e => onOpenDeleteConfirmation.call(this, file)}>
                                        <DeleteIcon/>
                                    </Button>
                                }
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
        )
    }
}
