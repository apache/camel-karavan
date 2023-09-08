import React from 'react';
import {
    Badge,
    Button,
    Card,
    CardBody,
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    Flex,
    FlexItem,
    Label,
    LabelGroup,
    Tooltip,
    TooltipPosition
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import UpIcon from "@patternfly/react-icons/dist/esm/icons/running-icon";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import {useLogStore, useProjectStore, useStatusesStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {ContainerStatus} from "../../api/ProjectModels";
import {ContainerButtons} from "./ContainerButtons";

interface Props {
    env: string,
}

export function ContainerPanel (props: Props) {

    const [project] = useProjectStore((s) => [s.project], shallow);
    const [setShowLog] = useLogStore((s) => [s.setShowLog], shallow);
    const [containers, deployments, camels, pipelineStatuses] =
        useStatusesStore((s) => [s.containers, s.deployments, s.camels, s.pipelineStatuses], shallow);

    function getButtons() {
        const env = props.env;
        const conts = containers.filter(d => d.projectId === project?.projectId && d.type === 'project');
        return (
            <Flex justifyContent={{default: "justifyContentSpaceBetween"}}
                  alignItems={{default: "alignItemsFlexStart"}}>
                <FlexItem>
                    {conts.length === 0 && <Label icon={<DownIcon/>} color={"grey"}>No pods</Label>}
                    <LabelGroup numLabels={2} isVertical>
                        {conts.map((pod: ContainerStatus) => {
                                const ready = pod.state === 'running';
                                return (
                                    <Tooltip key={pod.containerName} content={pod.state} position={TooltipPosition.left}>
                                        <Label icon={ready ? <UpIcon/> : <DownIcon/>} color={ready ? "green" : "grey"}>
                                            <Button variant="link" className="labeled-button"
                                                    onClick={e => {
                                                        setShowLog(true, 'container', pod.containerName);
                                                    }}>
                                                {pod.containerName}
                                            </Button>
                                        </Label>
                                    </Tooltip>
                                )
                            }
                        )}
                    </LabelGroup>
                </FlexItem>
                <FlexItem>{env === "dev" && <ContainerButtons env={env}/>}</FlexItem>
            </Flex>
        )
    }

    const env = props.env;
    return (
        <Card className="project-status">
            <CardBody>
                <DescriptionList isHorizontal horizontalTermWidthModifier={{default: '20ch'}}>
                    <DescriptionListGroup>
                        <DescriptionListTerm>Environment</DescriptionListTerm>
                        <DescriptionListDescription>
                            <Badge className="badge">{env}</Badge>
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                        <DescriptionListTerm>Containers</DescriptionListTerm>
                        <DescriptionListDescription>
                            {getButtons()}
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                </DescriptionList>
            </CardBody>
        </Card>
    )
}
