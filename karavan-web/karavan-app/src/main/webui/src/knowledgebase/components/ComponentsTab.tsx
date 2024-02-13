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
import {ComponentCard} from "./ComponentCard";
import {ComponentModal} from "./ComponentModal";
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";
import {shallow} from "zustand/shallow";
import {useKnowledgebaseStore} from "../KnowledgebaseStore";

interface Props {
    dark: boolean,
    filter: string,
    onChange: (name: string, checked: boolean) => void,
}

export function ComponentsTab(props: Props) {

    const [isModalOpen] = useKnowledgebaseStore((s) =>
        [s.isModalOpen], shallow)


    const {filter} = props;
    const components = ComponentApi.getComponents().filter(c => {
        return c.component.name.toLowerCase().includes(filter.toLowerCase())
            || c.component.title.toLowerCase().includes(filter.toLowerCase())
            || c.component.description.toLowerCase().includes(filter.toLowerCase())
    }).sort((a, b) => (a.component.title?.toLowerCase() > b.component.title?.toLowerCase() ? 1 : -1)) ;
    return (
        <PageSection variant={props.dark ? PageSectionVariants.darker : PageSectionVariants.light} padding={{ default: 'noPadding' }} className="kamelet-section">
            {isModalOpen && <ComponentModal/>}
            <PageSection isFilled className="kamelets-page" variant={props.dark ? PageSectionVariants.darker : PageSectionVariants.light}>
                <Gallery hasGutter>
                    {components.map(c => (
                        <ComponentCard key={c.component.name} component={c} onChange={props.onChange}  />
                    ))}
                </Gallery>
            </PageSection>
        </PageSection>
    )
}