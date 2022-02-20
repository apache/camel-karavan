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
    Button, EmptyState, EmptyStateBody, EmptyStateIcon, TreeView,
    PageSection, Title, TreeViewDataItem, Card, CardHeader, CardTitle, CardBody, CardFooter, FormGroup, Form, TextInput, Accordion, AccordionItem, AccordionToggle, AccordionContent
} from '@patternfly/react-core';
import '../karavan.css';
import {Integration, CamelElement} from "karavan-core/lib/model/IntegrationDefinition";
import {DslProperties} from "../route/DslProperties";
import {RouteToCreate} from "../utils/CamelUi";
import {PostVerbDefinition, RestDefinition} from "../../../../karavan-core/lib/model/CamelDefinition";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-circle-icon";
import {BeanIcon, RestIcon} from "../utils/KaravanIcons";
import {RestProperties} from "./RestProperties";

interface Props<T> {
    method: T
    selected?: boolean
    integration: Integration
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

    componentDidUpdate = (prevProps: Readonly<Props<any>>, prevState: Readonly<State<any>>, snapshot?: any) => {
        // if (prevState.key !== this.state.key) {
        //     this.props.onSave?.call(this, this.state.integration);
        // }
    }

    render() {
        const method = this.state.method;
        return (
            <div className={this.props.selected ? "rest-method-card rest-method-card-selected" : "rest-method-card rest-method-card-unselected"}>
                <AccordionItem>
                    <AccordionToggle
                        onClick={event => this.setState({expanded: !this.state.expanded})}
                        isExpanded={this.state.expanded}
                        id={method.uuid + "-toggle"}
                        className="method-toggle">
                        <div key={method.uuid} className={this.props.selected ? "method-card method-card-selected" : "method-card method-card-unselected"}>
                            <div className="method">{method.dslName.replace('VerbDefinition', '').toUpperCase()}</div>
                            <div className="title">{method.uri}</div>
                            <div className="description">{method.description}</div>
                        </div>
                    </AccordionToggle>
                    <AccordionContent id={method.uuid + "-content"} isHidden={!this.state.expanded} className="method-content">
                        <div>hello</div>
                        <div>hello</div>
                        <div>hello</div>
                        <div>hello</div>
                        <div>hello</div>
                        <div>hello</div>
                        <div>hello</div>
                        {/*<RestProperties*/}
                        {/*    integration={this.props.integration}*/}
                        {/*    step={method}*/}
                        {/*    onIntegrationUpdate={{}}*/}
                        {/*    onPropertyUpdate={element => {}}*/}
                        {/*/>*/}
                    </AccordionContent>
                </AccordionItem>
            </div>
        );
    }
}
