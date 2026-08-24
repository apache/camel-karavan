import * as React from 'react';
import './Architecture.css';
import {
    action,
    Controller,
    createTopologyControlButtons,
    defaultControlButtonsOptions,
    EdgeAnimationSpeed,
    EdgeModel,
    EdgeStyle,
    ForceLayout,
    Graph,
    GRAPH_LAYOUT_END_EVENT,
    Layout,
    Model,
    NodeModel,
    NodeShape,
    NodeStatus,
    SELECTION_EVENT,
    SELECTION_STATE,
    Visualization,
} from '@patternfly/react-topology';
import {useProjectsStore} from "@stores/ProjectStore";
import {EventBus} from "@designer/utils/EventBus";
import {runInAction} from "mobx";
import {useProjectInfoStore} from "@stores/useProjectInfoStore";
import {ProjectInfo} from "@models/CatalogModels";
import {ArrayNumbers, Template} from "@carbon/icons-react";
import {CONSUMER_PREFIX, NODE_DIAMETER_INOUT, NODE_DIAMETER_PROJECT, PRODUCER_PREFIX, PROJECT_ID_PREFIX, STANDALONE_NODE_ID, STANDALONE_PREFIX} from "./ArchitectureHook";
import getArchitectureComponentFactory from "./ArchitectureComponentFactory";
import {TopologyUtils} from "@core/api/TopologyUtils";
import {CamelDefinitionApi} from "@core/api/CamelDefinitionApi";
import {INTERNAL_COMPONENTS} from "@core/api/ComponentApi";
import {TopologyDagreLayout} from "@page-project/project-topology/graph/TopologyDagreLayout";
import {useArchitectureStore} from "@stores/ArchitectureStore";
import {capitalize} from "@patternfly/react-core";
import {EyeIcon, EyeSlashIcon} from "@patternfly/react-icons";
import {compareUri} from "@core/api/UriUtil";
import {ComplexityRouteType} from "@models/ComplexityModels";
import {TopologyElkLayout} from "@page-project/project-topology/graph/TopologyElkLayout";

export function ArchitectureController() {

    const {projectLabels, selectedLabels} = useProjectsStore();
    const [setFileName, showGroups, setShowGroups, showRouteTemplates, setShowRouteTemplates]
        = useArchitectureStore((s) => [s.setFileName, s.showGroups, s.setShowGroups, s.showRouteTemplates, s.setShowRouteTemplates]);
    const [showStats, setShowStats, layout, nextLayout]
        = useArchitectureStore((s) => [s.showStats, s.setShowStats, s.layout, s.nextLayout]);
    const [projects] = useProjectsStore((s) => [s.projects]);
    const [projectInfos] = useProjectInfoStore(s => [s.projectInfos]);

    function isProjectRunning(info: ProjectInfo): boolean {
        const isBuildRunning = info?.isBuildRunning ?? false;
        const isDevModeRunning = info?.isDevModeRunning ?? false;
        const isPackagedRunning = info?.isPackagedRunning ?? false;
        return isDevModeRunning || isPackagedRunning || isBuildRunning;
    }

    function getIntegrationNodes(infos: ProjectInfo[]): NodeModel[] {
        const resultNodes: NodeModel[] = [];
        infos.map(info => {
            const projectId = info.projectId;
            const isRunning = isProjectRunning(info);
            const name = projects.find(p => p.projectId === projectId)?.name
            const projectNodeId = `${PROJECT_ID_PREFIX}${projectId}`;
            const routesCount = info.routes?.length;
            const routesTooltip = "No Routes";
            const projectNode: NodeModel = {
                id: projectNodeId,
                type: 'node',
                label: name ?? projectId,
                width: NODE_DIAMETER_PROJECT,
                height: NODE_DIAMETER_PROJECT,
                shape: NodeShape.circle,
                status: NodeStatus.default,
                data: {
                    prefix: PROJECT_ID_PREFIX,
                    projectId: projectId,
                    exposesOpenApi: info.exposesOpenApi,
                    showStats: showStats,
                    isRunning: isRunning,
                    statusTooltip: (
                        <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                            {routesCount === 0 && <div>{routesTooltip}</div>}
                        </div>
                    ),
                }
            }
            resultNodes.push(projectNode);
        });
        return resultNodes;
    }

    function getComponentNodes(infos: ProjectInfo[]): NodeModel[] {
        const resultNodes: NodeModel[] = [];
        infos.map(info => {
            const projectId = info.projectId;
            const isRunning = isProjectRunning(info);
            const projectNodeId = `${PROJECT_ID_PREFIX}${projectId}`;
            const routes = showRouteTemplates === true ? info.routes : info.routes.filter(r => r.type !== ComplexityRouteType.ROUTE_TEMPlATE);
            routes?.forEach((route) => {
                route.consumers
                    ?.filter(c => !INTERNAL_COMPONENTS.includes(c.name) && c.remote === true)
                    ?.forEach((component) => {
                        const uniqueUri = TopologyUtils.getUniqueUri(CamelDefinitionApi.createFromDefinition({uri: component.name, parameters: component.parameters}));
                        const componentNodeId = route.routeId + "_" + component.id;
                        const node: NodeModel = {
                            id: uniqueUri,
                            type: 'node',
                            label: TopologyUtils.getUriLabel(uniqueUri) ?? component.id,
                            width: NODE_DIAMETER_INOUT,
                            height: NODE_DIAMETER_INOUT,
                            shape: NodeShape.circle,
                            data: {
                                prefix: CONSUMER_PREFIX,
                                component: component,
                                projectId: projectId,
                                projectNodeId: projectNodeId,
                                showStats: showStats,
                                isRunning: isRunning,
                            }
                        }
                        resultNodes.push(node);
                    });
                route.producers
                    ?.filter(c => !INTERNAL_COMPONENTS.includes(c.name) && c.remote === true)
                    ?.forEach((component) => {
                        const uniqueUri = TopologyUtils.getUniqueUri(CamelDefinitionApi.createFromDefinition({uri: component.name, parameters: component.parameters}));
                        const componentNodeId = route.routeId + "_" + component.id;
                        const node: NodeModel = {
                            id: uniqueUri,
                            type: 'node',
                            label: (TopologyUtils.getUriLabel(uniqueUri) ?? component.id),
                            width: NODE_DIAMETER_INOUT,
                            height: NODE_DIAMETER_INOUT,
                            shape: NodeShape.circle,
                            data: {
                                prefix: PRODUCER_PREFIX,
                                component: component,
                                projectId: projectId,
                                projectNodeId: projectNodeId,
                                showStats: showStats,
                                isRunning: isRunning,
                            }
                        }
                        resultNodes.push(node);
                    })
            })
        });
        return resultNodes;
    }

    function getIntegrationEdges(infos: ProjectInfo[]): EdgeModel[] {
        const result: EdgeModel[] = [];
        infos.map(info => {
            const projectId = info.projectId;
            const isRunning = isProjectRunning(info);
            const projectNodeId = `${PROJECT_ID_PREFIX}${projectId}`;
            const routes = showRouteTemplates === true ? info.routes : info.routes.filter(r => r.type !== ComplexityRouteType.ROUTE_TEMPlATE);
            routes?.forEach((route) => {
                route.consumers
                    ?.filter(c => !INTERNAL_COMPONENTS.includes(c.name) && c.remote === true)
                    ?.forEach((component) => {
                        const uniqueUri = TopologyUtils.getUniqueUri(CamelDefinitionApi.createFromDefinition({uri: component.name, parameters: component.parameters}));
                        const componentNodeId = route.routeId + "_" + component.id;
                        const edge: EdgeModel = {
                            id: 'edge-' + componentNodeId + '-' + projectNodeId,
                            type: 'edge',
                            source: uniqueUri,
                            target: projectNodeId,
                            edgeStyle: EdgeStyle.dashedMd,
                            animationSpeed: isRunning ? EdgeAnimationSpeed.medium : EdgeAnimationSpeed.none,
                            data: {
                                isRunning: isRunning
                            }
                        }
                        result.push(edge);
                    });
                route.producers
                    ?.filter(c => !INTERNAL_COMPONENTS.includes(c.name) && c.remote === true)
                    ?.forEach((component) => {
                        const uniqueUri = TopologyUtils.getUniqueUri(CamelDefinitionApi.createFromDefinition({uri: component.name, parameters: component.parameters}));
                        const componentNodeId = route.routeId + "_" + component.id;
                        const edge: EdgeModel = {
                            id: 'edge-' + projectNodeId + '-' + componentNodeId,
                            type: 'edge',
                            source: projectNodeId,
                            target: uniqueUri,
                            edgeStyle: EdgeStyle.dashedMd,
                            animationSpeed: isRunning ? EdgeAnimationSpeed.medium : EdgeAnimationSpeed.none,
                            data: {
                                isRunning: isRunning
                            }
                        }
                        result.push(edge);
                    })
            })
        });
        return result;
    }

    function getWildCardUriEdges(nodes: NodeModel[]): EdgeModel[] {
        const result: EdgeModel[] = [];
        const consumers = nodes.filter(n => n.data?.prefix === CONSUMER_PREFIX);
        const producers = nodes.filter(n => n.data?.prefix === PRODUCER_PREFIX);
        producers.forEach(producer => {
            consumers
                .filter(consumer => (producer.id !== consumer.id) && compareUri(producer.id, consumer.id))
                .forEach(consumer => {
                    const edge: EdgeModel = {
                        id: 'edge-wildcard-uri-' + producer.id + '-' + consumer.id,
                        type: 'edge',
                        source: producer.id,
                        target: consumer.id,
                        edgeStyle: EdgeStyle.dotted,
                        animationSpeed: (consumer.data?.isRunning && producer.data?.isRunning) ? EdgeAnimationSpeed.medium : EdgeAnimationSpeed.none,
                        data: {}
                    }
                    result.push(edge);
                })
        })
        return result;
    }


    /**
     * A component node only carries information when it ties different projects together, so keep
     * the ones whose edges reach more than one project and drop the edges left dangling by the
     * removed nodes. A remote URI shared by several projects is a single node id reached by one
     * integration edge per project, plus wildcard edges to the matching URIs of other projects.
     */
    function filterConnectedComponentNodes(componentNodes: NodeModel[], edges: EdgeModel[]): [NodeModel[], EdgeModel[]] {
        // The same component node id occurs once per project using that URI
        const projectIdsByComponentNodeId = new Map<string, Set<string>>();
        const projectIdByProjectNodeId = new Map<string, string>();
        componentNodes.forEach(node => {
            const projectId = node.data?.projectId;
            const projectNodeId = node.data?.projectNodeId;
            if (projectId === undefined) {
                return;
            }
            if (!projectIdsByComponentNodeId.has(node.id)) {
                projectIdsByComponentNodeId.set(node.id, new Set<string>());
            }
            projectIdsByComponentNodeId.get(node.id)?.add(projectId);
            if (projectNodeId !== undefined) {
                projectIdByProjectNodeId.set(projectNodeId, projectId);
            }
        });

        function getProjectIdsOf(nodeId?: string): string[] {
            if (nodeId === undefined) {
                return [];
            }
            const projectId = projectIdByProjectNodeId.get(nodeId);
            return projectId !== undefined ? [projectId] : [...(projectIdsByComponentNodeId.get(nodeId) ?? [])];
        }

        // Collect, per component node, every project reachable through its edges
        const reachableProjectIds = new Map<string, Set<string>>();

        function addReachableProjects(nodeId?: string, otherNodeId?: string) {
            if (nodeId === undefined || !projectIdsByComponentNodeId.has(nodeId)) {
                return;
            }
            if (!reachableProjectIds.has(nodeId)) {
                reachableProjectIds.set(nodeId, new Set<string>());
            }
            getProjectIdsOf(otherNodeId).forEach(projectId => reachableProjectIds.get(nodeId)?.add(projectId));
        }

        edges.forEach(edge => {
            addReachableProjects(edge.source, edge.target);
            addReachableProjects(edge.target, edge.source);
        });

        const sharedNodes = componentNodes.filter(node => (reachableProjectIds.get(node.id)?.size ?? 0) > 1);
        const sharedNodeIds = new Set(sharedNodes.map(node => node.id));
        // Only an edge pointing at a component node that got dropped is dangling
        const sharedEdges = edges.filter(edge => [edge.source, edge.target]
            .every(nodeId => nodeId === undefined || !projectIdsByComponentNodeId.has(nodeId) || sharedNodeIds.has(nodeId)));

        return [sharedNodes, sharedEdges];
    }

    /**
     * A project without any component connection has nothing holding it in place, so all of them
     * are attached to one shared node that acts as their common anchor.
     */
    function getStandaloneNode(): NodeModel {
        return {
            id: STANDALONE_NODE_ID,
            type: 'node',
            label: 'Standalone',
            width: NODE_DIAMETER_INOUT,
            height: NODE_DIAMETER_INOUT,
            shape: NodeShape.circle,
            data: {
                prefix: STANDALONE_PREFIX,
                showStats: false,
                isRunning: false,
            }
        }
    }

    function getStandaloneEdges(integrationNodes: NodeModel[], edges: EdgeModel[]): EdgeModel[] {
        // Integration edges are the only ones touching a project node, so a project missing from
        // the surviving edges is a project with no component to connect to
        const connectedNodeIds = new Set(edges.flatMap(edge => [edge.source, edge.target]));
        return integrationNodes
            .filter(node => !connectedNodeIds.has(node.id))
            .map(node => ({
                id: 'edge-standalone-' + node.id,
                type: 'edge',
                source: STANDALONE_NODE_ID,
                target: node.id,
                data: {
                    isTransparent: true
                }
            }));
    }

    function getModel(): Model {
        const nodes: NodeModel[] = [];
        const edges: EdgeModel[] = [];
        const projectInfosWithSelected = projectInfos.filter((project) => {
            const projectTags = projectLabels[project.projectId] || [];
            return projectTags.some((label: string) => selectedLabels.includes(label));
        });
        const integrationNodes = getIntegrationNodes(projectInfosWithSelected);
        const componentNodes = getComponentNodes(projectInfosWithSelected);
        const integrationEdges = getIntegrationEdges(projectInfosWithSelected);
        // Wildcard edges are matched against every component node, before any of them are dropped
        const wildCardUriEdges = getWildCardUriEdges(componentNodes);
        const [connectedComponentNodes, connectedEdges] =
            filterConnectedComponentNodes(componentNodes, [...integrationEdges, ...wildCardUriEdges]);
        const standaloneEdges = getStandaloneEdges(integrationNodes, connectedEdges);
        nodes.push(...integrationNodes)
        nodes.push(...connectedComponentNodes)
        // The anchor is only worth showing when something actually hangs off it
        if (standaloneEdges.length > 0) {
            nodes.push(getStandaloneNode())
        }
        edges.push(...connectedEdges)
        edges.push(...standaloneEdges)
        return {nodes: nodes, edges: edges, graph: {id: 'graph', type: 'graph', layout: 'elements'}};
    }

    function customLayoutFactory(type: string, graph: Graph): Layout {
        if (layout === 'dagre') {
            return new TopologyDagreLayout(graph, {}, true);
        } else if (layout === 'elk') {
            return new TopologyElkLayout(graph, {});
        } else {
            return new ForceLayout(graph, {});
        }
    }

    const controller = React.useMemo(() => {
        const visualization = new Visualization();
        try {
            const model = getModel();
            visualization.registerLayoutFactory((type, graph) => customLayoutFactory(type, graph));
            visualization.registerComponentFactory(getArchitectureComponentFactory());
            visualization.addEventListener(GRAPH_LAYOUT_END_EVENT, () => {
                runInAction(() => {
                    visualization.getGraph().fit(90);
                });
            });
            visualization.fromModel(model, false);
        } catch (error: any) {
            console.error(error);
            EventBus.sendAlert('Error', error?.message, 'danger');
        }
        return visualization;
    }, [projectInfos, showGroups, showStats, layout, showRouteTemplates, selectedLabels, projectLabels]);

    function clearAllSelection(ctrl: Controller) {
        runInAction(() => {
            ctrl.getElements().forEach((e) => {
                const state: any = ctrl.getState();
                state[SELECTION_STATE] = [];
            });
            ctrl.fireEvent(SELECTION_EVENT, []);
        })
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
            legendHidden: true,
            fitToScreenCallback: action(() => {
                controller.getGraph().fit(200);
            }),
            resetViewCallback: action(() => {
                controller.getGraph().reset();
                controller.getGraph().layout();
            }),
            customButtons: [
                // {
                //     id: 'showGroups',
                //     icon: showGroups ? getButtonTitle('Grouped', <GroupObjects className='carbon'/> ) : getButtonTitle('Ungrouped', <UngroupObjects className='carbon'/>) ,
                //     tooltip: 'Switch Ungrouped/Grouped',
                //     callback: id => setShowGroups(!showGroups)
                // },
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
            ],
        });
    }, [controller, controller, showGroups, showRouteTemplates, selectedLabels]);


    return {clearAllSelection, controller, controlButtons}
}