import React, {useEffect} from 'react';
import {
    Badge,
    Button,
    Bullseye,
    EmptyState,
    EmptyStateVariant,
    EmptyStateIcon,
    PageSection, PanelHeader, Panel, Tooltip, Label, EmptyStateHeader, PanelMain, PanelMainBody, Flex, FlexItem,
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {
	Tbody,
	Td,
	Th,
	Thead,
	Tr
} from '@patternfly/react-table';
import {
	Table
} from '@patternfly/react-table/deprecated';
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import {useFilesStore, useFileStore, useProjectStore} from "../../api/ProjectStore";
import {getProjectFileType, ProjectFile, ProjectFileTypes} from "../../api/ProjectModels";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import FileSaver from "file-saver";
import {shallow} from "zustand/shallow";
import {PropertiesToolbar} from "./PropertiesToolbar";
import {PropertiesTable} from "./PropertiesTable";

export function PropertiesPanel () {

    const [files] = useFilesStore((s) => [s.files], shallow);
    const [project] = useProjectStore((s) => [s.project], shallow);
    const [operation] = useFileStore((s) => [s.operation], shallow);

    function getDate(lastUpdate: number): string {
        if (lastUpdate) {
            const date = new Date(lastUpdate);
            return date.toISOString().slice(0, 19).replace('T',' ');
        } else {
            return "N/A"
        }
    }

    function needCommit(lastUpdate: number): boolean {
        return lastUpdate > project.lastCommitTimestamp;
    }

    function download (file: ProjectFile) {
        if (file) {
            const type = file.name.endsWith("yaml") ? "application/yaml;charset=utf-8" : undefined;
            const f = new File([file.code], file.name, {type: type});
            FileSaver.saveAs(f);
        }
    }

    function isBuildIn(): boolean {
        return ['kamelets', 'templates', 'services'].includes(project.projectId);
    }

    function canDeleteFiles(): boolean {
        return !['templates', 'services'].includes(project.projectId);
    }

    function isKameletsProject(): boolean {
        return project.projectId === 'kamelets';
    }

    const types = isBuildIn()
        ? (isKameletsProject() ? ['KAMELET'] : ['CODE', 'PROPERTIES'])
        : ProjectFileTypes.filter(p => !['PROPERTIES', 'LOG', 'KAMELET'].includes(p.name)).map(p => p.name);

    return (
        <PageSection padding={{default: 'noPadding'}} className="scrollable-out">
            <PageSection isFilled padding={{default: 'padding'}} className="scrollable-in">
            <Panel>
                <PanelHeader>
                    <PropertiesToolbar/>
                </PanelHeader>
            </Panel>
                <PropertiesTable/>
        </PageSection>
        </PageSection>
    )
}
