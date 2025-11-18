import React from "react";
import {Bullseye, Content, ContentVariants, Flex, FlexItem, ProgressStep, ProgressStepper, Spinner, Tooltip, TooltipPosition} from "@patternfly/react-core";
import {useAppConfigStore} from "@/api/ProjectStore";
import {shallow} from "zustand/shallow";
import {KaravanIcon} from "@/integration-designer/icons/KaravanIcons";

export function LoaderPage() {

    const [readiness] = useAppConfigStore((s) => [s.readiness], shallow)

    function showSpinner() {
        return readiness === undefined;
    }

    function showStepper() {
        return readiness !== undefined && readiness.status !== true;
    }

    function getStepper() {
        const steps: any[] = Array.isArray(readiness?.checks) ? readiness.checks : [];
        return (
            <Bullseye className="loading-page">
                <Flex direction={{default:"column"}} justifyContent={{default: "justifyContentCenter"}}>
                    <FlexItem style={{textAlign: "center"}}>
                        {KaravanIcon()}
                        <Content>
                            <Content component={ContentVariants.h2}>
                                Waiting for services
                            </Content>
                        </Content>
                    </FlexItem>
                    <FlexItem>
                        <ProgressStepper aria-label="Readiness progress" isCenterAligned isVertical >
                            {steps.map(step => (
                                <ProgressStep
                                    key={step.name}
                                    variant={step.status === 'UP' ? "success" : "info"}
                                    isCurrent={step.status !== 'UP'}
                                    icon={step.status !== 'UP' ? <Spinner isInline aria-label="Loading..."/> : undefined}
                                    id={step.name}
                                    titleId={step.name}
                                    aria-label={step.name}
                                >
                                    {step.name}
                                </ProgressStep>
                            ))}
                        </ProgressStepper>
                    </FlexItem>
                </Flex>
            </Bullseye>
        )
    }

    function getSpinner() {
        return (
            <Bullseye className="loading-page">
                <Spinner className="spinner" diameter="140px" aria-label="Loading..."/>
                <Tooltip content="Connecting to server..." position={TooltipPosition.bottom}>
                    <div className="logo-placeholder">{KaravanIcon()}</div>
                </Tooltip>
            </Bullseye>
        )
    }

    return (
        <>
            {showSpinner() && getSpinner()}
            {showStepper() && getStepper()}
        </>
    )
}
