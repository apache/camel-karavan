import * as React from 'react';
import {
    action,
    createTopologyControlButtons,
    defaultControlButtonsOptions,
    ForceLayout,
    Graph,
    GRAPH_LAYOUT_END_EVENT,
    Layout,
    LayoutFactory,
    Model,
    NODE_POSITIONED_EVENT,
    SELECTION_EVENT,
    Visualization,
} from '@patternfly/react-topology';
import {EventBus} from "@designer/utils/EventBus";
import {runInAction} from "mobx";
import {EyeIcon, EyeSlashIcon} from "@patternfly/react-icons";
import {ArrayNumbers, GroupObjects, Template, UngroupObjects} from "@carbon/icons-react";
import {TopologyElkLayout} from "./graph/TopologyElkLayout";
import {useDesignerStore} from "@designer/DesignerStore";
import {useFilesStore, useProjectStore} from "@stores/ProjectStore";
import {useTopologyHook} from "../project-topology/useTopologyHook";
import {IntegrationFile} from "@core/model/IntegrationDefinition";
import {JSON_EXTENSION, OPENAPI_FILE_NAME_JSON} from "@core/contants";
import {getModel, getRouteStatuses} from "../project-topology/TopologyApi";
import {getCustomComponentFactory} from "../project-topology/CustomComponentFactory";
import {capitalize} from "@patternfly/react-core";
import {TopologyDagreLayout} from "../project-topology/graph/TopologyDagreLayout";
import {useArchitectureStore} from "@stores/ArchitectureStore";
import {useSearchStore} from "@stores/SearchStore";

export function TopologyController() {

    const project = useProjectStore((state) => state.project);
    const routeStatuses = getRouteStatuses();

// Architecture Store
    const setFileName = useArchitectureStore((s) => s.setFileName);
    const showGroups = useArchitectureStore((s) => s.showGroups);
    const setShowGroups = useArchitectureStore((s) => s.setShowGroups);
    const showLegend = useArchitectureStore((s) => s.showLegend);
    const setShowLegend = useArchitectureStore((s) => s.setShowLegend);
    const showStats = useArchitectureStore((s) => s.showStats);
    const setShowStats = useArchitectureStore((s) => s.setShowStats);
    const layout = useArchitectureStore((s) => s.layout);
    const nextLayout = useArchitectureStore((s) => s.nextLayout);
    const showRouteTemplates = useArchitectureStore((s) => s.showRouteTemplates);
    const setShowRouteTemplates = useArchitectureStore((s) => s.setShowRouteTemplates);
    const setSelectedNodes = useArchitectureStore((s) => s.setSelectedNodes);
    const setConnectedSelectedNodes = useArchitectureStore((s) => s.setConnectedSelectedNodes);
    const exchangeMessage = useArchitectureStore((s) => s.exchangeMessage);

// Designer Store
    const setSelectedStep = useDesignerStore((s) => s.setSelectedStep);

// Files Store
    const files = useFilesStore((s) => s.files);

// Search Store
    const search = useSearchStore((s) => s.search);
    const searchResults = useSearchStore((s) => s.searchResults);
    const {selectFile, setDisabled, deleteRoute, setRouteGroup, showSideBar} = useTopologyHook();

    function setTopologySelected(model: Model, selectedIds: string []) {
        if (selectedIds.length > 0) {
            setSelectedNodes(selectedIds);
            const connectedIds: string[] = model.edges.map(e => {
                if (selectedIds.includes(e.source)) {
                    return e.target;
                } else if (selectedIds.includes(e.target)) {
                    return e.source;
                } else {
                    return null;
                }
            }).filter(id => id !== null);
            setConnectedSelectedNodes(connectedIds);

            const node = model.nodes?.filter(node => node.id === selectedIds[0]);
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
        } else {
            setSelectedNodes([])
            setConnectedSelectedNodes([])
        }
    }

    const customLayoutFactory: LayoutFactory = (type: string, graph: Graph): Layout => {
        if (layout === 'dagre') {
            return new TopologyDagreLayout(graph, {}, true);
        } else if (layout === 'elk') {
            return new TopologyElkLayout(graph, {});
        } else {
            return new ForceLayout(graph, {});
        }
    };

    const controller = React.useMemo(() => {
        const visualization = new Visualization();
        try {
            const filedFound = searchResults?.filter(s => s.projectId === project.projectId)?.at(0)?.files || [];
            const allFiles = files?.filter(f => search === '' || filedFound.includes(f.name));
            const camelFiles = files?.filter(f => f?.name?.endsWith('.camel.yaml')).map(f => new IntegrationFile(f.name, f.code));
            const openApiFile = files?.filter(f => f?.name === OPENAPI_FILE_NAME_JSON)?.at(0);
            const openApiJson = openApiFile?.code;

            const jsonSchemas = files?.map(f => f.name)?.filter(name => name?.endsWith(JSON_EXTENSION));

            const model = getModel(allFiles, camelFiles, showGroups,
                {selectFile, setDisabled, deleteRoute, setRouteGroup, showSideBar},
                openApiJson, showStats, jsonSchemas, showRouteTemplates);
            visualization.registerLayoutFactory((type, graph) => customLayoutFactory(type, graph));
            visualization.registerComponentFactory(getCustomComponentFactory(model));

            visualization.addEventListener(SELECTION_EVENT, args => setTopologySelected(model, args));
            visualization.addEventListener(GRAPH_LAYOUT_END_EVENT, () => {
                runInAction(() => {
                    visualization.getGraph().fit(90);
                });
            });
            visualization.addEventListener(NODE_POSITIONED_EVENT, (args: any) => {
            });
            visualization.fromModel(model, false);
        } catch (error: any) {
            console.error(error);
            EventBus.sendAlert('Error', error?.message, 'danger');
        }
        return visualization;
    }, [files, showGroups, showStats, layout, showRouteTemplates, project?.projectId, routeStatuses, search, searchResults, exchangeMessage]);

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
                    id: 'showGroups',
                    icon: showGroups ? getButtonTitle('Grouped', <GroupObjects className='carbon'/>) : getButtonTitle('Ungrouped', <UngroupObjects className='carbon'/>),
                    tooltip: 'Switch Ungrouped/Grouped',
                    callback: id => setShowGroups(!showGroups)
                },
                {
                    id: 'layout',
                    icon: getButtonTitle(capitalize(layout), <Template className='carbon'/>),
                    tooltip: 'Switch Layout',
                    callback: id => nextLayout()
                },
                {
                    id: "stats",
                    icon: <ArrayNumbers className='carbon'/>,
                    tooltip: showStats ? "Hide stats" : "Show stats",
                    callback: (id: any) => setShowStats(!showStats),
                },
                {
                    id: 'showRouteTemplates',
                    icon: showRouteTemplates ? getButtonTitle('Templates', <EyeIcon/>) : getButtonTitle('Templates', <EyeSlashIcon/>),
                    tooltip: 'Show/Hide Templates',
                    callback: id => setShowRouteTemplates(!showRouteTemplates)
                },
            ]
        });
    }, [controller, showLegend, showGroups, showRouteTemplates]);


    return {controller, controlButtons}
}