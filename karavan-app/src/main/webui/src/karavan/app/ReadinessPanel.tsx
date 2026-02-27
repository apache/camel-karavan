/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from "react";
import './App.css';
import {useReadinessStore} from "@stores/ReadinessStore";
import {useDataPolling} from "@shared/polling/useDataPolling";
import {Bullseye, Content, ContentVariants, Flex, FlexItem, ProgressStep, ProgressStepper, Spinner, Tooltip, TooltipPosition} from "@patternfly/react-core";
import {mainHook} from "@app/MainHook";
import {KaravanIcon} from "@features/project/designer/icons/KaravanIcons";
import {PlatformLogoBase64} from "@app/navigation/PlatformLogo";

const FAST_INTERVAL = 1000; // 1 second (when not ready)
const SLOW_INTERVAL = 10000; // 10 seconds (when ready)

export function ReadinessPanel() {

    const { readiness, fetchReadiness } = useReadinessStore();
    const isReady = readiness && readiness.status === true;
    const currentInterval = isReady ? SLOW_INTERVAL : FAST_INTERVAL;
    useDataPolling('readiness', fetchReadiness, currentInterval);
    const {showSpinner, showStepper} = mainHook();

    function getStepper() {
        const steps: any[] = Array.isArray(readiness?.checks) ? readiness.checks : [];
        return (
            <Bullseye className="loading-page">
                <Flex direction={{default: "column"}} justifyContent={{default: "justifyContentCenter"}}>
                    <FlexItem style={{textAlign: "center"}}>
                        <img src={PlatformLogoBase64()} className="logo" alt='logo'/>
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
