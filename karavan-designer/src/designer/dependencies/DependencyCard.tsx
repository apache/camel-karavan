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
import {Dependency, Integration} from "karavan-core/lib/model/IntegrationDefinition";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-circle-icon";

interface Props {
    dep: Dependency
    selectedDep?: Dependency
    integration: Integration
    selectElement: (element: Dependency) => void
    deleteElement: (element: Dependency) => void
}

export class DependencyCard extends React.Component<Props, any> {

    selectElement = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        this.props.selectElement.call(this, this.props.dep);
    }

    delete = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        this.props.deleteElement.call(this, this.props.dep);
    }

    render() {
        const dep = this.props.dep;
        return (
            <div className={this.props.selectedDep?.uuid === dep.uuid ? "rest-card rest-card-selected" : "rest-card rest-card-unselected"} onClick={e => this.selectElement(e)}>
                <div className="header">
                    <div className="title">DEPENDENCY</div>
                    <div className="title">{dep.getFullName()}</div>
                    {/*<Tooltip position={"bottom"} content={<div>Add REST method</div>}>*/}
                        {/*<Button variant={"link"} icon={<AddIcon/>} aria-label="Add" onClick={e => this.selectMethod(e)} className="add-button">Add method</Button>*/}
                    {/*</Tooltip>*/}
                    <Button variant="link" className="delete-button" onClick={e => this.delete(e)}><DeleteIcon/></Button>
                </div>
                <div className="rest-content" key={Math.random().toString()}>

                </div>
            </div>
        );
    }
}
