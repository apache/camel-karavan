import React, {useState} from 'react';
import {
    Button,
    Tooltip,
    Flex, FlexItem, Label, Badge
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {ExpandableRowContent, Tbody, Td, Tr} from "@patternfly/react-table";
import StopIcon from "@patternfly/react-icons/dist/js/icons/stop-icon";
import PlayIcon from "@patternfly/react-icons/dist/esm/icons/play-icon";
import {ContainerStatus} from "../api/ProjectModels";

interface Props {
    index: number
    container: ContainerStatus
}

export const ContainerTableRow = (props: Props) => {

    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [running, setRunning] = useState<boolean>(false);

    const container = props.container;
    const env = container.env;
    const ports = container.ports;
    const icon = running ? <StopIcon/> : <PlayIcon/>;
    const tooltip = running ? "Stop container" : "Start container";
    const color = container.lifeCycle === 'ready' ? "green" : "grey";
    return (
        <Tbody isExpanded={isExpanded}>
            <Tr key={container.containerName}>
                <Td expand={
                    container.containerName
                        ? {
                            rowIndex: props.index,
                            isExpanded: isExpanded,
                            onToggle: () => setIsExpanded(!isExpanded),
                            expandId: 'composable-expandable-example'
                        }
                        : undefined}
                    modifier={"fitContent"}>
                </Td>
                <Td style={{verticalAlign: "middle"}} modifier={"fitContent"}>
                    <Badge className="badge">{container.type}</Badge>
                </Td>
                <Td>
                    <Label color={color}>{container.containerName}</Label>
                </Td>
                <Td>{container.image}</Td>
                <Td>
                    <Label color={color}>{container.cpuInfo}</Label>
                </Td>
                <Td>
                    <Label color={color}>{container.memoryInfo}</Label>
                </Td>
                {/*<Td>{container.environment}</Td>*/}
                <Td className="project-action-buttons">
                    <Flex direction={{default: "row"}} justifyContent={{default: "justifyContentFlexEnd"}}
                          spaceItems={{default: 'spaceItemsNone'}}>
                        <FlexItem>
                            <Tooltip content={tooltip} position={"bottom"}>
                                <Button variant={"plain"} icon={icon} onClick={e => {
                                    // setProject(project, "delete");
                                }}></Button>
                            </Tooltip>
                        </FlexItem>
                    </Flex>
                </Td>
            </Tr>
            {<Tr isExpanded={isExpanded}>
                <Td></Td>
                <Td colSpan={2}>Container ID</Td>
                <Td colSpan={2}>
                    <ExpandableRowContent>
                        <Flex direction={{default: "column"}} cellPadding={"0px"}>
                            {container.containerId}
                        </Flex>
                    </ExpandableRowContent>
                </Td>
            </Tr>}
            {ports !== undefined && ports.length > 0 && <Tr isExpanded={isExpanded}>
                <Td></Td>
                <Td colSpan={2}>Ports</Td>
                <Td colSpan={2}>
                    <ExpandableRowContent>
                        <Flex direction={{default: "row"}} cellPadding={"0px"}>
                            {ports.map(port => <FlexItem>{port}</FlexItem>)}
                        </Flex>
                    </ExpandableRowContent>
                </Td>
            </Tr>}
        </Tbody>
    )
}