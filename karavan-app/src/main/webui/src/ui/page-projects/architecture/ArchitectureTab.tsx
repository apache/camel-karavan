import * as React from 'react';
import './Architecture.css';
import {TopologyControlBar, TopologyView, VisualizationProvider, VisualizationSurface,} from '@patternfly/react-topology';
import {ArchitectureController} from "./ArchitectureController";
import {ArchitectureRefresher} from "../architecture/ArchitectureRefresher";
import {ErrorBoundaryWrapper} from "@shared/ui/ErrorBoundaryWrapper";
import {ProjectsToolbar} from "../ProjectsToolbar";

export function ArchitectureTab() {

    const { controller, clearAllSelection, controlButtons} = ArchitectureController();

    return (
        <div className="projects-architecture-page">
            <ErrorBoundaryWrapper key='projects-architecture-page' onError={error => console.error(error)}>
                <ProjectsToolbar type={"simple"}/>
                <VisualizationProvider controller={controller}>
                    <TopologyView
                        className="projects-architecture-panel"
                        controlBar={<TopologyControlBar controlButtons={controlButtons} />}
                    >
                        <VisualizationSurface />
                    </TopologyView>
                </VisualizationProvider>
                <ArchitectureRefresher key={"000"}/>
            </ErrorBoundaryWrapper>
        </div>
    )
}