/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
import {shallow} from "zustand/shallow";
import {useTopologyStore} from "./TopologyStore";
import {TopologyPropertiesPanel} from "./TopologyPropertiesPanel";
import {TopologyToolbar} from "./TopologyToolbar";
import {useDesignerStore} from "../designer/DesignerStore";
import {IntegrationFile} from "karavan-core/lib/model/IntegrationDefinition";

interface Props {
    files: IntegrationFile[],
    onSetFile: (fileName: string) => void
    hideToolbar: boolean
    onClickAddRoute: () => void
    onClickAddREST: () => void
    onClickAddBean: () => void
}

export function TopologyTab(props: Props) {

    const [selectedIds, setSelectedIds, setFileName, ranker, setRanker, setNodeData] = useTopologyStore((s) =>
        [s.selectedIds, s.setSelectedIds, s.setFileName, s.ranker, s.setRanker, s.setNodeData], shallow);
    const [setSelectedStep] = useDesignerStore((s) => [s.setSelectedStep], shallow)

    function setTopologySelected(model: Model, ids: string []) {
        setSelectedIds(ids);
        if (ids.length > 0) {
            const node = model.nodes?.filter(node => node.id === ids[0]);
            if (node && node.length > 0) {
                const data = node[0].data;
                setNodeData(data);
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
        const model = getModel(props.files);
        const newController = new Visualization();
        newController.registerLayoutFactory((_, graph) =>
            new DagreLayout(graph, {
                rankdir: 'TB',
                ranker: ranker,
                nodesep: 20,
                edgesep: 20,
                ranksep: 0
            }));

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
    },[]);

    React.useEffect(() => {
        setSelectedIds([])
        const model = getModel(props.files);
        controller.fromModel(model, false);
    }, [ranker, controller, setSelectedIds, props.files]);

    const controlButtons = React.useMemo(() => {
        // const customButtons = [
        //     {
        //         id: "change-ranker",
        //         icon: <RankerIcon />,
        //         tooltip: 'Change Ranker ' + ranker,
        //         ariaLabel: '',
        //         callback: (id: any) => {
        //             if (ranker === 'network-simplex') {
        //                 setRanker('tight-tree')
        //             } else {
        //                 setRanker('network-simplex')
        //             }
        //         }
        //     }
        // ];
        return createTopologyControlButtons({
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
            legend: false,
            // customButtons,
        });
    }, [ranker, controller, setRanker]);

    return (
        <TopologyView
            className="topology-panel"
            contextToolbar={!props.hideToolbar
                ? <TopologyToolbar onClickAddRoute={props.onClickAddRoute}
                                   onClickAddBean={props.onClickAddBean}
                                   onClickAddREST={props.onClickAddREST}/>
                : undefined}
            sideBar={<TopologyPropertiesPanel onSetFile={props.onSetFile}/>}
            controlBar={
                <TopologyControlBar
                    controlButtons={controlButtons}
                />
            }
        >
            <VisualizationProvider controller={controller}>
                <VisualizationSurface state={{selectedIds}}/>
            </VisualizationProvider>
        </TopologyView>
    );
}