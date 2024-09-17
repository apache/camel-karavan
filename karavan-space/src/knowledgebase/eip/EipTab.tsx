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
    Gallery,
    PageSection, PageSectionVariants
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {EipCard} from "./EipCard";
import {EipModal} from "./EipModal";
import {useKnowledgebaseStore} from "../KnowledgebaseStore";
import {shallow} from "zustand/shallow";
import {ElementMeta} from "karavan-core/lib/model/CamelMetadata";

interface Props {
    dark: boolean,
    elements: ElementMeta[],
}

export function EipTab(props: Props) {

    const [isModalOpen] = useKnowledgebaseStore((s) => [s.isModalOpen], shallow)

    const { elements } = props;

    return (
        <PageSection variant={props.dark ? PageSectionVariants.darker : PageSectionVariants.light}
            padding={{ default: 'noPadding' }} className="kamelet-section knowledbase-eip-section">

            {isModalOpen && <EipModal/>}
            <PageSection isFilled className="kamelets-page"
                         variant={props.dark ? PageSectionVariants.darker : PageSectionVariants.light}>
                <Gallery hasGutter>
                    {elements.map(c => (
                        <EipCard key={c.name} element={c}/>
                    ))}
                </Gallery>
            </PageSection>
        </PageSection>
    )
}