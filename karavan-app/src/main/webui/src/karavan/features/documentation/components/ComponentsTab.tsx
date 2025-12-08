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
import {Gallery} from '@patternfly/react-core';
import {ComponentCard} from "./ComponentCard";
import {ComponentModal} from "./ComponentModal";
import {shallow} from "zustand/shallow";
import {useDocumentationStore} from "../../../stores/DocumentationStore";
import {Component} from '@karavan-core/model/ComponentModels';

interface Props {
    components: Component[],
}

export function ComponentsTab(props: Props) {

    const [isModalOpen] = useDocumentationStore((s) => [s.isModalOpen], shallow)

    const {components} = props;
    return (
        <div className="documentation-eip-section">
            {isModalOpen && <ComponentModal/>}
            <div className="kamelets-page">
                <Gallery hasGutter>
                    {components.map(c => (
                        <ComponentCard key={c.component.name} component={c}/>
                    ))}
                </Gallery>
            </div>
        </div>
    )
}