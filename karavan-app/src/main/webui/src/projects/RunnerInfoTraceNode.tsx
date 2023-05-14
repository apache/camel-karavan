import React from 'react';
import {
    CodeBlock, CodeBlockCode, DataList, DataListCell, DataListItem, DataListItemCells, DataListItemRow, DataListWrapModifier,
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm, Panel, PanelHeader, PanelMain, PanelMainBody
} from '@patternfly/react-core';
import '../designer/karavan.css';

interface Props {
    trace: any
}

export const RunnerInfoTraceNode = (props: Props) => {

    const type = props.trace?.message?.body?.type;
    const body = props.trace?.message?.body?.value;
    const headers: any[] = [{key: "header1", type: "java.lang.String", value: "value1"}, {key: "header2", type: "java.lang.String", value: "value2"}];
    return (
        <Panel isScrollable>
                <PanelMain tabIndex={0}>
                    <PanelHeader>
                        <DescriptionList isHorizontal>
                            <DescriptionListGroup>
                                <DescriptionListTerm>Headers</DescriptionListTerm>
                            </DescriptionListGroup>
                            <DataList aria-label="Compact data list example" isCompact>
                                {headers.map((header: any) => (
                                    <DataListItem key={header[0]} aria-labelledby="compact-item1">
                                        <DataListItemRow>
                                            <DataListItemCells
                                                dataListCells={[
                                                    <DataListCell key="uid" >{header.key}</DataListCell>,
                                                    <DataListCell key="type">{header.type}</DataListCell>,
                                                    <DataListCell key="routeId" wrapModifier={DataListWrapModifier.truncate}>
                                                        {header.value}
                                                    </DataListCell>,
                                                ]}
                                            />
                                        </DataListItemRow>
                                    </DataListItem>))}
                            </DataList>
                            <DescriptionListGroup>
                                <DescriptionListTerm>Body</DescriptionListTerm>
                                <DescriptionListDescription>
                                    {type}
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
    );
}
