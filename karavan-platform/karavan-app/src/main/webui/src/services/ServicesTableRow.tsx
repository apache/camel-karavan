import React, {useState} from 'react';
import {
    Button,
    Tooltip,
    Flex, FlexItem, Label
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {ExpandableRowContent, Tbody, Td, Tr} from "@patternfly/react-table";
import StopIcon from "@patternfly/react-icons/dist/js/icons/stop-icon";
import PlayIcon from "@patternfly/react-icons/dist/esm/icons/play-icon";
import {Service} from "../api/ServiceModels";

interface Props {
    index: number
    service: Service
}

export const ServicesTableRow = (props: Props) => {

    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [running, setRunning] = useState<boolean>(false);

    const service = props.service;
    const healthcheck = service.healthcheck;
    const env = service.environment;
    const keys = Object.keys(env);
    const icon = running ? <StopIcon/> : <PlayIcon/>;
    const tooltip = running ? "Stop container" : "Start container";
    return (
        <Tbody isExpanded={isExpanded}>
            <Tr key={service.name}>
                <Td expand={
                    service.name
                        ? {
                            rowIndex: props.index,
                            isExpanded: isExpanded,
                            onToggle: () => setIsExpanded(!isExpanded),
                            expandId: 'composable-expandable-example'
                        }
                        : undefined}
                    modifier={"fitContent"}>
                </Td>
                <Td>
                    <Label color={"grey"}>{service.name}</Label>
                </Td>
                <Td>{service.container_name}</Td>
                <Td>{service.image}</Td>
                <Td>
                    <Flex direction={{default: "row"}}>
                        {service.ports.map(port => <FlexItem>{port}</FlexItem>)}
                    </Flex>
                </Td>
                {/*<Td>{service.environment}</Td>*/}
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
            {keys.length > 0 && <Tr isExpanded={isExpanded}>
                <Td></Td>
                <Td colSpan={2}>Environment Variables</Td>
                <Td colSpan={2}>
                    <ExpandableRowContent>
                        <Flex direction={{default: "column"}} cellPadding={"0px"}>
                        {keys.map(key => <FlexItem>{key + ": " + env[key]}</FlexItem>)}
                        </Flex>
                    </ExpandableRowContent>
                </Td>
            </Tr>}
            {healthcheck && <Tr isExpanded={isExpanded}>
                <Td></Td>
                <Td colSpan={2}>Healthcheck</Td>
                <Td colSpan={2}>
                    <ExpandableRowContent>
                        <Flex direction={{default: "column"}} cellPadding={"0px"}>
                            <FlexItem>{"test: " + healthcheck.test.join(" ")}</FlexItem>
                            <FlexItem>{"interval " + healthcheck.interval}</FlexItem>
                            <FlexItem>{"timeout: " + healthcheck.timeout}</FlexItem>
                            <FlexItem>{"retries: " + healthcheck.retries}</FlexItem>
                        </Flex>
                    </ExpandableRowContent>
                </Td>
            </Tr>}
        </Tbody>
    )
}