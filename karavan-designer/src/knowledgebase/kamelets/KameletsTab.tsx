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
    PageSection,
    PageSectionVariants
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {KameletCard} from "./KameletCard";
import {KameletModal} from "./KameletModal";
import {useKnowledgebaseStore} from "../KnowledgebaseStore";
import {shallow} from "zustand/shallow";
import {KameletModel} from "karavan-core/lib/model/KameletModels";

interface Props {
    dark: boolean,
    kameletList: KameletModel[],
    onChange: (name: string, checked: boolean) => void
}

export function KameletsTab(props: Props) {

    const [isModalOpen] = useKnowledgebaseStore((s) => [s.isModalOpen], shallow)

    const {kameletList, dark} = props;

    return (
        <PageSection variant={dark ? PageSectionVariants.darker : PageSectionVariants.light}
                     padding={{default: 'noPadding'}} className="kamelet-section">
            {isModalOpen && <KameletModal/>}
            <PageSection isFilled className="kamelets-page"
                         variant={dark ? PageSectionVariants.darker : PageSectionVariants.light}>
                <Gallery hasGutter>
                    {kameletList.map(k => (
                        <KameletCard key={k.metadata.name} kamelet={k} onChange={props.onChange} />
                    ))}
                </Gallery>
            </PageSection>
        </PageSection>
    )
}