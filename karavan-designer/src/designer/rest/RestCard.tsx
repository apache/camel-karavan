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
    Button, Tooltip
} from '@patternfly/react-core';
import '../karavan.css';
import {CamelElement, Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {RestDefinition} from "karavan-core/lib/model/CamelDefinition";
import {RestMethodCard} from "./RestMethodCard";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-circle-icon";
import {CamelUi} from "../utils/CamelUi";
import AddIcon from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";

interface Props {
    rest: RestDefinition
    selected?: boolean
    integration: Integration
    selectElement: (element: CamelElement) => void
}

interface State {
    rest: RestDefinition
}

export class RestCard extends React.Component<Props, State> {

    public state: State = {
        rest: this.props.rest,
    };

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        // if (prevState.key !== this.state.key) {
        //     this.props.onSave?.call(this, this.state.integration);
        // }
    }

    selectElement = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        this.props.selectElement.call(this, this.state.rest);
    }

    render() {
        const rest = this.state.rest;
        return (
            <div key={rest.uuid} className={this.props.selected ? "rest-card rest-card-selected" : "rest-card rest-card-unselected"} onClick={e => this.selectElement(e)}>
                <div className="header">
                    <div className="title">REST</div>
                    <div className="title">{rest.path}</div>
                    <div className="description">{rest.description}</div>
                    <Tooltip position={"bottom"} content={<div>Add REST method</div>}>
                        <Button variant={"link"} icon={<AddIcon/>} aria-label="Add" onClick={e => {}} className="add-button">Add method</Button>
                    </Tooltip>
                    <Button variant="link" className="delete-button" onClick={e => {}}><DeleteIcon/></Button>
                </div>
                <div id={rest.uuid + "-content"} className="rest-content">
                    {rest.get?.map(get => <RestMethodCard method={get} integration={this.props.integration} selectElement={this.props.selectElement}/>)}
                    {rest.post?.map(post => <RestMethodCard method={post} integration={this.props.integration} selectElement={this.props.selectElement}/>)}
                    {rest.patch?.map(patch => <RestMethodCard method={patch} integration={this.props.integration} selectElement={this.props.selectElement}/>)}
                    {rest.delete?.map(del => <RestMethodCard method={del} integration={this.props.integration} selectElement={this.props.selectElement}/>)}
                    {rest.head?.map(head => <RestMethodCard method={head} integration={this.props.integration} selectElement={this.props.selectElement}/>)}
                </div>
            </div>
        );
    }
}
