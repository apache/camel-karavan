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

interface Props<T> {
    method: T
    selectedStep?: CamelElement
    integration: Integration
    selectElement: (element: CamelElement) => void
    deleteElement: (element: CamelElement) => void
}

interface State<T> {
    method: T
    expanded: boolean
}

export class RestMethodCard extends React.Component<Props<any>, State<any>> {

    public state: State<any> = {
        method: this.props.method,
        expanded: false
    };

    selectElement = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        this.props.selectElement.call(this, this.state.method);
    }

    delete = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        this.props.deleteElement.call(this, this.props.method);
    }

    render() {
        const method = this.state.method;
        return (
            <div className={this.props.selectedStep?.uuid === method.uuid ? "method-card method-card-selected" : "method-card method-card-unselected"} onClick={e => this.selectElement(e)}>
                <div className="method">{method.dslName.replace('Definition', '').toUpperCase()}</div>
                <div className="rest-method-desc">
                    <div className="title">{method.path}</div>
                    <div className="description">{method.description}</div>
                </div>
                <Button variant="link" className="delete-button" onClick={e => this.delete(e)}><DeleteIcon/></Button>
            </div>
        );
    }
}
