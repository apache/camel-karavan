import React, {useState} from 'react';
import {Badge, CodeBlock, CodeBlockCode, Label,} from '@patternfly/react-core';
import {Tbody, Td, Tr} from '@patternfly/react-table';
import {ContainerStatus} from "@/api/ProjectModels";

export interface Props {
    index: number
    container: ContainerStatus
}

export function ContainerStatusRow(props: Props) {

    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    const {index, container} = props;
    const isRunning = container.state === 'running';
    const color = isRunning ? "green" : "grey";
    return (
        <Tbody>
            <Tr key={container.projectId + ':' + index} className='camelstatus-data'>
                <Td noPadding isActionCell expand={{
                    rowIndex: props.index,
                    isExpanded: isExpanded,
                    onToggle: () => setIsExpanded(!isExpanded),
                    expandId: 'composable-expandable-example'
                }} modifier={"fitContent"}/>
                <Td noPadding modifier={"fitContent"}>
                    {container.containerName}
                </Td>
                <Td noPadding modifier={"wrap"}>
                    {container.containerId}
                </Td>
                <Td noPadding modifier={"fitContent"}>
                   <Badge> {container.type}</Badge>
                </Td>
                <Td noPadding modifier={"fitContent"}>
                    <Label color={color}>{container.state}</Label>
                </Td>
                <Td noPadding modifier={"fitContent"}>
                    <Label color={color}>{container.env}</Label>
                </Td>
            </Tr>
            <Tr isExpanded={isExpanded} className='fields-data'>
                <Td/>
                <Td colSpan={5} modifier={"fitContent"}>
                    <CodeBlock>
                        <CodeBlockCode id="code-content">{JSON.stringify(container, null, 2)}</CodeBlockCode>
                    </CodeBlock>
                </Td>
            </Tr>
        </Tbody>
    )
}
