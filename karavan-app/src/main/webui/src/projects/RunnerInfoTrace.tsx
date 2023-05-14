import React, {useEffect, useRef, useState} from 'react';
import {
    Badge, Bullseye,
    Button, DataList, DataListCell, DataListItem, DataListItemCells, DataListItemRow,
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm, Divider, EmptyState, EmptyStateIcon, EmptyStateVariant,
    Label, LabelGroup, Panel, PanelHeader, PanelMain, PanelMainBody, Switch, Title,
    Tooltip, TooltipPosition
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {getProjectFileType, PodStatus, Project} from "./ProjectModels";
import {KaravanApi} from "../api/KaravanApi";
import {ProjectEventBus} from "./ProjectEventBus";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import {TableComposable, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";
import {RunnerInfoDataModal} from "./RunnerInfoDataModal";


interface Props {
    trace: any
    refreshTrace: boolean
}

export const RunnerInfoTrace = (props: Props) => {

    const [trace, setTrace] = useState({});
    const [isOpen, setIsOpen] = useState(false);

    function closeModal() {
        setIsOpen(false);
    }

    const traces: any[] = props.trace?.trace?.traces || [];
    return (
        <Panel isScrollable>
            <RunnerInfoDataModal isOpen={isOpen} trace={trace} onClose={closeModal}/>
            <PanelHeader>
                <div style={{display:"flex", flexDirection:"row", justifyContent:"space-between"}}>
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
                        {traces.filter(t => t.nodeId === undefined)
                            .sort((a, b) => b.uid > a.uid ? 1 : -1)
                            .map(trace => (
                                <DataListItem key={trace.uid} aria-labelledby="compact-item1">
                                    <DataListItemRow>
                                        <DataListItemCells
                                            dataListCells={[
                                                <DataListCell key="uid">{trace.uid}</DataListCell>,
                                                <DataListCell key="routeId">{trace.routeId}</DataListCell>,
                                                <DataListCell key="exchangeId">
                                                    <Button style={{padding: '0'}} variant={"link"}
                                                            onClick={e => {
                                                                setTrace(trace);
                                                                setIsOpen(true);
                                                            }}>
                                                        {trace.message.exchangeId}
                                                    </Button>

                                                </DataListCell>,
                                                <DataListCell key="timestamp">{new Date(trace.timestamp).toISOString()}</DataListCell>
                                            ]}
                                        />
                                    </DataListItemRow>
                                </DataListItem>))}
                    </DataList>
                </PanelMainBody>
            </PanelMain>
        </Panel>
    );
}
