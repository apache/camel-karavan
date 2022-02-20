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
    Button, Card, CardFooter, CardHeader, CardTitle, Gallery, Modal, PageSection
} from '@patternfly/react-core';
import '../karavan.css';
import {CamelUi} from "../utils/CamelUi";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-circle-icon";
import {DependencyIcon} from "../utils/KaravanIcons";
import {DependencyProperties} from "./DependencyProperties";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {Integration, Dependency} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";

interface Props {
    onSave?: (integration: Integration) => void
    integration: Integration
    borderColor: string
    borderColorSelected: string
    dark: boolean
}

interface State {
    integration: Integration
    showDeleteConfirmation: boolean
    selectedDep?: Dependency
    key: string
    showDepEditor: boolean
}

export class DependenciesDesigner extends React.Component<Props, State> {

    public state: State = {
        integration: this.props.integration,
        showDeleteConfirmation: false,
        key: "",
        showDepEditor: false,
    };

    componentDidMount() {
        window.addEventListener('resize', this.handleResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    }

    handleResize = () => {
        this.setState({key: Math.random().toString()});
    }

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevState.key !== this.state.key) {
            this.props.onSave?.call(this, this.state.integration);
        }
    }

    showDeleteConfirmation = (e: React.MouseEvent, dependency: Dependency) => {
        e.stopPropagation();
        this.setState({selectedDep: dependency, showDeleteConfirmation: true});
    }

    onIntegrationUpdate = (i: Integration) => {
        this.setState({integration: i, showDeleteConfirmation: false, key: Math.random().toString()});
    }

    deleteDep = () => {
        const i = CamelDefinitionApiExt.deleteDependencyFromIntegration(this.state.integration, this.state.selectedDep);
        this.setState({
            integration: i,
            showDeleteConfirmation: false,
            key: Math.random().toString(),
            selectedDep: undefined
        });
    }

    changeDep = (dep: Dependency) => {
        const clone = CamelUtil.cloneIntegration(this.state.integration);
        const i = CamelDefinitionApiExt.addDependencyToIntegration(clone, dep);
        this.setState({integration: i, key: Math.random().toString(), selectedDep: dep});
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

    getCard(dep: Dependency, index: number) {
        return (
            <Card key={dep.uuid + index} isHoverable isCompact
                  className={this.state.selectedDep?.uuid === dep.uuid ? "bean-card bean-card-selected" : "bean-card bean-card-unselected"}
                  onClick={e => this.selectDep(dep)}>
                <Button variant="link" className="delete-button" onClick={e => this.showDeleteConfirmation(e, dep)}><DeleteIcon/></Button>
                <CardHeader>
                    <div className="header-icon"><DependencyIcon/></div>
                </CardHeader>
                <CardTitle>{dep.getFullName()}</CardTitle>
                {/*<CardBody>{dep}</CardBody>*/}
                <CardFooter className="">
                </CardFooter>
            </Card>
        )
    }

    render() {
        const deps = CamelUi.getDependencies(this.state.integration).sort((a, b) => a.getFullName() > b.getFullName() ? 1 : -1 );
        return (
            <PageSection className="beans-page" isFilled padding={{default: 'noPadding'}}>
                <div className="beans-page-columns" data-click="BEANS" onClick={event => this.unselectDep(event)}>
                    <div className="beans-panel">
                        <Gallery hasGutter className="beans-gallery" data-click="BEANS" onClick={event => this.unselectDep(event)}>
                            {deps.map((dep: Dependency, index: number) => this.getCard(dep, index))}
                        </Gallery>
                        <div className="add-button-div" data-click="BEANS" onClick={event => this.unselectDep(event)}>
                            <Button icon={<PlusIcon/>} variant={deps.length === 0 ? "primary" : "secondary"} onClick={e => this.createDep()} className="add-bean-button">
                                Create new dependency
                            </Button>
                        </div>
                    </div>
                    <DependencyProperties integration={this.props.integration}
                                          dependency={this.state.selectedDep}
                                          dark={this.props.dark}
                                          onChange={this.changeDep}/>
                </div>
                {this.getDeleteConfirmation()}
            </PageSection>
        );
    }
}
