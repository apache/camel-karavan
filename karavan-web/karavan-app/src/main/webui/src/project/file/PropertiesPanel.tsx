import React from 'react';
import {
    PageSection, PanelHeader, Panel
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import { useProjectStore} from "../../api/ProjectStore";
import { ProjectFileTypes} from "../../api/ProjectModels";
import {shallow} from "zustand/shallow";
import {PropertiesToolbar} from "./PropertiesToolbar";
import {PropertiesTable} from "./PropertiesTable";

export function PropertiesPanel () {

    const [project] = useProjectStore((s) => [s.project], shallow);

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
