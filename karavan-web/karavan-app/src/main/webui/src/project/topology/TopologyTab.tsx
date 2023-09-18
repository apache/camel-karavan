import * as React from 'react';
import {
    action,
    createTopologyControlButtons,
    defaultControlButtonsOptions,
    GRAPH_LAYOUT_END_EVENT,
    TopologyView,
    TopologyControlBar,
    Visualization,
    VisualizationProvider,
    VisualizationSurface,
    DagreLayout,
    SELECTION_EVENT, Model,
} from '@patternfly/react-topology';
import {customComponentFactory, getModel} from "./TopologyApi";
import {useFilesStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {useTopologyStore} from "./TopologyStore";
import {TopologyPropertiesPanel} from "./TopologyPropertiesPanel";
import {useDesignerStore} from "../../designer/KaravanStore";
import {TopologyToolbar} from "./TopologyToolbar";

export const TopologyTab: React.FC = () => {

    const [files] = useFilesStore((s) => [s.files], shallow);
    const [selectedIds, setSelectedIds, setFileName] = useTopologyStore((s) =>
        [s.selectedIds, s.setSelectedIds, s.setFileName], shallow);
    const [setSelectedStep] = useDesignerStore((s) => [s.setSelectedStep], shallow)

    function setTopologySelected(model: Model, ids: string []) {
        setSelectedIds(ids);
        if (ids.length > 0) {
            const node = model.nodes?.filter(node => node.id === ids[0]);
            if (node && node.length > 0) {
                const data = node[0].data;
                setFileName(data.fileName)
                if (data.step) {
                    setSelectedStep(data.step)
                } else {
                    setSelectedStep(undefined);
                    setFileName(undefined)
                }
            }
        }
    }

    const controller = React.useMemo(() => {
        const model = getModel(files);
        const newController = new Visualization();
        newController.registerLayoutFactory((_, graph) => new DagreLayout(graph));
        newController.registerComponentFactory(customComponentFactory);

        newController.addEventListener(SELECTION_EVENT, args => setTopologySelected(model, args));
        // newController.addEventListener(SELECTION_EVENT, args => {
        //     console.log(args)
        // });
        newController.addEventListener(GRAPH_LAYOUT_END_EVENT, () => {
            newController.getGraph().fit(80);
        });

        newController.fromModel(model, false);
        return newController;
    }, []);

    React.useEffect(() => {
        setSelectedIds([])
        const model = getModel(files);
        controller.fromModel(model, false);
    }, []);

    return (
        <TopologyView
            className="topology-panel"
            contextToolbar={<TopologyToolbar/>}
            sideBar={<TopologyPropertiesPanel/>}
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
                <VisualizationSurface state={{ selectedIds }}/>
            </VisualizationProvider>
        </TopologyView>
    );
};