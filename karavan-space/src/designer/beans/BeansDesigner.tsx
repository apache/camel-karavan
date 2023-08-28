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
import {RegistryBeanDefinition} from "karavan-core/lib/model/CamelDefinition";
import {CamelUi} from "../utils/CamelUi";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {BeanProperties} from "./BeanProperties";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {BeanCard} from "./BeanCard";
import {useDesignerStore, useIntegrationStore} from "../KaravanStore";
import {shallow} from "zustand/shallow";

export function BeansDesigner () {

    const [integration, setIntegration] = useIntegrationStore((s) => [s.integration, s.setIntegration], shallow)
    const [dark, selectedStep, showDeleteConfirmation, setShowDeleteConfirmation, setSelectedStep] = useDesignerStore((s) =>
        [s.dark, s.selectedStep, s.showDeleteConfirmation, s.setShowDeleteConfirmation, s.setSelectedStep], shallow)


    function onShowDeleteConfirmation (bean: RegistryBeanDefinition) {
        setSelectedStep(bean);
        setShowDeleteConfirmation(true);
    }

    function deleteBean () {
        const i = CamelDefinitionApiExt.deleteBeanFromIntegration(integration, selectedStep);
        setIntegration(i, false);
        setShowDeleteConfirmation(false);
        setSelectedStep(undefined);
    }

    function changeBean (bean: RegistryBeanDefinition) {
        const clone = CamelUtil.cloneIntegration(integration);
        const i = CamelDefinitionApiExt.addBeanToIntegration(clone, bean);
        setIntegration(i, false);
        setSelectedStep(bean);
    }

    function getDeleteConfirmation() {
        return (<Modal
            className="modal-delete"
            title="Confirmation"
            isOpen={showDeleteConfirmation}
            onClose={() => setShowDeleteConfirmation(false)}
            actions={[
                <Button key="confirm" variant="primary" onClick={e => deleteBean()}>Delete</Button>,
                <Button key="cancel" variant="link"
                        onClick={e => setShowDeleteConfirmation(false)}>Cancel</Button>
            ]}
            onEscapePress={e => setShowDeleteConfirmation(false)}>
            <div>
                Delete bean from integration?
            </div>
        </Modal>)
    }

    function selectBean (bean?: RegistryBeanDefinition) {
        setSelectedStep(bean);
    }

    function unselectBean (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        if ((evt.target as any).dataset.click === 'BEANS') {
            evt.stopPropagation()
            setSelectedStep(undefined);
        }
    };

    function createBean () {
        changeBean(new RegistryBeanDefinition());
    }

    function getPropertiesPanel() {
        return (
            <DrawerPanelContent isResizable hasNoBorder defaultSize={'400px'} maxSize={'800px'} minSize={'300px'}>
                <BeanProperties integration={integration}
                                bean={selectedStep}
                                dark={dark}
                                onChange={changeBean}
                                onClone={changeBean}/>
            </DrawerPanelContent>
        )
    }

    const beans = CamelUi.getBeans(integration);
    return (
        <PageSection className="rest-page" isFilled padding={{default: 'noPadding'}}>
            <div className="rest-page-columns">
                <Drawer isExpanded isInline>
                    <DrawerContent panelContent={getPropertiesPanel()}>
                        <DrawerContentBody>
                            <div className="graph" data-click="REST"  onClick={event => unselectBean(event)}>
                                <div className="flows">
                                    {beans?.map((bean, index) => <BeanCard key={bean.uuid + index}
                                                                  bean={bean}
                                                                  selectElement={selectBean}
                                                                  deleteElement={onShowDeleteConfirmation}/>)}
                                    <div className="add-rest">
                                        <Button
                                            variant={beans?.length === 0 ? "primary" : "secondary"}
                                            data-click="ADD_REST"
                                            icon={<PlusIcon/>}
                                            onClick={e => createBean()}>Create bean
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </DrawerContentBody>
                    </DrawerContent>
                </Drawer>
            </div>
            {getDeleteConfirmation()}
        </PageSection>
    )
}
