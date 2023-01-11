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
import {NamedBeanDefinition} from "karavan-core/lib/model/CamelDefinition";
import {Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelUi} from "../utils/CamelUi";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {BeanProperties} from "./BeanProperties";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {BeanCard} from "./BeanCard";

interface Props {
    onSave?: (integration: Integration, propertyOnly: boolean) => void
    integration: Integration
    dark: boolean
}

interface State {
    integration: Integration
    showDeleteConfirmation: boolean
    selectedBean?: NamedBeanDefinition
    key: string
    propertyOnly: boolean
}

export class BeansDesigner extends React.Component<Props, State> {

    public state: State = {
        integration: this.props.integration,
        showDeleteConfirmation: false,
        key: "",
        propertyOnly: false
    };

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevState.key !== this.state.key) {
            this.props.onSave?.call(this, this.state.integration, this.state.propertyOnly);
        }
    }

    showDeleteConfirmation = (bean: NamedBeanDefinition) => {
        this.setState({selectedBean: bean, showDeleteConfirmation: true});
    }

    onIntegrationUpdate = (i: Integration) => {
        this.setState({integration: i, propertyOnly: false, showDeleteConfirmation: false, key: Math.random().toString()});
    }

    deleteBean = () => {
        const i = CamelDefinitionApiExt.deleteBeanFromIntegration(this.state.integration, this.state.selectedBean);
        this.setState({
            integration: i,
            showDeleteConfirmation: false,
            key: Math.random().toString(),
            selectedBean: new NamedBeanDefinition(),
            propertyOnly: false
        });
    }

    changeBean = (bean: NamedBeanDefinition) => {
        const clone = CamelUtil.cloneIntegration(this.state.integration);
        const i = CamelDefinitionApiExt.addBeanToIntegration(clone, bean);
        this.setState({integration: i, propertyOnly: false, key: Math.random().toString(), selectedBean: bean});
    }

    getDeleteConfirmation() {
        return (<Modal
            className="modal-delete"
            title="Confirmation"
            isOpen={this.state.showDeleteConfirmation}
            onClose={() => this.setState({showDeleteConfirmation: false})}
            actions={[
                <Button key="confirm" variant="primary" onClick={e => this.deleteBean()}>Delete</Button>,
                <Button key="cancel" variant="link"
                        onClick={e => this.setState({showDeleteConfirmation: false})}>Cancel</Button>
            ]}
            onEscapePress={e => this.setState({showDeleteConfirmation: false})}>
            <div>
                Delete bean from integration?
            </div>
        </Modal>)
    }

    selectBean = (bean?: NamedBeanDefinition) => {
        this.setState({selectedBean: bean})
    }

    unselectBean = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if ((evt.target as any).dataset.click === 'BEANS') {
            evt.stopPropagation()
            this.setState({selectedBean: undefined})
        }
    };

    createBean = () => {
        this.changeBean(new NamedBeanDefinition());
    }

    getPropertiesPanel() {
        return (
            <DrawerPanelContent isResizable hasNoBorder defaultSize={'400px'} maxSize={'800px'} minSize={'300px'}>
                <BeanProperties integration={this.props.integration}
                                bean={this.state.selectedBean}
                                dark={this.props.dark}
                                onChange={this.changeBean}
                                onClone={this.changeBean}/>
            </DrawerPanelContent>
        )
    }

    render() {
        const beans = CamelUi.getBeans(this.state.integration);
        return (
            <PageSection className="rest-page" isFilled padding={{default: 'noPadding'}}>
                <div className="rest-page-columns">
                    <Drawer isExpanded isInline>
                        <DrawerContent panelContent={this.getPropertiesPanel()}>
                            <DrawerContentBody>
                                <div className="graph" data-click="REST"  onClick={event => this.unselectBean(event)}>
                                    <div className="flows">
                                        {beans?.map(bean => <BeanCard key={bean.uuid + this.state.key}
                                                                      selectedStep={this.state.selectedBean}
                                                                      bean={bean}
                                                                      integration={this.props.integration}
                                                                      selectElement={this.selectBean}
                                                                      deleteElement={this.showDeleteConfirmation}/>)}
                                        <div className="add-rest">
                                            <Button
                                                variant={beans?.length === 0 ? "primary" : "secondary"}
                                                data-click="ADD_REST"
                                                icon={<PlusIcon/>}
                                                onClick={e => this.createBean()}>Create bean
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
