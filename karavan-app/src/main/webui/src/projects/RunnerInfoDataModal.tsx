import React, {useEffect, useRef, useState} from 'react';
import {
    Badge, Bullseye,
    Button, CodeBlock, CodeBlockCode, DataList, DataListCell, DataListItem, DataListItemCells, DataListItemRow,
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm, Divider, EmptyState, EmptyStateIcon, EmptyStateVariant, Form, FormGroup, FormHelperText, HelperText, HelperTextItem,
    Label, LabelGroup, Modal, ModalVariant, Panel, PanelHeader, PanelMain, PanelMainBody, Switch, Text, TextInput, Title, ToggleGroup, ToggleGroupItem,
    Tooltip, TooltipPosition
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {getProjectFileType, PodStatus, Project, ProjectFileTypes} from "./ProjectModels";
import {KaravanApi} from "../api/KaravanApi";
import {ProjectEventBus} from "./ProjectEventBus";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import {TableComposable, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";

interface Props {
    trace: any
    isOpen: boolean
    onClose: () => void
}

export const RunnerInfoDataModal = (props: Props) => {

    const type = props.trace?.message?.body?.type;
    const body = props.trace?.message?.body?.value;
    const headers: any[] = [{key: "header1", value: "value1"}, {key: "header2", value: "value2"}];
    return (
        <Modal
            title={"Exchange: " + props.trace?.message?.exchangeId}
            variant={ModalVariant.large}
            isOpen={props.isOpen}
            onClose={() => props.onClose?.call(this)}
            actions={[
                <Button key="cancel" variant="primary" onClick={event => props.onClose?.call(this)}>Close</Button>
            ]}
        >
            <Panel isScrollable>
                <PanelMain tabIndex={0}>
                    <PanelHeader>
                        <DescriptionList isHorizontal>
                            <DescriptionListGroup>
                                <DescriptionListTerm>Headers</DescriptionListTerm>
                                <DescriptionListDescription>
                                    <DataList aria-label="Compact data list example" isCompact>
                                        {headers.map((header: any) => (
                                                <DataListItem key={header[0]} aria-labelledby="compact-item1">
                                                    <DataListItemRow>
                                                        <DataListItemCells
                                                            dataListCells={[
                                                                <DataListCell key="uid">{header.key}</DataListCell>,
                                                                <DataListCell key="routeId">{header.value}</DataListCell>,
                                                            ]}
                                                        />
                                                    </DataListItemRow>
                                                </DataListItem>))}
                                    </DataList>
                                </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                                <DescriptionListTerm>Body</DescriptionListTerm>
                                <DescriptionListDescription>
                                    {type && <Label>{type}</Label>}
                                </DescriptionListDescription>
                            </DescriptionListGroup>
                        </DescriptionList>
                    </PanelHeader>
                    <PanelMainBody style={{padding: "0"}}>
                        <CodeBlock title="Body">
                            <CodeBlockCode id="code-content">{body}</CodeBlockCode>
                        </CodeBlock>
                    </PanelMainBody>
                </PanelMain>
            </Panel>
        </Modal>
    );
}
