import React, {useState} from 'react';
import {
    Button, DataList, DataListCell, DataListItem, DataListItemCells, DataListItemRow,
    DescriptionList,
    DescriptionListGroup,
    DescriptionListTerm, Panel, PanelHeader, PanelMain, PanelMainBody, Switch,
    Tooltip, TooltipPosition
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {ProjectEventBus} from "./ProjectEventBus";
import {RunnerInfoTraceModal} from "./RunnerInfoTraceModal";


interface Props {
    trace: any
    refreshTrace: boolean
}

export const RunnerInfoTrace = (props: Props) => {

    const [trace, setTrace] = useState({});
    const [nodes, setNodes] = useState([{}]);
    const [isOpen, setIsOpen] = useState(false);

    function closeModal() {
        setIsOpen(false);
    }

    function getNodes(exchangeId: string): any[] {
        const traces: any[] = props.trace?.trace?.traces || [];
        return traces
            .filter(t => t.message?.exchangeId === exchangeId)
            .sort((a, b) => a.uid > b.uid ? 1 : -1);
    }

    function getNode(exchangeId: string): any {
        const traces: any[] = props.trace?.trace?.traces || [];
        return traces
            .filter(t => t.message?.exchangeId === exchangeId)
            .sort((a, b) => a.uid > b.uid ? 1 : -1)
            .at(0);
    }

    const traces: any[] = (props.trace?.trace?.traces || []).sort((a: any, b: any) => b.uid > a.uid ? 1 : -1);
    const exchanges: any[] = Array.from(new Set((traces).map((item: any) => item?.message?.exchangeId)));
    return (
        <Panel isScrollable>
            {isOpen && <RunnerInfoTraceModal isOpen={isOpen} trace={trace} nodes={nodes} onClose={closeModal}/>}
            <PanelHeader>
                <div style={{display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
                    <DescriptionList>
                        <DescriptionListGroup>
                            <DescriptionListTerm>Trace routed messages</DescriptionListTerm>
                        </DescriptionListGroup>
                    </DescriptionList>
                    <div style={{marginRight: "16px"}}>
                        <Tooltip content="Auto refresh" position={TooltipPosition.left}>
                            <Switch aria-label="refresh"
                                    id="refresh"
                                    isChecked={props.refreshTrace}
                                    onChange={checked => ProjectEventBus.refreshTrace(checked)}
                            />
                        </Tooltip>
                    </div>
                </div>
            </PanelHeader>
            <PanelMain tabIndex={0}>
                <PanelMainBody style={{padding: "0"}}>
                    <DataList aria-label="Compact data list example" isCompact>
                        {exchanges.map(exchangeId => {
                            const node = getNode(exchangeId);
                            return <DataListItem key={exchangeId} aria-labelledby="compact-item1">
                                <DataListItemRow>
                                    <DataListItemCells
                                        dataListCells={[
                                            <DataListCell key="uid">{node?.uid}</DataListCell>,
                                            <DataListCell key="exchangeId">
                                                <Button style={{padding: '0'}} variant={"link"}
                                                        onClick={e => {
                                                            setTrace(trace);
                                                            setNodes(getNodes(exchangeId));
                                                            setIsOpen(true);
                                                        }}>
                                                    {exchangeId}
                                                </Button>

                                            </DataListCell>,
                                            <DataListCell key="timestamp">{node ? new Date(node?.timestamp).toISOString() : ""}</DataListCell>
                                        ]}
                                    />
                                </DataListItemRow>
                            </DataListItem>
                        })}
                    </DataList>
                </PanelMainBody>
            </PanelMain>
        </Panel>
    );
}
