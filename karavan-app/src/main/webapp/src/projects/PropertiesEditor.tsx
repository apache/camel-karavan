import React from 'react';
import {
    Badge,
    Breadcrumb,
    BreadcrumbItem,
    Button,
    PageSection,
    Text,
    TextContent,
    Toolbar,
    ToolbarContent,
    ToolbarItem,
    DescriptionList,
    DescriptionListTerm,
    DescriptionListGroup,
    DescriptionListDescription,
    Card,
    CardBody,
    Bullseye,
    EmptyState,
    EmptyStateVariant,
    EmptyStateIcon,
    Title,
    ModalVariant, Modal, Spinner, Tooltip, Flex, FlexItem,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {MainToolbar} from "../MainToolbar";
import {KaravanApi} from "../api/KaravanApi";
import {Project, ProjectFile, ProjectFileTypes} from "../models/ProjectModels";
import {CamelUi} from "../designer/utils/CamelUi";
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import {TableComposable, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import {KaravanDesigner} from "../designer/KaravanDesigner";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import FileSaver from "file-saver";
import Editor from "@monaco-editor/react";
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {CreateFileModal} from "./CreateFileModal";
import PushIcon from "@patternfly/react-icons/dist/esm/icons/code-branch-icon";
import {PropertiesTable} from "../builder/PropertiesTable";
import {ProjectModel} from "karavan-core/lib/model/ProjectModel";
import {ProjectModelApi} from "karavan-core/lib/api/ProjectModelApi";

interface Props {
    file: ProjectFile,
    onSave?: (filename: string, code: string) => void
}

interface State {
    project: ProjectModel,
    file: ProjectFile,
}

export class PropertiesEditor extends React.Component<Props, State> {

    public state: State = {
        project: this.props.file ? ProjectModelApi.propertiesToProject(this.props.file?.code) : ProjectModel.createNew(),
        file: this.props.file,
    }

    render() {
        const file = this.state.file;
        const project = file ? ProjectModelApi.propertiesToProject(file?.code) : ProjectModel.createNew();
        return (
            <PageSection isFilled className="kamelets-page" padding={{default: file !== undefined ? 'noPadding' : 'padding'}}>
                <PropertiesTable
                    properties={project.properties}
                    onChange={properties => this.props.onSave?.call(this, file.name, ProjectModelApi.propertiesToString(properties))}
                />
            </PageSection>
        )
    }
}
