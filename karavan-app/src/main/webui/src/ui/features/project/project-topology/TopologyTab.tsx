import * as React from 'react';
import {useState} from 'react';
import {
    action,
    createTopologyControlButtons,
    DagreLayout,
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
import {getCustomComponentFactory} from "@features/project/project-topology/CustomComponentFactory";
import {shallow} from "zustand/shallow";
import {useTopologyStore} from "@stores/TopologyStore";
import {useDesignerStore} from "@features/project/designer/DesignerStore";
import {IntegrationFile} from "@core/model/IntegrationDefinition";
import {TopologyBeans} from "@features/project/project-topology/TopologyBeans";
import {getModel} from "@features/project/project-topology/TopologyApi";
import {useTopologyHook} from "@features/project/project-topology/useTopologyHook";
import {TopologyLegend} from "@features/project/project-topology/TopologyLegend";
import {ModalConfirmation, ModalConfirmationProps} from "@shared/ui/ModalConfirmation";
import {EyeIcon, EyeSlashIcon} from '@patternfly/react-icons';
import {ArrayNumbers, GroupObjects, Template, UngroupObjects} from '@carbon/icons-react';
import {useFilesStore, useProjectStore} from "@stores/ProjectStore";
import {NODE_POSITIONED_EVENT} from "@patternfly/react-topology/src/types";
import {JSON_EXTENSION, OPENAPI_FILE_NAME_JSON} from "@core/contants";
import {runInAction} from "mobx";
import {TopologyToolbar} from "@features/project/project-topology/TopologyToolbar";
import {TopologyElkLayout} from "@features/project/project-topology/graph/TopologyElkLayout";
import {capitalize} from "@patternfly/react-core";
import {TopologyDocumentation} from "@features/project/project-topology/TopologyDocumentation";
import {ErrorBoundaryWrapper} from "@shared/ui/ErrorBoundaryWrapper";

interface Props {
    asyncApiJson?: string
}

export function TopologyTab(props: Props) {

    const {asyncApiJson } = props;
    const [setFileName, showGroups, setShowGroups, showBeans, setShowBeans, showLegend, setShowLegend]
        = useTopologyStore((s) => [s.setFileName, s.showGroups, s.setShowGroups, s.showBeans, s.setShowBeans, s.showLegend, s.setShowLegend]);
    const [showStats, setShowStats, layout, setLayout] = useTopologyStore((s) => [s.showStats, s.setShowStats, s.layout, s.setLayout]);
    const [setSelectedStep] = useDesignerStore((s) => [s.setSelectedStep], shallow)
    const [files] = useFilesStore((s) => [s.files], shallow);
    const [project] = useProjectStore((s) => [s.project], shallow);
    const [confirmationProps, setConfirmationProps] = useState<ModalConfirmationProps>();
    const {selectFile, setDisabled, deleteRoute, setRouteGroup} = useTopologyHook(setConfirmationProps);

    const camelFiles = files
        ?.filter(f => f?.name?.endsWith('.camel.yaml'))
        // .filter(f => search === '' || filedFound.includes(f.name))
        .map(f => new IntegrationFile(f.name, f.code));
    const openApiFile = files?.filter(f => f?.name === OPENAPI_FILE_NAME_JSON)?.at(0);
    const openApiJson = openApiFile?.code;

    const jsonSchemas = files?.map(f => f.name)?.filter(name => name?.endsWith(JSON_EXTENSION))?.map(name => name);

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
        if (layout === 'dagre') {
            return new DagreLayout(graph, {
                rankdir: 'TB',
                ranker: "network-simplex",
                nodesep: 20,
                edgesep: 20,
                ranksep: 10,
                linkDistance: 20,
                nodeDistance: 30,
                groupDistance: 20,
                collideDistance: 20
            });
        } else {
            return new TopologyElkLayout(graph, {});
        }
    };

    const controller = React.useMemo(() => {
        const model = getModel(project.projectId, camelFiles, showGroups, selectFile, setDisabled, deleteRoute, setRouteGroup, openApiJson, asyncApiJson, showStats, jsonSchemas);
        const controller = new Visualization();

        controller.registerLayoutFactory((type, graph) => customLayoutFactory(type, graph));
        controller.registerComponentFactory(getCustomComponentFactory(model, false));

        controller.addEventListener(SELECTION_EVENT, args => setTopologySelected(model, args));
        controller.addEventListener(GRAPH_LAYOUT_END_EVENT, () => {
            runInAction(() => {
                controller.getGraph().fit(90);
            });
        });
        controller.addEventListener(NODE_POSITIONED_EVENT, (args: any) => {
        });
        controller.fromModel(model, false);
        return controller;
    }, [files, showGroups, asyncApiJson, showStats, layout]);

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
                    icon: showGroups ? getButtonTitle('Grouped', <GroupObjects className='carbon'/> ) : getButtonTitle('Ungrouped', <UngroupObjects className='carbon'/>) ,
                    tooltip: 'Switch Ungrouped/Grouped',
                    callback: id => setShowGroups(!showGroups)
                },
                {
                    id: 'layout',
                    icon: getButtonTitle(capitalize(layout), <Template className='carbon'/> ) ,
                    tooltip: 'Switch Layout',
                    callback: id => setLayout(layout === 'dagre' ? 'elk' : 'dagre')
                },
                {
                    id: "stats",
                    icon: <ArrayNumbers className='carbon'/>,
                    tooltip: showStats ? "Hide stats" : "Show stats",
                    callback: (id: any) => setShowStats(!showStats),
                },
                {
                    id: 'showBeans',
                    icon: showBeans ? getButtonTitle('Beans', <EyeIcon/>) : getButtonTitle('Beans', <EyeSlashIcon/>),
                    tooltip: 'Show/Hide Beans',
                    callback: id => setShowBeans(!showBeans)
                },
            ],
        });
    }, [controller, showLegend, showBeans, showGroups]);

    return (
        <ErrorBoundaryWrapper key='info' onError={error => console.error(error)}>
            <TopologyToolbar/>
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
                    <TopologyDocumentation/>
                    {showBeans && <TopologyBeans/>}
                    {showLegend && <TopologyLegend/>}
                    {confirmationProps?.isOpen && <ModalConfirmation {...confirmationProps}/>}
                </VisualizationProvider>
            </TopologyView>
        </ErrorBoundaryWrapper>
    );
}