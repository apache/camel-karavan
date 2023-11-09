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

import React, {useEffect} from "react";
import {KaravanApi} from "../api/KaravanApi";
import {
    Bullseye,
    Flex,
    FlexItem,
    Page,
    ProgressStep,
    ProgressStepper,
    Spinner,
    Text, TextContent, TextVariants,
    Tooltip,
    TooltipPosition
} from "@patternfly/react-core";
import Icon from "./Logo";
import {useAppConfigStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";

export function MainLoader() {

    const [readiness, setReadiness] = useAppConfigStore((s) => [s.readiness, s.setReadiness], shallow)

    useEffect(() => {
        const interval = setInterval(() => {
            KaravanApi.getReadiness((r: any) => {
                setReadiness(r);
            })
        }, 1300)
        return () => {
            clearInterval(interval);
        };
    }, []);

    function showSpinner() {
        return KaravanApi.authType === undefined || readiness === undefined;
    }

    function showStepper() {
        return readiness !== undefined && readiness.status !== true;
    }

    function getStepper() {
        const steps: any[] = Array.isArray(readiness?.checks) ? readiness.checks : [];
        return (
            <Bullseye className="">
                <Flex direction={{default:"column"}} justifyContent={{default: "justifyContentCenter"}}>
                    <FlexItem style={{textAlign: "center"}}>
                        {Icon()}
                        <TextContent>
                            <Text component={TextVariants.h2}>
                                Waiting for services
                            </Text>
                        </TextContent>
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
                    <div className="logo-placeholder">{Icon()}</div>
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
