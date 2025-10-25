import React, {ReactElement} from 'react';
import {Bullseye, Card, CardBody, Divider, EmptyState, EmptyStateVariant, Flex, FlexItem} from '@patternfly/react-core';
import {InfoTabContainer} from "./InfoTabContainer";
import {InfoTabContext} from "./InfoTabContext";
import {InfoTabMemory} from "./InfoTabMemory";
import {shallow} from "zustand/shallow";
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";
import {useStatusesStore} from "@/api/ProjectStore";

interface Props {
    currentPodName: string
    header?: React.ReactNode
}

export function InformationTab(props: Props): ReactElement {

    const [containers] = useStatusesStore((state) => [state.containers], shallow);
    const camelContainers = containers.filter(cs => cs.containerName === props.currentPodName);

    return (
        <div style={{display: "flex", flexDirection: "column", position: "relative", height: "100%"}}>
            {props.header}
            {camelContainers.map((containerStatus, index) =>
                <Card key={containerStatus.containerId}  isFullHeight style={{borderRadius: 0}}>
                    <CardBody>
                        <Flex direction={{default: "row"}}
                              justifyContent={{default: "justifyContentSpaceBetween"}}>
                            <FlexItem flex={{default: "flex_1"}}>
                                <InfoTabContainer containerStatus={containerStatus}/>
                            </FlexItem>
                            <Divider orientation={{default: "vertical"}}/>
                            <FlexItem flex={{default: "flex_1"}}>
                                <InfoTabMemory containerStatus={containerStatus}/>
                            </FlexItem>
                            <Divider orientation={{default: "vertical"}}/>
                            <FlexItem flex={{default: "flex_1"}}>
                                <InfoTabContext containerStatus={containerStatus}/>
                            </FlexItem>
                        </Flex>
                    </CardBody>
                </Card>
            )}
            {camelContainers.length === 0 &&
                <Card>
                    <CardBody>
                        <Bullseye>
                            <EmptyState  headingLevel="h2" icon={SearchIcon}  titleText="No running containers" variant={EmptyStateVariant.sm}>
                                </EmptyState>
                        </Bullseye>
                    </CardBody>
                </Card>
            }
        </div>
    )
}
