import React, {useState} from 'react';
import {
    Bullseye,
    Button,
    EmptyState,
    EmptyStateIcon,
    EmptyStateVariant, Flex, FlexItem,
    Panel,
    PanelHeader,
    Text,
    Switch, TextContent, TextVariants, Title,
    Tooltip,
    TooltipPosition
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {ProjectEventBus} from "../ProjectEventBus";
import {RunnerInfoTraceModal} from "./RunnerInfoTraceModal";
import {TableComposable, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";


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
        <div>
            {isOpen && <RunnerInfoTraceModal isOpen={isOpen} trace={trace} nodes={nodes} onClose={closeModal}/>}
            <Panel>
                <PanelHeader>
                    <Flex direction={{default: "row"}} justifyContent={{default:"justifyContentFlexEnd"}}>
                        <FlexItem>
                            <TextContent>
                                <Text component={TextVariants.h6}>Auto refresh</Text>
                            </TextContent>
                        </FlexItem>
                        <FlexItem>
                            <Switch aria-label="refresh"
                                    id="refresh"
                                    isChecked={props.refreshTrace}
                                    onChange={checked => ProjectEventBus.refreshTrace(checked)}
                            />
                        </FlexItem>
                    </Flex>
                </PanelHeader>
            </Panel>
            <TableComposable aria-label="Files" variant={"compact"} className={"table"}>
                <Thead>
                    <Tr>
                        <Th key='uid' width={30}>Type</Th>
                        <Th key='exchangeId' width={40}>Filename</Th>
                        <Th key='timestamp' width={30}>Updated</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {exchanges.map(exchangeId => {
                        const node = getNode(exchangeId);
                        return <Tr key={node?.uid}>
                            <Td>
                                {node?.uid}
                            </Td>
                            <Td>
                                <Button style={{padding: '0'}} variant={"link"}
                                        onClick={e => {
                                            setTrace(trace);
                                            setNodes(getNodes(exchangeId));
                                            setIsOpen(true);
                                        }}>
                                    {exchangeId}
                                </Button>
                            </Td>
                            <Td>
                                {node ? new Date(node?.timestamp).toISOString() : ""}
                            </Td>

                        </Tr>
                    })}
                    {exchanges.length === 0 &&
                        <Tr>
                            <Td colSpan={8}>
                                <Bullseye>
                                    <EmptyState variant={EmptyStateVariant.small}>
                                        <EmptyStateIcon icon={SearchIcon}/>
                                        <Title headingLevel="h2" size="lg">
                                            No results found
                                        </Title>
                                    </EmptyState>
                                </Bullseye>
                            </Td>
                        </Tr>
                    }
                </Tbody>
            </TableComposable>
        </div>
    );
}
