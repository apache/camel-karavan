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
    PageSection, PageSectionVariants,ToggleGroup,ToggleGroupItem
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {EipCard} from "./EipCard";
import {EipModal} from "./EipModal";
import {CamelModelMetadata, ElementMeta} from "karavan-core/lib/model/CamelMetadata";
import {useKnowledgebaseStore} from "../KnowledgebaseStore";
import {shallow} from "zustand/shallow";
import { useSelectorStore } from '../../designer/DesignerStore';

interface Props {
    dark: boolean,
    filter: string,
}

export function EipTab(props: Props) {

    const [isModalOpen] = useKnowledgebaseStore((s) =>
        [s.isModalOpen], shallow)

        const [ selectedLabels, addSelectedLabel, deleteSelectedLabel] =
        useSelectorStore((s) =>
            [s.selectedLabels, s.addSelectedLabel, s.deleteSelectedLabel], shallow)
        const { filter } = props;
        const elements = CamelModelMetadata;
        const filteredElements=CamelModelMetadata
        .filter(c => c.name.toLowerCase().includes(filter.toLowerCase())).filter((dsl: ElementMeta) => {
            if (selectedLabels.length === 0) {
                return true;
            } else {
                return dsl.labels.split(",").some(r => selectedLabels.includes(r));
            }
        })
        .sort((a: ElementMeta, b: ElementMeta) => a.name > b.name ? 1 : -1);
     const eipLabels = [...new Set(elements.map(e => e.labels).join(",").split(",").filter(e => e !== 'eip'))];
    function selectLabel(eipLabel: string) {
            if (!selectedLabels.includes(eipLabel)) {
                addSelectedLabel(eipLabel);
            } else {
                deleteSelectedLabel(eipLabel);
            }
        }
    return (
        <PageSection variant={props.dark ? PageSectionVariants.darker : PageSectionVariants.light}
            padding={{ default: 'noPadding' }} className="kamelet-section knowledbase-eip-section">
             <ToggleGroup aria-label="Labels" isCompact >
                    {eipLabels.map(eipLabel => <ToggleGroupItem
                        key={eipLabel}
                        text={eipLabel}
                        buttonId={eipLabel}
                        isSelected={selectedLabels.includes(eipLabel)}
                        onChange={selected => selectLabel(eipLabel)}
                    />)}
                </ToggleGroup>

            {isModalOpen && <EipModal/>}
            <PageSection isFilled className="kamelets-page"
                         variant={props.dark ? PageSectionVariants.darker : PageSectionVariants.light}>
                <Gallery hasGutter>
                    {filteredElements.map(c => (
                        <EipCard key={c.name} element={c}/>
                    ))}
                </Gallery>
            </PageSection>
        </PageSection>
    )
}