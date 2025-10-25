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
import {Button, Flex, FlexItem, Gallery, GalleryItem, Modal, ModalBody, ModalFooter, ModalHeader, PageSection} from '@patternfly/react-core';
import './bean.css';
import {BeanFactoryDefinition} from "karavan-core/lib/model/CamelDefinition";
import {CamelUi} from "../utils/CamelUi";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {BeanCard} from "./BeanCard";
import {useDesignerStore, useIntegrationStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";
import {ModalConfirmation} from "@/components/ModalConfirmation";

export function BeansDesigner() {

    const [integration, setIntegration] = useIntegrationStore((s) => [s.integration, s.setIntegration], shallow)
    const [selectedStep, showDeleteConfirmation, setShowDeleteConfirmation, setSelectedStep, setNotification]
        = useDesignerStore((s) =>
        [s.selectedStep, s.showDeleteConfirmation, s.setShowDeleteConfirmation, s.setSelectedStep, s.setNotification], shallow)

    useEffect(() => {
        return () => {
            setNotification(false, ['', '']);
        }
    }, []);

    function onShowDeleteConfirmation(bean: BeanFactoryDefinition) {
        setSelectedStep(bean);
        setShowDeleteConfirmation(true);
    }

    function deleteBean() {
        const i = CamelDefinitionApiExt.deleteBeanFromIntegration(integration, selectedStep as BeanFactoryDefinition);
        setIntegration(i, false);
        setShowDeleteConfirmation(false);
        setSelectedStep(undefined);
    }

    function selectBean(bean?: BeanFactoryDefinition) {
        setSelectedStep(bean);
    }

    function unselectBean(evt: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        if ((evt.target as any).dataset.click === 'BEANS') {
            evt.stopPropagation()
            setSelectedStep(undefined);
        }
    }

    function createBean() {
        const bean = new BeanFactoryDefinition();
        const clone = CamelUtil.cloneIntegration(integration);
        const i = CamelDefinitionApiExt.addBeanToIntegration(clone, bean);
        setIntegration(i, false);
        setSelectedStep(bean);
    }

    const beans = CamelUi.getBeans(integration);
    return (
        <PageSection hasBodyWrapper={false} className="bean-designer" isFilled padding={{default: 'noPadding'}}>
            <Gallery className="gallery"
                     hasGutter
                     maxWidths={{
                         default: '100%',
                     }}
            >
                {beans?.map((bean, index) => (
                    <GalleryItem key={bean.uuid + index}>
                        <BeanCard bean={bean}
                                  selectedStep={selectedStep}
                                  selectElement={selectBean}
                                  deleteElement={onShowDeleteConfirmation}
                        />
                    </GalleryItem>
                ))}
                <GalleryItem>
                    <Flex direction={{default: "row"}} justifyContent={{default: "justifyContentCenter"}}>
                        <FlexItem>
                            <Button
                                variant={beans?.length === 0 ? "primary" : "secondary"}
                                data-click="ADD_REST"
                                icon={<PlusIcon/>}
                                onClick={e => createBean()}>Create bean
                            </Button>
                        </FlexItem>
                    </Flex>
                </GalleryItem>
            </Gallery>
            <ModalConfirmation
                isOpen={showDeleteConfirmation}
                message='Delete bean from integration?'
                btnConfirm='Delete'
                btnConfirmVariant='danger'
                onConfirm={() => deleteBean()}
                onCancel={() => setShowDeleteConfirmation(false)}
            />
        </PageSection>
    )
}
