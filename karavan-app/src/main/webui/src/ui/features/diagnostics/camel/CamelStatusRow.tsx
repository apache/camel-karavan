import React, {useState} from 'react';
import {CodeBlock, CodeBlockCode, Label, Tab, Tabs,} from '@patternfly/react-core';
import {Tbody, Td, Tr} from '@patternfly/react-table';
import {CamelStatus} from "@models/ProjectModels";

export interface Props {
    index: number
    camel: CamelStatus
}

export function CamelStatusRow(props: Props) {

    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [tab, setTab] = useState<string | number>('context');

    const {index, camel} = props;
    // const isRunning = container.state === 'running';
    // const color = isRunning ? "green" : "grey";
    return (
        <Tbody>
            <Tr className='camelstatus-data'>
                <Td noPadding isActionCell expand={{
                    rowIndex: props.index,
                    isExpanded: isExpanded,
                    onToggle: () => setIsExpanded(!isExpanded),
                    expandId: 'composable-expandable-example'
                }} modifier={"fitContent"}/>
                <Td noPadding modifier={"nowrap"}>
                    {camel.projectId}
                </Td>
                <Td noPadding modifier={"nowrap"}>
                    {camel.containerName}
                </Td>
                <Td noPadding>
                    <Label color={'green'}>{camel.env}</Label>
                </Td>
            </Tr>
            <Tr isExpanded={isExpanded} className='fields-data'>
                <Td/>
                <Td colSpan={3}>
                    <Tabs activeKey={tab} onSelect={(event, tabIndex) => setTab(tabIndex)}>
                        {camel.statuses.map(statusValue => (
                            <Tab eventKey={statusValue.name} title={statusValue.name}/>
                        ))}
                    </Tabs>
                    <CodeBlock>
                        <CodeBlockCode id="code-content">{camel.statuses.filter(s => s.name === tab).at(0)?.status}</CodeBlockCode>
                    </CodeBlock>
                </Td>
            </Tr>
        </Tbody>
    )
}
