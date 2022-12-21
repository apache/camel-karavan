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
import {RouteConfigurationDefinition} from "karavan-core/lib/model/CamelDefinition";
import {CamelElement, Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelUi} from "../utils/CamelUi";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {RouteConfigurationCard} from "./RouteConfigurationCard";
import {DslProperties} from "../route/DslProperties";

interface Props {
    onSave?: (integration: Integration, propertyOnly: boolean) => void
    integration: Integration
    dark: boolean
}

interface State {
    integration: Integration
    showDeleteConfirmation: boolean
    routeConfigurations: RouteConfigurationDefinition[]
    selectedRouteConfiguration?: RouteConfigurationDefinition
    key: string
    propertyOnly: boolean
}

export class RouteConfigurationDesigner extends React.Component<Props, State> {

    public state: State = {
        integration: this.props.integration,
        routeConfigurations: [],
        showDeleteConfirmation: false,
        key: "",
        propertyOnly: false
    }

    componentDidMount() {
        this.setState({key: Math.random().toString()})
    }

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevState.key !== this.state.key) {
            this.props.onSave?.call(this, this.state.integration, this.state.propertyOnly);
        }
    }

    showDeleteConfirmation = (routeConfiguration: RouteConfigurationDefinition) => {
        this.setState({selectedRouteConfiguration: routeConfiguration, showDeleteConfirmation: true});
    }

    onIntegrationUpdate = (i: Integration) => {
        this.setState({integration: i, propertyOnly: false, showDeleteConfirmation: false, key: Math.random().toString()});
    }

    deleteRouteConfiguration = () => {
        const {selectedRouteConfiguration} = this.state;
        if (selectedRouteConfiguration) {
            const i = CamelDefinitionApiExt.deleteRouteConfigurationFromIntegration(this.state.integration, selectedRouteConfiguration);
            this.setState({
                integration: i,
                showDeleteConfirmation: false,
                key: Math.random().toString(),
                selectedRouteConfiguration: undefined,
                propertyOnly: false
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
                <Button key="confirm" variant="primary" onClick={e => this.deleteRouteConfiguration()}>Delete</Button>,
                <Button key="cancel" variant="link"
                        onClick={e => this.setState({showDeleteConfirmation: false})}>Cancel</Button>
            ]}
            onEscapePress={e => this.setState({showDeleteConfirmation: false})}>
            <div>
                Delete Route Configuration from integration?
            </div>
        </Modal>)
    }

    createRouteConfiguration = () => {
        const clone = CamelUtil.cloneIntegration(this.state.integration);
        const routeConfiguration = new RouteConfigurationDefinition();
        const i = CamelDefinitionApiExt.addRouteConfigurationToIntegration(clone, routeConfiguration);
        this.setState({integration: i, propertyOnly: false, key: Math.random().toString(), selectedRouteConfiguration: routeConfiguration});
    }

    selectRouteConfiguration = (element: RouteConfigurationDefinition) => {
        this.setState({selectedRouteConfiguration: element})
    }

    onPropertyUpdate = (element: CamelElement) => {
        const clone = CamelUtil.cloneIntegration(this.state.integration);
        const i = CamelDefinitionApiExt.updateRouteConfigurationToIntegration(clone, element);
        this.setState({integration: i, propertyOnly: true, key: Math.random().toString()});
    }

    getPropertiesPanel() {
        return (
            <DrawerPanelContent isResizable hasNoBorder defaultSize={'400px'} maxSize={'800px'} minSize={'300px'}>
                <DslProperties
                    integration={this.props.integration}
                    step={this.state.selectedRouteConfiguration}
                    onIntegrationUpdate={this.onIntegrationUpdate}
                    onPropertyUpdate={this.onPropertyUpdate}
                    clipboardStep={undefined}
                    isRouteDesigner={false}
                    onClone={element => {}}
                    dark={this.props.dark}/>
            </DrawerPanelContent>
        )
    }

    render() {
        const routeConfigurations = CamelUi.getRouteConfigurations(this.state.integration);
        return (
            <PageSection className="rest-page" isFilled padding={{default: 'noPadding'}}>
                <div className="rest-page-columns">
                    <Drawer isExpanded isInline>
                        <DrawerContent panelContent={this.getPropertiesPanel()}>
                            <DrawerContentBody>
                                <div className="graph" data-click="REST">
                                    <div className="flows">
                                        {routeConfigurations?.map(routeConfiguration =>
                                            <RouteConfigurationCard key={routeConfiguration.uuid + this.state.key}
                                                                    routeConfiguration={routeConfiguration}
                                                                    selectedStep={this.state.selectedRouteConfiguration}
                                                                    selectElement={this.selectRouteConfiguration}
                                                                    deleteElement={this.showDeleteConfirmation}/>
                                        )}
                                        <div className="add-rest">
                                            <Button
                                                variant="primary"
                                                data-click="ADD_REST"
                                                icon={<PlusIcon/>}
                                                onClick={e => this.createRouteConfiguration()}>Create new configuration
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
