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
    Button, Drawer, DrawerContent, DrawerContentBody, DrawerPanelContent, Modal, PageSection
} from '@patternfly/react-core';
import '../karavan.css';
import {CamelUi} from "../utils/CamelUi";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {DependencyProperties} from "./DependencyProperties";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {Integration, Dependency} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {DependencyCard} from "./DependencyCard";

interface Props {
    onSave?: (integration: Integration, propertyOnly: boolean) => void
    integration: Integration
    dark: boolean
}

interface State {
    integration: Integration
    showDeleteConfirmation: boolean
    selectedDep?: Dependency
    key: string
    showDepEditor: boolean
    propertyOnly: boolean
}

export class DependenciesDesigner extends React.Component<Props, State> {

    public state: State = {
        integration: this.props.integration,
        showDeleteConfirmation: false,
        key: "",
        showDepEditor: false,
        propertyOnly: false
    };

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevState.key !== this.state.key) {
            this.props.onSave?.call(this, this.state.integration, this.state.propertyOnly);
        }
    }

    showDeleteConfirmation = (dependency: Dependency) => {
        this.setState({selectedDep: dependency, showDeleteConfirmation: true});
    }

    onIntegrationUpdate = (i: Integration) => {
        this.setState({integration: i, propertyOnly: false, showDeleteConfirmation: false, key: Math.random().toString()});
    }

    deleteDep = () => {
        const i = CamelDefinitionApiExt.deleteDependencyFromIntegration(this.state.integration, this.state.selectedDep);
        this.setState({
            integration: i,
            showDeleteConfirmation: false,
            key: Math.random().toString(),
            selectedDep: undefined,
            propertyOnly: false
        });
    }

    changeDep = (dep: Dependency) => {
        const clone = CamelUtil.cloneIntegration(this.state.integration);
        const i = CamelDefinitionApiExt.addDependencyToIntegration(clone, dep);
        this.setState({integration: i, propertyOnly: false, key: Math.random().toString(), selectedDep: dep});
    }

    getDeleteConfirmation() {
        return (<Modal
            className="modal-delete"
            title="Confirmation"
            isOpen={this.state.showDeleteConfirmation}
            onClose={() => this.setState({showDeleteConfirmation: false})}
            actions={[
                <Button key="confirm" variant="primary" onClick={e => this.deleteDep()}>Delete</Button>,
                <Button key="cancel" variant="link"
                        onClick={e => this.setState({showDeleteConfirmation: false})}>Cancel</Button>
            ]}
            onEscapePress={e => this.setState({showDeleteConfirmation: false})}>
            <div>
                Delete dependency from integration?
            </div>
        </Modal>)
    }

    openDepEditor = () => {
        this.setState({showDepEditor: true})
    }

    selectDep = (dep?: Dependency) => {
        this.setState({selectedDep: dep})
    }

    unselectDep = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if ((evt.target as any).dataset.click === 'BEANS') {
            evt.stopPropagation()
            this.setState({selectedDep: undefined})
        }
    };

    createDep = () => {
        this.changeDep(new Dependency());
    }

    getPropertiesPanel() {
        return (
            <DrawerPanelContent isResizable hasNoBorder defaultSize={'400px'} maxSize={'800px'} minSize={'300px'}>
                <DependencyProperties integration={this.props.integration}
                                      dependency={this.state.selectedDep}
                                      dark={this.props.dark}
                                      onChange={this.changeDep}
                                      onClone={this.changeDep}/>
            </DrawerPanelContent>
        )
    }

    render() {
        const deps = CamelUi.getDependencies(this.state.integration).sort((a, b) => a.getFullName() > b.getFullName() ? 1 : -1 );
        return (
            <PageSection className="rest-page" isFilled padding={{default: 'noPadding'}}>
                <div className="rest-page-columns">
                    <Drawer isExpanded isInline>
                        <DrawerContent panelContent={this.getPropertiesPanel()}>
                            <DrawerContentBody>
                                <div className="graph" data-click="REST"  onClick={event => this.unselectDep(event)}>
                                    <div className="flows">
                                        {deps?.map(dep => <DependencyCard key={dep.uuid + this.state.key}
                                                                          selectedDep={this.state.selectedDep}
                                                                          dep={dep}
                                                                          integration={this.props.integration}
                                                                          selectElement={this.selectDep}
                                                                          deleteElement={this.showDeleteConfirmation}/>)
                                        }
                                        <div className="add-rest">
                                            <Button
                                                variant={deps?.length === 0 ? "primary" : "secondary"}
                                                data-click="ADD_DEPENDENCY"
                                                icon={<PlusIcon/>}
                                                onClick={e => this.createDep()}>Create new dependency
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </DrawerContentBody>
                        </DrawerContent>
                    </Drawer>
                </div>
                {this.getDeleteConfirmation()}
            </PageSection>
        )
    }
}
