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
    Button
} from '@patternfly/react-core';
import '../karavan.css';
import {RegistryBeanDefinition} from "karavan-core/lib/model/CamelDefinition";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-circle-icon";
import {useDesignerStore} from "../KaravanStore";
import {shallow} from "zustand/shallow";

interface Props {
    bean: RegistryBeanDefinition
    selectElement: (element: RegistryBeanDefinition) => void
    deleteElement: (element: RegistryBeanDefinition) => void
}

export function BeanCard (props: Props) {

    const [ selectedStep] = useDesignerStore((s) => [s.selectedStep], shallow)

    function selectElement (evt: React.MouseEvent) {
        evt.stopPropagation();
        props.selectElement(props.bean);
    }

    function onDelete (evt: React.MouseEvent) {
        evt.stopPropagation();
        props.deleteElement(props.bean);
    }

    const bean = props.bean;
    return (
        <div className={selectedStep?.uuid === bean.uuid ? "rest-card rest-card-selected" : "rest-card rest-card-unselected"} onClick={e => selectElement(e)}>
            <div className="header">
                <div className="title">Bean</div>
                <div className="title">{bean.name}</div>
                <div className="description">{bean.type}</div>
                <Button variant="link" className="delete-button" onClick={e => onDelete(e)}>
                    <DeleteIcon/>
                </Button>
            </div>
        </div>
    )
}
