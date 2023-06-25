import React, {useState} from 'react';
import {
    Flex, FlexItem,
    Modal, ModalVariant, DescriptionListGroup, DescriptionListTerm, DescriptionList, Button
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {RunnerInfoTraceNode} from "./RunnerInfoTraceNode";
import ArrowRightIcon from "@patternfly/react-icons/dist/esm/icons/arrow-right-icon";

interface Props {
    trace: any
    nodes: any[]
    isOpen: boolean
    onClose: () => void
}

export const RunnerInfoTraceModal = (props: Props) => {

    const [activeNode, setActiveNode] = useState(props.nodes.at(0));

    function getComponent(node: any): any {
        return {name: node.nodeId, component: (<p>Step 1 content</p>) }
    }

    function getRoutes(): any[] {
        return Array.from(new Set((props.nodes).map((item: any) => item?.routeId)));
    }

    return (
        <Modal
            title={"Exchange: " + props.trace?.message?.exchangeId}
            variant={ModalVariant.large}
            isOpen={props.isOpen}
            onClose={() => props.onClose?.call(this)}
            actions={[
            ]}
        >
            <Flex direction={{default: "row"}} justifyContent={{default:"justifyContentSpaceBetween"}}>
                <FlexItem flex={{default: "flex_1"}}>
                    <DescriptionList>
                        <DescriptionListGroup>
                            <DescriptionListTerm>Nodes</DescriptionListTerm>
                        </DescriptionListGroup>
                    </DescriptionList>
                    {props.nodes.map((node: any) => (
                        <FlexItem>
                            <Button variant={node.uid === activeNode.uid ? "secondary" : "link"}
                                    icon={node.nodeId === undefined ? <ArrowRightIcon/> : undefined}
                                    onClick={event => {setActiveNode(node)}}>
                                {node.nodeId ? node.nodeId : node.routeId}
                            </Button>
                        </FlexItem>
                    ))}
                </FlexItem>
                <FlexItem flex={{default: "flex_3"}}>
                    <DescriptionList>
                        <DescriptionListGroup>
                            <DescriptionListTerm>Exchange</DescriptionListTerm>
                        </DescriptionListGroup>
                    </DescriptionList>
                    <RunnerInfoTraceNode trace={activeNode} />
                </FlexItem>
            </Flex>
        </Modal>
    );
}
