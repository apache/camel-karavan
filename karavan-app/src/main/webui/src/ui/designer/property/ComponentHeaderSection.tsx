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
import React, {useRef} from 'react';
import {Badge, ClipboardCopy, Content, ContentVariants, Flex, FlexItem, FormGroupLabelHelp, Popover,} from '@patternfly/react-core';
import {ComponentHeader} from "@core/model/ComponentModels";

interface Props {
    index: number;
    header: ComponentHeader;
}

export function ComponentHeaderSection(props: Props) {

    const {index, header} = props;
    const labelHelpRef = useRef(null);

    return (
        <Flex key={index}>
            <ClipboardCopy key={index} hoverTip="Copy" clickTip="Copied" variant="inline-compact"
                           isCode>
                {header.name}
            </ClipboardCopy>
            <FlexItem align={{default: 'alignRight'}}>
                <Popover
                    triggerRef={labelHelpRef}
                    position={"left"}
                    headerContent={header.name}
                    bodyContent={header.description}
                    footerContent={
                        <Flex>
                            <Content component={ContentVariants.p}>{header.javaType}</Content>
                            <FlexItem align={{default: 'alignRight'}}>
                                <Badge isRead>{header.group}</Badge>
                            </FlexItem>
                        </Flex>
                    }
                >
                    <FormGroupLabelHelp ref={labelHelpRef} aria-label="More info"/>
                </Popover>
            </FlexItem>
        </Flex>
    )
}
