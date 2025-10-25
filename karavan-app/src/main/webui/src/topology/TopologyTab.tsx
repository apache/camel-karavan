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
import {useState} from 'react';
import {
    action,
    createTopologyControlButtons,
    defaultControlButtonsOptions,
    Graph,
    GRAPH_LAYOUT_END_EVENT,
    Layout,
    LayoutFactory,
    Model,
    SELECTION_EVENT,
    TopologyControlBar,
    TopologyView,
    Visualization,
    VisualizationProvider,
    VisualizationSurface,
} from '@patternfly/react-topology';
import {getCustomComponentFactory} from "./CustomComponentFactory";
import {shallow} from "zustand/shallow";
import {useTopologyStore} from "./TopologyStore";
import {useDesignerStore} from "@/designer/DesignerStore";
import {IntegrationFile} from "karavan-core/lib/model/IntegrationDefinition";
import {TopologyBeans} from "./TopologyBeans";
import {getModel} from "./TopologyApi";
import {useTopologyHook} from "./useTopologyHook";
import {TopologyLegend} from "./TopologyLegend";
import {ModalConfirmation, ModalConfirmationProps} from "@/components/ModalConfirmation";
import {EyeIcon, EyeSlashIcon} from '@patternfly/react-icons';
import {ArrowDown, GroupObjects, JumpLink, UngroupObjects} from '@carbon/icons-react';
import {useFilesStore} from "@/api/ProjectStore";
import {NODE_POSITIONED_EVENT} from "@patternfly/react-topology/src/types";
import {TopologyDagreLayout} from "@/topology/graph/TopologyDagreLayout";
import {TopologyToolbar} from "@/topology/TopologyToolbar";

interface Props {
    files: IntegrationFile[],
    openApiJson?: string
    hideToolbar: boolean,
    projectFunctions: Function,
}

export function TopologyTab(props: Props) {

    const { files, hideToolbar, openApiJson, projectFunctions } = props;

    const [modelMap, setModelMap, setFileName, layout, showGroups, setShowGroups,
        showBeans, setShowBeans, showLegend, setShowLegend, straightEdges, setStraightEdges] = useTopologyStore((s) =>
        [s.modelMap, s.setModelMap, s.setFileName, s.layout, s.showGroups, s.setShowGroups,
            s.showBeans, s.setShowBeans, s.showLegend, s.setShowLegend, s.straightEdges, s.setStraightEdges]);
    const [setSelectedStep] = useDesignerStore((s) => [s.setSelectedStep], shallow)
    const [allFiles] = useFilesStore((s) => [s.files], shallow);
    const [confirmationProps, setConfirmationProps] = useState<ModalConfirmationProps>();
    const {selectFile, setDisabled, deleteRoute, setRouteGroup} = useTopologyHook(setConfirmationProps);

    function setTopologySelected(model: Model, ids: string []) {
        if (ids.length > 0) {
            const node = model.nodes?.filter(node => node.id === ids[0]);
            if (node && node.length > 0) {
                const data = node[0].data;
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

    const customLayoutFactory: LayoutFactory = (type: string, graph: Graph): Layout => {
        return new TopologyDagreLayout(graph, {}, straightEdges);
    };

    const controller = React.useMemo(() => {
        const model = getModel(files, showGroups, selectFile, setDisabled, deleteRoute, setRouteGroup, openApiJson);
        const controller = new Visualization();

        controller.registerLayoutFactory((type, graph) => customLayoutFactory(type, graph));
        controller.registerComponentFactory(getCustomComponentFactory(model, false));

        controller.addEventListener(SELECTION_EVENT, args => setTopologySelected(model, args));
        controller.addEventListener(GRAPH_LAYOUT_END_EVENT, () => {
            controller.getGraph().fit(80);
        });
        controller.addEventListener(NODE_POSITIONED_EVENT, (args: any) => {
        });
        controller.fromModel(model, false);
        return controller;
    }, [files, showGroups, straightEdges, layout]);

    React.useEffect(() => {
        try {
            const file = allFiles.find(f => f.name === 'topology.json');
        } catch (e) {
            console.error(e);
        }
    }, []);

    function saveModelMap(graph: Graph) {
        const newModelMap: Map<string, { x: number, y: number }> = new Map();
        graph.getNodes().forEach((node: any) => {
            newModelMap.set(node.getId(), {x: node.position?.x, y: node.position?.y})
        });
        setModelMap(newModelMap);
    }

    function getButtonTitle(title: string, icon: React.ReactNode) {
        return (
            <div>
                {icon}
                <span style={{marginLeft: '3px'}}>{title}</span>
            </div>
        )
    }

    const controlButtons = React.useMemo(() => {
        return createTopologyControlButtons({
            ...defaultControlButtonsOptions,
            zoomInCallback: action(() => {
                controller.getGraph().scaleBy(4 / 3);
            }),
            zoomOutCallback: action(() => {
                controller.getGraph().scaleBy(0.75);
            }),
            legendCallback: action(() => {
                setShowLegend(!showLegend)
            }),
            legendIcon: showLegend ? getButtonTitle('Legend', <EyeIcon/>) : getButtonTitle('Legend', <EyeSlashIcon/>),
            legendTip: 'Show/Hide Legend',
            fitToScreenCallback: action(() => {
                controller.getGraph().fit(80);
            }),
            resetViewCallback: action(() => {
                controller.getGraph().reset();
                controller.getGraph().layout();
            }),
            customButtons: [
                {
                    id: 'straightEdges',
                    icon: straightEdges ? getButtonTitle('Edges', <ArrowDown className='carbon'/> ) : getButtonTitle('Edges', <JumpLink className='carbon'/>),
                    tooltip: 'Switch Straight/Right-Angle Edges',
                    callback: id => setStraightEdges(!straightEdges)
                },
                {
                    id: 'showGroups',
                    icon: showGroups ? getButtonTitle('Grouped', <GroupObjects className='carbon'/> ) : getButtonTitle('Ungrouped', <UngroupObjects className='carbon'/>) ,
                    tooltip: 'Switch Ungrouped/Grouped',
                    callback: id => setShowGroups(!showGroups)
                },
                // {
                //     id: 'layout',
                //     icon: layout === 'manual' ? getButtonTitle('Manual', <HandPointUpIcon/>) : getButtonTitle('Auto', <RobotIcon/>),
                //     tooltip: 'Switch Auto/Manual Layout',
                //     callback: id => setLayout(layout === 'auto' ? 'manual' : 'auto')
                // },
                {
                    id: 'showBeans',
                    icon: showBeans ? getButtonTitle('Beans', <EyeIcon/>) : getButtonTitle('Beans', <EyeSlashIcon/>),
                    tooltip: 'Show/Hide Beans',
                    callback: id => setShowBeans(!showBeans)
                }
            ],
        });
    }, [controller, showLegend, showBeans, straightEdges, showGroups, layout]);

    return (
        <>
            {!hideToolbar ? <TopologyToolbar projectFunctions={projectFunctions}/> : undefined}
            <TopologyView
                className="topology-panel"
                controlBar={
                    <TopologyControlBar
                        controlButtons={controlButtons}
                    />
                }
            >
                <VisualizationProvider controller={controller}>
                    <VisualizationSurface/>
                    {showBeans && <TopologyBeans/>}
                    {showLegend && <TopologyLegend/>}
                    {confirmationProps?.isOpen && <ModalConfirmation {...confirmationProps}/>}
                </VisualizationProvider>
            </TopologyView>
        </>
    );
}