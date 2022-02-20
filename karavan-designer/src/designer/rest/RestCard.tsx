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
import {RestMethodCard} from "./RestMethodCard";

interface Props {
    rest: RestDefinition
    selected?: boolean
    integration: Integration
}

interface State {
    rest: RestDefinition
    expanded: boolean
}

export class RestCard extends React.Component<Props, State> {

    public state: State = {
        rest: this.props.rest,
        expanded: false
    };

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        // if (prevState.key !== this.state.key) {
        //     this.props.onSave?.call(this, this.state.integration);
        // }
    }

    render() {
        const rest = this.state.rest;
        return (
            <div className={this.props.selected ? "rest-rest-card rest-rest-card-selected" : "rest-rest-card rest-rest-card-unselected"}>
            <Accordion asDefinitionList>
                <AccordionItem >
                    <AccordionToggle
                        onClick={event => this.setState({expanded: !this.state.expanded})}
                        isExpanded={this.state.expanded}
                        id={rest.uuid + "-toggle"}
                        className="rest-toggle">
                        <div key={rest.uuid} className={this.props.selected ? "rest-card rest-card-selected" : "rest-card rest-card-unselected"}>
                            <div className="title">REST</div>
                            <div className="title">{rest.path}</div>
                            <div className="description">{rest.description}</div>
                            {/*<Button variant="link" className="delete-button" onClick={e => {}}><DeleteIcon/></Button>*/}
                        </div>
                    </AccordionToggle>
                    <AccordionContent id={rest.uuid + "-content"} isHidden={!this.state.expanded} className="rest-content">
                        {rest.get?.map(get => <RestMethodCard method={get} integration={this.props.integration}/>)}
                        {rest.post?.map(post => <RestMethodCard method={post} integration={this.props.integration}/>)}
                        {rest.patch?.map(patch => <RestMethodCard method={patch} integration={this.props.integration}/>)}
                        {rest.delete?.map(del => <RestMethodCard method={del} integration={this.props.integration}/>)}
                        {rest.head?.map(head => <RestMethodCard method={head} integration={this.props.integration}/>)}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            </div>
        );
    }
}
