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
import React, {useEffect} from 'react';
import {
    Button, Drawer, DrawerContent, DrawerContentBody, DrawerPanelContent, Flex, FlexItem, Gallery, GalleryItem, Modal,
    PageSection
} from '@patternfly/react-core';
import './rest.css';
import '../karavan.css';
import {CamelElement} from "karavan-core/lib/model/IntegrationDefinition";
import {DslProperties} from "../property/DslProperties";
import {RestCard} from "./RestCard";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {
    RestConfigurationDefinition,
    RestContextRefDefinition,
    RestDefinition
} from "karavan-core/lib/model/CamelDefinition";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {RestMethodSelector} from "./RestMethodSelector";
import {DslMetaModel} from "../utils/DslMetaModel";
import {CamelDefinitionApi} from "karavan-core/lib/api/CamelDefinitionApi";
import {RestConfigurationCard} from "./RestConfigurationCard";
import {v4 as uuidv4} from "uuid";
import {useDesignerStore, useIntegrationStore, useSelectorStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";

export function RestDesigner() {

    const [integration, setIntegration] = useIntegrationStore((state) => [state.integration, state.setIntegration], shallow)
    const [selectedStep, showDeleteConfirmation, setShowDeleteConfirmation, setSelectedStep, setNotification]
        = useDesignerStore((s) =>
        [s.selectedStep, s.showDeleteConfirmation, s.setShowDeleteConfirmation, s.setSelectedStep, s.setNotification], shallow)

    const [showSelector, setShowSelector] = useSelectorStore((s) => [s.showSelector, s.setShowSelector], shallow)

    useEffect(() => {
        return () => {
            setNotification(false, ['', '']);
        }
    }, []);

    function selectElement(element: CamelElement) {
        setSelectedStep(element);
    }

    function unselectElement(evt: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        if ((evt.target as any).dataset.click === 'REST') {
            evt.stopPropagation()
            setSelectedStep(undefined);
        }
    }

    function addRest(rest: RestDefinition) {
        const clone = CamelUtil.cloneIntegration(integration);
        const i = CamelDefinitionApiExt.addRestToIntegration(clone, rest);
        setIntegration(i, false);
        setSelectedStep(rest);
    }

    function createRest() {
        addRest(new RestDefinition());
    }

    function createRestConfiguration() {
        addRest(new RestConfigurationDefinition());
    }

    function onShowDeleteConfirmation(element: CamelElement) {
        setSelectedStep(element);
        setShowDeleteConfirmation(true);
    }

    function deleteElement() {
        if (selectedStep) {
            let i;
            if (selectedStep.dslName === 'RestDefinition') i = CamelDefinitionApiExt.deleteRestFromIntegration(integration, selectedStep.uuid);
            else if (selectedStep.dslName === 'RestConfigurationDefinition') i = CamelDefinitionApiExt.deleteRestConfigurationFromIntegration(integration);
            else i = CamelDefinitionApiExt.deleteRestMethodFromIntegration(integration, selectedStep.uuid);
            setIntegration(i, false);
            setSelectedStep(undefined);
            setShowDeleteConfirmation(false);
        }
    }

    function getDeleteConfirmation() {
        return (<Modal
            className="modal-delete"
            title="Confirmation"
            isOpen={showDeleteConfirmation}
            onClose={() => setShowDeleteConfirmation(false)}
            actions={[
                <Button key="confirm" variant="primary" onClick={e => deleteElement()}>Delete</Button>,
                <Button key="cancel" variant="link"
                        onClick={e => setShowDeleteConfirmation(false)}>Cancel</Button>
            ]}
            onEscapePress={e => setShowDeleteConfirmation(false)}>
            <div>
                Delete element from integration?
            </div>
        </Modal>)
    }

    function closeMethodSelector() {
        setShowSelector(false);
    }

    function onMethodSelect(method: DslMetaModel) {
        if (selectedStep) {
            const clone = CamelUtil.cloneIntegration(integration);
            const m = CamelDefinitionApi.createStep(method.dsl, {});
            const i = CamelDefinitionApiExt.addRestMethodToIntegration(clone, m, selectedStep?.uuid);
            setIntegration(i, false);
            setSelectedStep(m);
            setShowSelector(false);
        }
    }

    function cloneRest(rest: CamelElement) {
        if (rest.dslName === 'RestDefinition') {
            const cloneRest = CamelUtil.cloneStep(rest);
            cloneRest.uuid = uuidv4();
            const cloneIntegration = CamelUtil.cloneIntegration(integration);
            const i = CamelDefinitionApiExt.addRestToIntegration(cloneIntegration, cloneRest);
            setIntegration(i, false);
            setSelectedStep(cloneRest);
        } else if (rest.dslName === 'RestConfigurationDefinition') {
            // could be only one RestConfigurationDefinition
        } else if (selectedStep) {
            const parentId = CamelDefinitionApiExt.findRestMethodParent(integration, rest);
            if (parentId) {
                const cloneRest = CamelUtil.cloneStep(rest);
                cloneRest.uuid = uuidv4();
                const cloneIntegration = CamelUtil.cloneIntegration(integration);
                const i = CamelDefinitionApiExt.addRestMethodToIntegration(cloneIntegration, cloneRest, parentId);
                setIntegration(i, false);
                setSelectedStep(cloneRest);
            }
        }
    }

    function selectMethod(element: CamelElement) {
        setSelectedStep(element);
        setShowSelector(true);
    }

    function getSelectorModal() {
        return (
            <Modal
                title="Select method"
                width={'90%'}
                className='dsl-modal'
                isOpen={showSelector}
                onClose={() => closeMethodSelector()}
                actions={{}}>
                <RestMethodSelector onMethodSelect={onMethodSelect}/>
            </Modal>)
    }

    function getRestConfigurationCard(config: RestContextRefDefinition) {
        return (<>
            <RestConfigurationCard key={Math.random().toString()}
                                   selectedRestConfig={selectedStep}
                                   restConfig={config}
                                   selectElement={selectElement}
                                   deleteElement={onShowDeleteConfirmation}/>
        </>)
    }

    function getRestCards(data: RestDefinition[]) {
        return (<>
            {data?.map((rest, index) =>
                <RestCard key={rest.uuid + index}
                          selectedStep={selectedStep}
                          rest={rest}
                          integration={integration}
                          selectMethod={selectMethod}
                          selectElement={selectElement}
                          deleteElement={onShowDeleteConfirmation}
                />
            )}
        </>)
    }


    function getPropertiesPanel() {
        return (
            <DrawerPanelContent isResizable hasNoBorder defaultSize={'400px'} maxSize={'800px'} minSize={'100px'}>
                <DslProperties designerType={'rest'}/>
            </DrawerPanelContent>
        )
    }

    const data = integration.spec.flows?.filter(f => f.dslName === 'RestDefinition');
    const configData = integration.spec.flows?.filter(f => f.dslName === 'RestConfigurationDefinition');
    const config = configData && Array.isArray(configData) ? configData[0] : undefined;
    return (
        <PageSection className="rest-designer" isFilled padding={{default: 'noPadding'}}>
            <Drawer isExpanded isInline>
                <DrawerContent panelContent={getPropertiesPanel()}>
                    <DrawerContentBody>
                        <Gallery className="gallery"
                                 hasGutter
                                 maxWidths={{
                                     default: '100%',
                                 }}
                        >
                            {config && getRestConfigurationCard(config)}
                            {data && getRestCards(data)}
                            <GalleryItem>
                                <Flex direction={{default: "row"}} justifyContent={{default: "justifyContentCenter"}}>
                                    <FlexItem>
                                        <Button
                                            variant={data?.length === 0 ? "primary" : "secondary"}
                                            data-click="ADD_REST"
                                            icon={<PlusIcon/>}
                                            onClick={e => createRest()}>Create service
                                        </Button>
                                    </FlexItem>
                                    <FlexItem>
                                        {config === undefined &&
                                            <GalleryItem>
                                                <Button
                                                    variant="secondary"
                                                    data-click="ADD_REST_REST_CONFIG"
                                                    icon={<PlusIcon/>}
                                                    onClick={e => createRestConfiguration()}>Create configuration
                                                </Button>
                                            </GalleryItem>
                                        }
                                    </FlexItem>
                                </Flex>
                            </GalleryItem>
                        </Gallery>
                    </DrawerContentBody>
                </DrawerContent>
            </Drawer>
            {getSelectorModal()}
            {getDeleteConfirmation()}
        </PageSection>
    )
}
