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
import {Button} from '@patternfly/react-core';
import './rest.css';
import '../karavan.css';
import {CamelElement} from "core/model/IntegrationDefinition";
import {RestConfigurationDefinition} from "core/model/CamelDefinition";
import {DeleteElementIcon} from "../utils/ElementIcons";

interface Props {
    restConfig: RestConfigurationDefinition
    selectedRestConfig?: CamelElement
    selectElement: (element: CamelElement) => void
    deleteElement: (element: CamelElement) => void
}

export function RestConfigurationCard (props: Props) {

    function selectElement(evt: React.MouseEvent) {
        evt.stopPropagation();
        props.selectElement(props.restConfig);
    }

    function onDelete(evt: React.MouseEvent) {
        evt.stopPropagation();
        props.deleteElement(props.restConfig);
    }

    const restConfig = props.restConfig;
    const desc = restConfig.host && restConfig.port
        ? restConfig.host + ":" + restConfig.port
        : (restConfig.host ? restConfig.host : "") + (restConfig.port ? restConfig.port : "");
    return (
        <div className={props.selectedRestConfig?.uuid === restConfig.uuid ? "rest-config-card rest-config-card-selected" : "rest-config-card rest-config-card-unselected"} 
             onClick={e => selectElement(e)}>
            <div className="title">Configuration</div>
            <div className="title">{restConfig.contextPath}</div>
            <div className="description">{desc}</div>
            <Button variant="link" className="delete-button"
                    onClick={e => onDelete(e)}>
                {DeleteElementIcon()}
            </Button>
        </div>
    )
}
