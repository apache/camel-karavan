import React from "react";
import './App.css';
import {useReadinessStore} from "@stores/ReadinessStore";
import {useDataPolling} from "@shared/polling/useDataPolling";
import {Bullseye, Content, ContentVariants, Flex, FlexItem, ProgressStep, ProgressStepper, Spinner, Tooltip, TooltipPosition} from "@patternfly/react-core";
import {mainHook} from "@app/MainHook";
import {KaravanIcon} from "@features/integration/designer/icons/KaravanIcons";

const FAST_INTERVAL = 1000; // 1 second (when not ready)
const SLOW_INTERVAL = 10000; // 10 seconds (when ready)

export function ReadinessPanel() {

    // 1. Subscribe to the state and action
    const { readiness, fetchReadiness } = useReadinessStore();

    // 2. Determine the dynamic interval based on the current state
    const isReady = readiness && readiness.status === true;

    const currentInterval = isReady ? SLOW_INTERVAL : FAST_INTERVAL;

    console.log(`Polling interval set to: ${currentInterval}ms`);

    // 3. Pass the dynamic interval to the hook
    useDataPolling('readiness', fetchReadiness, currentInterval);
    const {showSpinner, showStepper} = mainHook();

    function getStepper() {
        const steps: any[] = Array.isArray(readiness?.checks) ? readiness.checks : [];
        return (
            <Bullseye className="loading-page">
                <Flex direction={{default: "column"}} justifyContent={{default: "justifyContentCenter"}}>
                    <FlexItem style={{textAlign: "center"}}>
                        {KaravanIcon()}
                        <Content>
                            <Content component={ContentVariants.h2}>
                                Waiting for services
                            </Content>
                        </Content>
                    </FlexItem>
                    <FlexItem>
                        <ProgressStepper aria-label="Readiness progress" isCenterAligned isVertical>
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
