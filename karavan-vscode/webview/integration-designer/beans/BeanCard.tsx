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
    Button, Flex, FlexItem
} from '@patternfly/react-core';
import './bean.css';
import {BeanFactoryDefinition} from "core/model/CamelDefinition";
import {DeleteElementIcon} from "../utils/ElementIcons";
import {CamelElement} from "core/model/IntegrationDefinition";

interface Props {
    bean: BeanFactoryDefinition
    selectedStep?: CamelElement
    selectElement: (element: BeanFactoryDefinition) => void
    deleteElement: (element: BeanFactoryDefinition) => void
}

export function BeanCard (props: Props) {

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
        <Flex direction={{default: "row"}}
              className={props.selectedStep?.uuid === bean.uuid ? "bean-card bean-card-selected" : "bean-card bean-card-unselected"}
              onClick={e => selectElement(e)}
        >
            <FlexItem flex={{default:"flex_1"}} className="title">Bean</FlexItem>
            <FlexItem flex={{default:"flex_2"}} className="title">{bean.name}</FlexItem>
            <FlexItem flex={{default:"flex_3"}} align={{default: "alignRight"}} className="description">{bean.type}</FlexItem>
            <FlexItem>
                <Button variant="link" className="delete-button" onClick={e => onDelete(e)}>
                    {DeleteElementIcon()}
                </Button>
            </FlexItem>
        </Flex>
    )
}
