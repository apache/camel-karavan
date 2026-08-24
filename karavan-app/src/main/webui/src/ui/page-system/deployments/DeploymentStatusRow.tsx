import React, {useState} from 'react';
import {CodeBlock, CodeBlockCode, Label,} from '@patternfly/react-core';
import {Tbody, Td, Tr} from '@patternfly/react-table';
import {DeploymentStatus} from "@models/ProjectModels";

export interface Props {
    index: number
    deployment: DeploymentStatus
}

export function DeploymentStatusRow(props: Props) {

    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    const {index, deployment} = props;
    const isRunning = deployment.readyReplicas === deployment.replicas
    const color = isRunning ? "green" : "grey";
    return (
        <Tbody>
            <Tr key={deployment.projectId + ':' + index} className='camelstatus-data'>
                <Td noPadding isActionCell expand={{
                    rowIndex: props.index,
                    isExpanded: isExpanded,
                    onToggle: () => setIsExpanded(!isExpanded),
                    expandId: 'composable-expandable-example'
                }} modifier={"fitContent"}/>
                <Td noPadding modifier={"fitContent"}>
                    {deployment.projectId}
                </Td>
                <Td noPadding modifier={"wrap"}>
                    {deployment.image}
                </Td>
                <Td noPadding modifier={"fitContent"}>
                    <Label color={color}>{deployment.env}</Label>
                </Td>
                <Td noPadding modifier={"fitContent"}>
                    <Label color={color}>{deployment.namespace}</Label>
                </Td>
            </Tr>
            <Tr isExpanded={isExpanded} className='fields-data'>
                <Td/>
                <Td colSpan={4} modifier={"fitContent"}>
                    <CodeBlock>
                        <CodeBlockCode id="code-content">{JSON.stringify(deployment, null, 2)}</CodeBlockCode>
                    </CodeBlock>
                </Td>
            </Tr>
        </Tbody>
    )
}
