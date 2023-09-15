import * as React from 'react';
import {
    ToolbarItem
} from '@patternfly/react-core';
import {
    action,
    createTopologyControlButtons,
    defaultControlButtonsOptions,
    GRAPH_LAYOUT_END_EVENT,
    TopologyView,
    TopologyControlBar,
    Visualization,
    VisualizationProvider,
    VisualizationSurface, DagreLayout, ColaLayout, ForceLayout, ColaGroupsLayout, GridLayout,
} from '@patternfly/react-topology';
import {customComponentFactory, getModel} from "./TopologyApi";
import {useFilesStore, useProjectStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";

export const TopologyTab: React.FC = () => {

    const [files] = useFilesStore((s) => [s.files], shallow);
    const [project] = useProjectStore((s) => [s.project], shallow);

    const controller = React.useMemo(() => {
        const model = getModel(files);
        const newController = new Visualization();
        newController.registerLayoutFactory((_, graph) => new DagreLayout(graph));
        newController.registerComponentFactory(customComponentFactory);

        newController.addEventListener(GRAPH_LAYOUT_END_EVENT, () => {
            newController.getGraph().fit(80);
        });

        newController.fromModel(model, false);
        return newController;
    }, []);

    React.useEffect(() => {
        const model = getModel(files);
        controller.fromModel(model, false);
    }, []);

    return (
        <TopologyView
            viewToolbar={<ToolbarItem>{}</ToolbarItem>}
            controlBar={
                <TopologyControlBar
                    controlButtons={createTopologyControlButtons({
                        ...defaultControlButtonsOptions,
                        zoomInCallback: action(() => {
                            controller.getGraph().scaleBy(4 / 3);
                        }),
                        zoomOutCallback: action(() => {
                            controller.getGraph().scaleBy(0.75);
                        }),
                        fitToScreenCallback: action(() => {
                            controller.getGraph().fit(80);
                        }),
                        resetViewCallback: action(() => {
                            controller.getGraph().reset();
                            controller.getGraph().layout();
                        }),
                        legend: false
                    })}
                />
            }
        >
            <VisualizationProvider controller={controller}>
                <VisualizationSurface />
            </VisualizationProvider>
        </TopologyView>
    );
};