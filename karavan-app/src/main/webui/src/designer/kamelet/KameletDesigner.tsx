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
    Button,
    Drawer,
    DrawerContent,
    DrawerContentBody,
    DrawerPanelContent,
    Modal,
    PageSection,
} from '@patternfly/react-core';
import '../karavan.css';
import './kamelet.css';
import {RegistryBeanDefinition} from "karavan-core/lib/model/CamelDefinition";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {useDesignerStore, useIntegrationStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";
import {KameletAnnotationsPanel} from "./KameletAnnotationsPanel";
import {KameletDefinitionsPanel} from "./KameletDefinitionsPanel";
import {KameletProperties} from "./KameletProperties";

export function KameletDesigner() {

    const [integration, setIntegration] = useIntegrationStore((s) => [s.integration, s.setIntegration], shallow)
    const [dark, selectedStep, showDeleteConfirmation, setShowDeleteConfirmation, setSelectedStep] = useDesignerStore((s) =>
        [s.dark, s.selectedStep, s.showDeleteConfirmation, s.setShowDeleteConfirmation, s.setSelectedStep], shallow)


    function onShowDeleteConfirmation(bean: RegistryBeanDefinition) {
        setSelectedStep(bean);
        setShowDeleteConfirmation(true);
    }

    function deleteBean() {
        const i = CamelDefinitionApiExt.deleteBeanFromIntegration(integration, selectedStep as RegistryBeanDefinition);
        setIntegration(i, false);
        setShowDeleteConfirmation(false);
        setSelectedStep(undefined);
    }

    function changeBean(bean: RegistryBeanDefinition) {
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

    function selectBean(bean?: RegistryBeanDefinition) {
        setSelectedStep(bean);
    }

    function unselectBean(evt: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        if ((evt.target as any).dataset.click === 'BEANS') {
            evt.stopPropagation()
            setSelectedStep(undefined);
        }
    };

    function createBean() {
        changeBean(new RegistryBeanDefinition());
    }

    function getPropertiesPanel() {
        return (
            <DrawerPanelContent isResizable
                                hasNoBorder
                                defaultSize={'400px'}
                                maxSize={'800px'}
                                minSize={'400px'}>
                <KameletProperties integration={integration}
                                dark={dark}
                                onChange={changeBean}
                                onClone={changeBean}/>
            </DrawerPanelContent>
        )
    }

    return (
        <PageSection className="kamelet-designer" isFilled padding={{default: 'noPadding'}}>
            <Drawer isExpanded isInline>
                <DrawerContent panelContent={getPropertiesPanel()}>
                    <DrawerContentBody>
                        <PageSection className="main">
                            <KameletAnnotationsPanel/>
                            <div style={{height:"20px"}}/>
                            <KameletDefinitionsPanel/>
                        </PageSection>
                    </DrawerContentBody>
                </DrawerContent>
            </Drawer>
            {getDeleteConfirmation()}
        </PageSection>
    )
}
