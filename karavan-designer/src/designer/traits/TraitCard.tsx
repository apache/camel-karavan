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
import {CamelElement, Integration} from "karavan-core/lib/model/IntegrationDefinition";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-circle-icon";

interface Props {
    trait: CamelElement
    selectedTrait?: CamelElement
    integration: Integration
    // selectMethod: (element: CamelElement) => void
    // selectElement: (element: CamelElement) => void
    // deleteElement: (element: CamelElement) => void
}

export class TraitCard extends React.Component<Props, any> {

    selectElement = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        // this.props.selectElement.call(this, this.props.rest);
    }

    selectMethod = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        // this.props.selectMethod.call(this, this.props.rest);
    }

    delete = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        // this.props.deleteElement.call(this, this.props.rest);
    }

    render() {
        const trait = this.props.trait;
        return (
            <div className={this.props.selectedTrait?.uuid === trait.uuid ? "rest-card rest-card-selected" : "rest-card rest-card-unselected"} onClick={e => this.selectElement(e)}>
                <div className="header">
                    <div className="title">Trait</div>
                    <div className="title">{trait.dslName.replace("Trait", "")}</div>
                    {/*<div className="description">{trait.description}</div>*/}
                    {/*<Tooltip position={"bottom"} content={<div>Add REST method</div>}>*/}
                    {/*    <Button variant={"link"} icon={<AddIcon/>} aria-label="Add" onClick={e => this.selectMethod(e)} className="add-button">Add method</Button>*/}
                    {/*</Tooltip>*/}
                    <Button variant="link" className="delete-button" onClick={e => this.delete(e)}><DeleteIcon/></Button>
                </div>
                <div className="rest-content" key={Math.random().toString()}>
                    {/*{trait.get?.map(get => <RestMethodCard key={get.uuid} method={get} selectedStep={this.props.selectedStep} integration={this.props.integration} selectElement={this.props.selectElement} deleteElement={this.props.deleteElement}/>)}*/}
                    {/*{trait.post?.map(post => <RestMethodCard key={post.uuid} method={post} selectedStep={this.props.selectedStep} integration={this.props.integration} selectElement={this.props.selectElement} deleteElement={this.props.deleteElement}/>)}*/}
                    {/*{trait.put?.map(put => <RestMethodCard key={put.uuid} method={put} selectedStep={this.props.selectedStep} integration={this.props.integration} selectElement={this.props.selectElement} deleteElement={this.props.deleteElement}/>)}*/}
                    {/*{trait.patch?.map(patch => <RestMethodCard key={patch.uuid} method={patch} selectedStep={this.props.selectedStep} integration={this.props.integration} selectElement={this.props.selectElement} deleteElement={this.props.deleteElement}/>)}*/}
                    {/*{trait.delete?.map(del => <RestMethodCard key={del.uuid} method={del} selectedStep={this.props.selectedStep} integration={this.props.integration} selectElement={this.props.selectElement} deleteElement={this.props.deleteElement}/>)}*/}
                    {/*{trait.head?.map(head => <RestMethodCard key={head.uuid} method={head} selectedStep={this.props.selectedStep} integration={this.props.integration} selectElement={this.props.selectElement} deleteElement={this.props.deleteElement}/>)}*/}
                </div>
            </div>
        );
    }
}
