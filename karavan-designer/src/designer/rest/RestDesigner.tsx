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
    Button, Modal,
    PageSection
} from '@patternfly/react-core';
import '../karavan.css';
import {Integration, CamelElement} from "karavan-core/lib/model/IntegrationDefinition";
import {DslProperties} from "../route/DslProperties";
import {RouteToCreate} from "../utils/CamelUi";
import {RestCard} from "./RestCard";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {RestConfigurationDefinition, RestContextRefDefinition, RestDefinition} from "karavan-core/lib/model/CamelDefinition";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {RestMethodSelector} from "./RestMethodSelector";
import {DslMetaModel} from "../utils/DslMetaModel";
import {CamelDefinitionApi} from "karavan-core/lib/api/CamelDefinitionApi";
import {RestConfigurationCard} from "./RestConfigurationCard";

interface Props {
    onSave?: (integration: Integration) => void
    integration: Integration
    borderColor: string
    borderColorSelected: string
    dark: boolean
}

interface State {
    integration: Integration
    selectedStep?: CamelElement
    key: string
    showSelector: boolean
    showDeleteConfirmation: boolean
}

export class RestDesigner extends React.Component<Props, State> {

    public state: State = {
        integration: this.props.integration,
        key: "",
        showSelector: false,
        showDeleteConfirmation: false
    };

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevState.key !== this.state.key) {
            this.props.onSave?.call(this, this.state.integration);
        }
    }

    onIntegrationUpdate = (i: Integration) => {
        this.setState({integration: i, showSelector: false, key: Math.random().toString()});
    }

    selectElement = (element: CamelElement) => {
        this.setState({selectedStep: element})
    }

    onPropertyUpdate = (element: CamelElement, updatedUuid: string, newRoute?: RouteToCreate) => {
        if (newRoute) {
            let i = CamelDefinitionApiExt.updateIntegrationRestElement(this.state.integration, element);
            const f = CamelDefinitionApi.createFromDefinition({uri: newRoute.componentName + ":" + newRoute.name})
            const r = CamelDefinitionApi.createRouteDefinition({from: f, id: newRoute.name})
            i = CamelDefinitionApiExt.addStepToIntegration(i, r, '');
            const clone = CamelUtil.cloneIntegration(i);
            this.setState({
                integration: clone,
                key: Math.random().toString(),
                showSelector: false,
                selectedStep: element,
            });
        } else {
            const clone = CamelUtil.cloneIntegration(this.state.integration);
            const i = CamelDefinitionApiExt.updateIntegrationRestElement(clone, element);
            this.setState({integration: i, key: Math.random().toString()});
        }
    }

    unselectElement = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if ((evt.target as any).dataset.click === 'REST') {
            evt.stopPropagation()
            this.setState({selectedStep: undefined,})
        }
    };

    addRest = (rest: RestDefinition) => {
        const clone = CamelUtil.cloneIntegration(this.state.integration);
        const i = CamelDefinitionApiExt.addRestToIntegration(clone, rest);
        this.setState({integration: i, key: Math.random().toString(), selectedStep: rest});
    }

    createRest = () => {
        this.addRest(new RestDefinition());
    }

    createRestConfiguration = () => {
        this.addRest(new RestConfigurationDefinition());
    }

    showDeleteConfirmation = (element: CamelElement) => {
        this.setState({selectedStep: element, showSelector: false, showDeleteConfirmation: true});
    }

    deleteElement = () => {
        const step = this.state.selectedStep;
        if (step) {
            let i;
            if (step.dslName === 'RestDefinition') i = CamelDefinitionApiExt.deleteRestFromIntegration(this.state.integration, step.uuid);
            else if (step.dslName === 'RestConfigurationDefinition') i = CamelDefinitionApiExt.deleteRestConfigurationFromIntegration(this.state.integration);
            else i = CamelDefinitionApiExt.deleteRestMethodFromIntegration(this.state.integration, step.uuid);
            this.setState({
                integration: i,
                showSelector: false,
                showDeleteConfirmation: false,
                key: Math.random().toString(),
                selectedStep: undefined,
            });
        }
    }

    getDeleteConfirmation() {
        return (<Modal
            className="modal-delete"
            title="Confirmation"
            isOpen={this.state.showDeleteConfirmation}
            onClose={() => this.setState({showDeleteConfirmation: false})}
            actions={[
                <Button key="confirm" variant="primary" onClick={e => this.deleteElement()}>Delete</Button>,
                <Button key="cancel" variant="link"
                        onClick={e => this.setState({showDeleteConfirmation: false})}>Cancel</Button>
            ]}
            onEscapePress={e => this.setState({showDeleteConfirmation: false})}>
            <div>
                Delete element from integration?
            </div>
        </Modal>)
    }

    closeMethodSelector = () => {
        this.setState({showSelector: false})
    }

    onMethodSelect = (method: DslMetaModel) => {
        if (this.state.selectedStep) {
            const clone = CamelUtil.cloneIntegration(this.state.integration);
            const m = CamelDefinitionApi.createStep(method.dsl, {});
            const i = CamelDefinitionApiExt.addRestMethodToIntegration(clone, m, this.state.selectedStep?.uuid);
            this.setState({integration: i, key: Math.random().toString(), selectedStep: m, showSelector: false});
        }
    }

    selectMethod = (element: CamelElement) => {
        this.setState({selectedStep: element, showSelector: true})
    }

    getSelectorModal() {
        return (
            <Modal
                title="Select method"
                width={'90%'}
                className='dsl-modal'
                isOpen={this.state.showSelector}
                onClose={() => this.closeMethodSelector()}
                actions={{}}>
                <RestMethodSelector
                    dark={this.props.dark}
                    onMethodSelect={this.onMethodSelect}/>
            </Modal>)
    }

    getRestConfigurationCard(config: RestContextRefDefinition) {
        return (<>
            <RestConfigurationCard key={Math.random().toString()}
                                   selectedRestConfig={this.state.selectedStep}
                                   restConfig={config}
                                   integration={this.props.integration}
                                   selectElement={this.selectElement}
                                   deleteElement={this.showDeleteConfirmation}/>
        </>)
    }

    getRestCards(data: RestDefinition[]) {
        return (<>
            {data?.map(rest => <RestCard key={rest.uuid + this.state.key}
                                         selectedStep={this.state.selectedStep}
                                         rest={rest}
                                         integration={this.props.integration}
                                         selectMethod={this.selectMethod}
                                         selectElement={this.selectElement}
                                         deleteElement={this.showDeleteConfirmation}/>)}
        </>)
    }

    render() {
        const data = this.props.integration.spec.flows?.filter(f => f.dslName === 'RestDefinition');
        const configData = this.props.integration.spec.flows?.filter(f => f.dslName === 'RestConfigurationDefinition');
        const config = configData && Array.isArray(configData) ? configData[0] : undefined;
        return (
            <PageSection className="rest-page" isFilled padding={{default: 'noPadding'}}>
                <div className="rest-page-columns">
                    <div className="graph" data-click="REST" onClick={event => this.unselectElement(event)}>
                        <div className="flows">
                            {config && this.getRestConfigurationCard(config)}
                            {data && this.getRestCards(data)}
                            <div className="add-rest">
                                {config === undefined &&
                                    <Button
                                        variant="primary"
                                        data-click="ADD_REST_REST_CONFIG"
                                        icon={<PlusIcon/>}
                                        onClick={e => this.createRestConfiguration()}>Create REST Configuration
                                    </Button>
                                }
                                <Button
                                    variant={data?.length === 0 ? "primary" : "secondary"}
                                    data-click="ADD_REST"
                                    icon={<PlusIcon/>}
                                    onClick={e => this.createRest()}>Create REST Service
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DslProperties
                        integration={this.props.integration}
                        step={this.state.selectedStep}
                        onIntegrationUpdate={this.onIntegrationUpdate}
                        onPropertyUpdate={this.onPropertyUpdate}
                        clipboardStep={undefined}
                        onSaveClipboardStep={element => {}}
                    />
                </div>
                {this.getSelectorModal()}
                {this.getDeleteConfirmation()}
            </PageSection>
        );
    }
}
