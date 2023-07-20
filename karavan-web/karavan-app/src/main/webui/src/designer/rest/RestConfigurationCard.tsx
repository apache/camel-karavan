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
import '../karavan.css';
import {CamelElement, Integration} from "karavan-core/lib/model/IntegrationDefinition";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-circle-icon";
import {RestConfigurationDefinition} from "karavan-core/lib/model/CamelDefinition";

interface Props {
    restConfig: RestConfigurationDefinition
    selectedRestConfig?: CamelElement
    integration: Integration
    selectElement: (element: CamelElement) => void
    deleteElement: (element: CamelElement) => void
}

interface State {
    restConfig: RestConfigurationDefinition
    expanded: boolean
}

export class RestConfigurationCard extends React.Component<Props, State> {

    public state: State = {
        restConfig: this.props.restConfig,
        expanded: false
    };

    selectElement = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        this.props.selectElement.call(this, this.state.restConfig);
    }

    delete = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        this.props.deleteElement.call(this, this.props.restConfig);
    }

    render() {
        const restConfig = this.state.restConfig;
        const desc = restConfig.host && restConfig.port
            ? restConfig.host + ":" + restConfig.port
            : (restConfig.host ? restConfig.host : "") + (restConfig.port ? restConfig.port : "");
        return (
            <div className={this.props.selectedRestConfig?.uuid === restConfig.uuid ? "rest-config-card rest-config-card-selected" : "rest-config-card rest-config-card-unselected"} onClick={e => this.selectElement(e)}>
                <div className="title">Configuration</div>
                <div className="title">{restConfig.contextPath}</div>
                <div className="description">{desc}</div>
                <Button variant="link" className="delete-button" onClick={e => this.delete(e)}><DeleteIcon/></Button>
            </div>
        );
    }
}
