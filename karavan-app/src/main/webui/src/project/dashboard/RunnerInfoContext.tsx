import React from 'react';
import {
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    Label, LabelGroup,
    Tooltip
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";


interface Props {
    context: any,
    showConsole: boolean
}

export const RunnerInfoContext = (props: Props) => {



    function getContextInfo() {
        return (
            <LabelGroup numLabels={3}>
                <Tooltip content="Name" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {props.context?.context?.name}
                    </Label>
                </Tooltip>
            </LabelGroup>
        )
    }

    function getVersionInfo() {
        return (
            <LabelGroup numLabels={3}>
                <Tooltip content="Version" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {props.context?.context?.version}
                    </Label>
                </Tooltip>
            </LabelGroup>
        )
    }

    function getContextState() {
        return (
            <LabelGroup numLabels={3}>
                <Tooltip content="State" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {props.context?.context?.state}
                    </Label>
                </Tooltip>
                <Tooltip content="Phase" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {props.context?.context?.phase}
                    </Label>
                </Tooltip>
                <Tooltip content="Uptime" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {props.context?.context?.uptime}
                    </Label>
                </Tooltip>
            </LabelGroup>
        )
    }

    function getExchanges() {
        return (
            <LabelGroup numLabels={3}>
                <Tooltip content="Total" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {props.context?.context?.statistics?.exchangesTotal}
                    </Label>
                </Tooltip>
                <Tooltip content="Failed" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {props.context?.context?.statistics?.exchangesFailed}
                    </Label>
                </Tooltip>
                <Tooltip content="Inflight" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {props.context?.context?.statistics?.exchangesInflight}
                    </Label>
                </Tooltip>
            </LabelGroup>
        )
    }

    function getProcessingTime() {
        return (
            <LabelGroup numLabels={4}>
                <Tooltip content="Min" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {props.context?.context?.statistics?.minProcessingTime}
                    </Label>
                </Tooltip>
                <Tooltip content="Mean" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {props.context?.context?.statistics?.meanProcessingTime}
                    </Label>
                </Tooltip>
                <Tooltip content="Max" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {props.context?.context?.statistics?.maxProcessingTime}
                    </Label>
                </Tooltip>
                <Tooltip content="Last" position={"bottom"}>
                    <Label icon={getIcon()} color={getColor()}>
                        {props.context?.context?.statistics?.lastProcessingTime}
                    </Label>
                </Tooltip>
            </LabelGroup>
        )
    }

    function getIcon() {
        return (getRunning() ? <UpIcon/> : <DownIcon/>)
    }

    function getColor() {
        return getRunning() ? "green" : "grey";
    }

    function getRunning(): boolean {
        return props.context ? isRunning(props.context) : false;
    }


    function isRunning(c: any): boolean {
        return c?.context?.state === 'Started';
    }

    return (
        <DescriptionList isHorizontal>
                <DescriptionListGroup>
                    <DescriptionListTerm>Camel</DescriptionListTerm>
                    <DescriptionListDescription>
                        {getContextInfo()}
                    </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                    <DescriptionListTerm>Version</DescriptionListTerm>
                    <DescriptionListDescription>
                        {getVersionInfo()}
                    </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                    <DescriptionListTerm>State</DescriptionListTerm>
                    <DescriptionListDescription>
                        {getContextState()}
                    </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                    <DescriptionListTerm>Exchanges:</DescriptionListTerm>
                    <DescriptionListDescription>
                        {getExchanges()}
                    </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                    <DescriptionListTerm>Processing Time</DescriptionListTerm>
                    <DescriptionListDescription>
                        {getProcessingTime()}
                    </DescriptionListDescription>
                </DescriptionListGroup>
        </DescriptionList>
    );
}
