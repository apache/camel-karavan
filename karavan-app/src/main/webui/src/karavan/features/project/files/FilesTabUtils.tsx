import React, {ReactElement} from 'react';
import {Bullseye, EmptyState, EmptyStateVariant} from '@patternfly/react-core';
import '@features/projects/Complexity.css';
import {Td, Tr} from '@patternfly/react-table';
import {FileCsvIcon, FileIcon, SearchIcon} from '@patternfly/react-icons';
import {APPLICATION_PROPERTIES, DOCKER_COMPOSE, DOCKER_STACK, KUBERNETES_YAML, ProjectFile} from "@models/ProjectModels";
import FileSaver from "file-saver";
import {DockerIcon} from "@patternfly/react-icons/dist/js/icons/docker-icon";
import {KubernetesIcon} from "@features/project/designer/icons/ComponentIcons";
import {JKubeIcon} from "@features/project/designer/icons/KaravanIcons";
import {camelIcon, CamelUi} from "@features/project/designer/utils/CamelUi";
import {SvgIcon} from "@shared/icons/SvgIcon";
import {KARAVAN_DOT_EXTENSION} from "@karavan-core/contants";

export function download(file: ProjectFile) {
    if (file) {
        const type = file.name.endsWith("yaml") ? "application/yaml;charset=utf-8" : undefined;
        const f = new File([file.code], file.name, {type: type});
        FileSaver.saveAs(f);
    }
}

export function isInfraFile(name: string): boolean {
    return name === DOCKER_COMPOSE || name === KUBERNETES_YAML;
}

export function getIcon(name: string): ReactElement {
    if (name.endsWith(KARAVAN_DOT_EXTENSION.CAMEL_YAML) || name.endsWith(KARAVAN_DOT_EXTENSION.KAMELET_YAML)) {
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

export function sortFiles(files: ProjectFile[]): ProjectFile[] {
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

export function getTableEmpty() {
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