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
    Button, Drawer, DrawerContent, DrawerContentBody, DrawerPanelContent, EmptyState, EmptyStateBody, EmptyStateIcon, Modal, PageSection, Title
} from '@patternfly/react-core';
import '../karavan.css';
import {NamedBeanDefinition} from "karavan-core/lib/model/CamelDefinition";
import {Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelUi} from "../utils/CamelUi";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {TraitProperties} from "./TraitProperties";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {TraitCard} from "./TraitCard";
import CubesIcon from "@patternfly/react-icons/dist/esm/icons/cubes-icon";
import {CamelElement} from "karavan-core/src/core/model/IntegrationDefinition";
import {DslProperties} from "../route/DslProperties";

interface Props {
    onSave?: (integration: Integration, propertyOnly: boolean) => void
    integration: Integration
    dark: boolean
}

interface State {
    integration: Integration
    showDeleteConfirmation: boolean
    selectedTrait?: CamelElement
    key: string
    showBeanEditor: boolean
    propertyOnly: boolean
}

export class TraitsDesigner extends React.Component<Props, State> {

    public state: State = {
        integration: this.props.integration,
        showDeleteConfirmation: false,
        key: "",
        showBeanEditor: false,
        propertyOnly: false
    };

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevState.key !== this.state.key) {
            this.props.onSave?.call(this, this.state.integration, this.state.propertyOnly);
        }
    }

    showDeleteConfirmation = (trait: CamelElement) => {
        this.setState({selectedTrait: trait, showDeleteConfirmation: true});
    }

    onIntegrationUpdate = (i: Integration) => {
        this.setState({integration: i, showDeleteConfirmation: false, key: Math.random().toString()});
    }

    deleteBean = () => {
        // const i = CamelDefinitionApiExt.deleteTraitFromIntegration(this.state.integration, this.state.selectedTrait);
        // this.setState({
        //     integration: i,
        //     showDeleteConfirmation: false,
        //     key: Math.random().toString(),
        //     selectedBean: new NamedBeanDefinition()
        // });
    }

    changeTrait = (trait: CamelElement) => {
        // const clone = CamelUtil.cloneIntegration(this.state.integration);
        // const i = CamelDefinitionApiExt.addBeanToIntegration(clone, bean);
        // this.setState({integration: i, key: Math.random().toString(), selectedBean: bean});
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
        // this.setState({selectedBean: bean})
    }

    unselectBean = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if ((evt.target as any).dataset.click === 'BEANS') {
            evt.stopPropagation()
            // this.setState({selectedBean: undefined})
        }
    };

    createBean = () => {
        this.changeTrait(new NamedBeanDefinition());
    }

    getPropertiesPanel() {
        return (
            <DrawerPanelContent isResizable hasNoBorder defaultSize={'400px'} maxSize={'800px'} minSize={'300px'}>
                <TraitProperties integration={this.props.integration}
                                 trait={this.state.selectedTrait}
                                 dark={this.props.dark}
                                 onChange={this.changeTrait}/>
            </DrawerPanelContent>
        )
    }

    render() {
        const traits = CamelUi.getBeans(this.state.integration);
        return (
            <PageSection className="exception-page" isFilled padding={{default: 'noPadding'}}>
                <div className="exception-page-columns">
            {/*<PageSection className="rest-page" isFilled padding={{default: 'noPadding'}}>*/}
            {/*    <div className="rest-page-columns">*/}
                    <EmptyState>
                        <EmptyStateIcon icon={CubesIcon} />
                        <Title headingLevel="h4" size="lg">
                            Traits
                        </Title>
                        <EmptyStateBody>
                            Traits not implemented yet
                        </EmptyStateBody>
                    </EmptyState>
                    {/*<Drawer isExpanded isInline>*/}
                    {/*    <DrawerContent panelContent={this.getPropertiesPanel()}>*/}
                    {/*        <DrawerContentBody>*/}
                    {/*            <div className="graph" data-click="REST"  onClick={event => this.unselectBean(event)}>*/}
                    {/*                <div className="flows">*/}
                    {/*                    {traits?.map(trait => <TraitCard key={trait.uuid + this.state.key}*/}
                    {/*                                                     selectedTrait={this.state.selectedTrait}*/}
                    {/*                                                     integration={this.props.integration}*/}
                    {/*                                                     trait={trait}*/}
                    {/*                        // selectElement={this.selectBean}*/}
                    {/*                        // deleteElement={this.showDeleteConfirmation}*/}
                    {/*                    />)}*/}
                    {/*                    <div className="add-rest">*/}
                    {/*                        <Button*/}
                    {/*                            variant={traits?.length === 0 ? "primary" : "secondary"}*/}
                    {/*                            data-click="ADD_TRAIT"*/}
                    {/*                            icon={<PlusIcon/>}*/}
                    {/*                            onClick={e => this.createBean()}>Create new trait*/}
                    {/*                        </Button>*/}
                    {/*                    </div>*/}
                    {/*                </div>*/}
                    {/*            </div>*/}
                    {/*        </DrawerContentBody>*/}
                    {/*    </DrawerContent>*/}
                    {/*</Drawer>*/}
                </div>
                {this.getDeleteConfirmation()}
            </PageSection>
        );
    }
}
