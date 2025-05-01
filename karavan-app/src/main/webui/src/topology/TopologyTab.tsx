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
    LayoutFactory,
    Layout,
    Graph,
    LayoutOptions,
    SELECTION_EVENT, Model, DagreLayout,
} from '@patternfly/react-topology';
import {CustomComponentFactory} from "./CustomComponentFactory";
import {shallow} from "zustand/shallow";
import {useTopologyStore} from "./TopologyStore";
import {TopologyToolbar} from "./TopologyToolbar";
import {useDesignerStore} from "../designer/DesignerStore";
import {IntegrationFile} from "karavan-core/lib/model/IntegrationDefinition";
import {TopologyLegend} from "./TopologyLegend";
import {TopologyBeans} from "./TopologyBeans";
import {getModel} from "./TopologyApi";
import {useTopologyHook} from "./useTopologyHook";

interface Props {
    files: IntegrationFile[],
    hideToolbar: boolean
    onClickAddRouteConfiguration: () => void
    onClickAddREST: () => void
    onClickAddKamelet: () => void
    onClickAddBean: () => void
    isDev?: boolean
}

export function TopologyTab(props: Props) {

    const [selectedIds, setSelectedIds, setFileName, ranker, setRanker, setNodeData, showGroups, showBeans, showLegend] = useTopologyStore((s) =>
        [s.selectedIds, s.setSelectedIds, s.setFileName, s.ranker, s.setRanker, s.setNodeData, s.showGroups, s.showBeans, s.showLegend], shallow);
    const [setSelectedStep] = useDesignerStore((s) => [s.setSelectedStep], shallow)
    const {selectFile, setDisabled} = useTopologyHook();

    function setTopologySelected(model: Model, ids: string []) {
        setSelectedIds(ids);
        if (ids.length > 0) {
            const node = model.nodes?.filter(node => node.id === ids[0]);
            if (node && node.length > 0) {
                const data = node[0].data;
                setNodeData(data);
                if (data && data.step) {
                    setFileName(data.fileName)
                    setSelectedStep(data.step)
                } else {
                    setSelectedStep(undefined);
                    setFileName(undefined)
                }
            }
        }
    }

    const customLayoutFactory: LayoutFactory = (type: string, graph: Graph, options?: LayoutOptions): Layout => {
        return new DagreLayout(graph, {
                rankdir: 'TB',
                ranker: "network-simplex",
                nodesep: 20,
                edgesep: 20,
                ranksep: 1,
                // align: 'UL'
            });
    };

    const controller = React.useMemo(() => {
        const model = getModel(props.files, showGroups, selectFile, setDisabled);
        const controller = new Visualization();

        controller.registerLayoutFactory(customLayoutFactory);
        controller.registerComponentFactory(CustomComponentFactory);

        controller.addEventListener(SELECTION_EVENT, args => setTopologySelected(model, args));
        // controller1.addEventListener(SELECTION_EVENT, args => {
        //     console.log(args)
        // });
        controller.addEventListener(GRAPH_LAYOUT_END_EVENT, () => {
            controller.getGraph().fit(80);
        });
        controller.fromModel(model, false);
        return controller;
    },[]);

    React.useEffect(() => {
        try {
            setSelectedIds([])
            const model = getModel(props.files, showGroups, selectFile, setDisabled);
            controller.fromModel(model, false);
        } catch (e) {
            console.error(e);
        }
    }, [setSelectedIds, props.files, controller, showGroups]);

    const controlButtons = React.useMemo(() => {
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
                ? <TopologyToolbar onClickAddRouteConfiguration={props.onClickAddRouteConfiguration}
                                   onClickAddBean={props.onClickAddBean}
                                   onClickAddKamelet={props.onClickAddKamelet}
                                   onClickAddREST={props.onClickAddREST}
                                   isDev={props.isDev}
                />
                : undefined}
            controlBar={
                <TopologyControlBar
                    controlButtons={controlButtons}
                />
            }
        >
            <VisualizationProvider controller={controller}>
                <VisualizationSurface state={{selectedIds}}/>
                {showBeans && <TopologyBeans/>}
                {showLegend && <TopologyLegend/>}
            </VisualizationProvider>
        </TopologyView>
    );
}