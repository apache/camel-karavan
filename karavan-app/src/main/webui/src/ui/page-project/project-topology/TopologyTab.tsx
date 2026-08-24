import * as React from 'react';
import {useEffect} from 'react';
import {TopologyControlBar, TopologyView, VisualizationProvider, VisualizationSurface,} from '@patternfly/react-topology';
import {useArchitectureStore} from "@stores/ArchitectureStore";
import {TopologyBeans} from "../project-topology/TopologyBeans";
import {TopologyLegend} from "../project-topology/TopologyLegend";
import {ModalConfirmation} from "@shared/ui/ModalConfirmation";
import {TopologyToolbar} from "../project-topology/TopologyToolbar";
import {ErrorBoundaryWrapper} from "@shared/ui/ErrorBoundaryWrapper";
import {TopologyController} from "../project-topology/TopologyController";
import {SvgGradient} from "@shared/ui/SvgGradient";
import {TopologyData} from "../project-topology/TopologyData";
import {useTopologyHook} from "../project-topology/useTopologyHook";

export function TopologyTab() {

    const showLegend = useArchitectureStore((s) => s.showLegend)
    const confirmationProps = useArchitectureStore((s) => s.confirmationProps)
    const setExchangeMessage = useArchitectureStore((s) => s.setExchangeMessage)
    const setSelectedVariable = useArchitectureStore((s) => s.setSelectedVariable)
    const setSelectedBean = useArchitectureStore((s) => s.setSelectedBean)
    const { controller, controlButtons } = TopologyController();
    const { files } = useTopologyHook();

    useEffect(() => {
        setSelectedVariable(null);
        setSelectedBean(null);
    }, [])

    return (
        <ErrorBoundaryWrapper key='info' onError={error => console.error(error)}>
            <TopologyToolbar/>
            <SvgGradient/>
            <TopologyView
                className="topology-panel"
                controlBar={<TopologyControlBar controlButtons={controlButtons}/>}
            >
                <VisualizationProvider controller={controller}>
                    <VisualizationSurface/>
                    {/*<TopologyDocumentation/>*/}
                    <TopologyData/>
                    <TopologyBeans/>
                    {showLegend && <TopologyLegend/>}
                    {confirmationProps?.isOpen && <ModalConfirmation {...confirmationProps}/>}
                </VisualizationProvider>
            </TopologyView>
        </ErrorBoundaryWrapper>
    );
}