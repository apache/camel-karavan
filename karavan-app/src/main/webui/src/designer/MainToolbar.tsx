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

import React from 'react';
import {
    PageSectionVariants, Flex, PageSection, FlexItem
} from '@patternfly/react-core';
import '../designer/karavan.css';

interface Props {
    title: React.ReactNode;
    toolsStart?: React.ReactNode;
    tools: React.ReactNode;
}

export function MainToolbar(props: Props) {

    return (
        <PageSection className="tools-section" variant={PageSectionVariants.light}>
            <Flex className="tools" justifyContent={{default: 'justifyContentFlexStart'}}
                  alignItems={{default: 'alignItemsCenter'}}>
                <FlexItem flex={{default: "flexNone"}}>
                    {props.title}
                </FlexItem>
                <FlexItem align={{default: 'alignLeft'}}>
                    {props.toolsStart}
                </FlexItem>
                <FlexItem align={{default: 'alignRight'}}>
                    {props.tools}
                </FlexItem>
            </Flex>
        </PageSection>
    )
}
