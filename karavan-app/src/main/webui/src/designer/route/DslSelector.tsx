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
import React, {useEffect, useState} from 'react';
import {
    Badge,
    Card, CardBody, CardFooter, CardHeader, Flex, FlexItem, Form, FormGroup, Gallery, Modal, PageSection,
    Tab, Tabs, TabTitleText,
    Text, TextInput, ToggleGroup, ToggleGroupItem,Switch
} from '@patternfly/react-core';
import './DslSelector.css';
import {CamelUi} from "../utils/CamelUi";
import {DslMetaModel} from "../utils/DslMetaModel";
import {useDesignerStore, useSelectorStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";
import {useRouteDesignerHook} from "./useRouteDesignerHook";
import { ComponentApi } from 'karavan-core/lib/api/ComponentApi';
import { KameletApi } from 'karavan-core/lib/api/KameletApi';

interface Props {
    tabIndex?: string | number
}

export function DslSelector (props: Props) {

    const [showSelector, showSteps, parentId, parentDsl, selectorTabIndex, setShowSelector, setSelectorTabIndex,
        selectedPosition, selectedLabels, addSelectedLabel, deleteSelectedLabel] =
        useSelectorStore((s) =>
            [s.showSelector, s.showSteps, s.parentId, s.parentDsl, s.selectorTabIndex, s.setShowSelector, s.setSelectorTabIndex,
                s.selectedPosition, s.selectedLabels, s.addSelectedLabel, s.deleteSelectedLabel], shallow)

    const [dark] = useDesignerStore((s) => [s.dark], shallow)

    const {onDslSelect} = useRouteDesignerHook();


    const [filter, setFilter] = useState<string>('');
    const [customOnly, setCustomOnly] = useState<boolean>(false);

    useEffect(() => {
    }, [selectedLabels]);


    function selectTab(evt: React.MouseEvent<HTMLElement, MouseEvent>, eventKey: string | number) {
        setSelectorTabIndex(eventKey);
    }

    function selectDsl(evt: React.MouseEvent, dsl: any) {
        evt.stopPropagation();
        setFilter('');
        setShowSelector(false);
        onDslSelect(dsl, parentId, selectedPosition);
    }

    function searchInput() {
        return (
            <Flex className="search">
              {selectorTabIndex === 'kamelet' && <FlexItem>
                    <Switch
                        label="Custom only"
                        id="switch"
                        isChecked={customOnly}
                        onChange={(_event, checked) => setCustomOnly(checked)}
                    />
                </FlexItem>}
                <FlexItem>
                    <TextInput className="text-field" type="text" id="search" name="search" autoComplete={"off"}
                               value={filter}
                               onChange={(_, value) => setFilter(value)}/>
                </FlexItem>
            </Flex>
        )
    }
    
    function getCard(dsl: DslMetaModel, index: number) {
        const labels = dsl.labels !== undefined ? dsl.labels.split(",").filter(label => label !== 'eip') : [];
        const isCustom = KameletApi.getCustomKameletNames().includes(dsl.name);
        return (
            <Card key={dsl.dsl + index} isCompact className="dsl-card"
                  onClick={event => selectDsl(event, dsl)}>
                <CardHeader className="header-labels">
                    <Badge isRead className="support-level labels">{dsl.supportLevel}</Badge>
                    {['kamelet', 'component'].includes(dsl.navigation.toLowerCase()) &&
                        <Badge isRead className="version labels">{dsl.version}</Badge>
                    }
                     {isCustom && <Badge className="custom">custom</Badge>}
                </CardHeader>
                <CardHeader>
                    {CamelUi.getIconForDsl(dsl)}
                    <Text>{dsl.title}</Text>
                </CardHeader>
                <CardBody>
                    <Text>{dsl.description}</Text>
                </CardBody>
                <CardFooter className="footer-labels">
                    <div style={{display: "flex", flexDirection: "row", justifyContent: "start"}}>
                        {labels.map((label, index) => <Badge key={label + "-" + index} isRead
                                                             className="labels">{label}</Badge>)}
                    </div>

                </CardFooter>
            </Card>
        )
    }

    function close() {
        setFilter('');
        setShowSelector(false);
    }

    function selectLabel(eipLabel: string) {
        if (!selectedLabels.includes(eipLabel)) {
            addSelectedLabel(eipLabel);
        } else {
            deleteSelectedLabel(eipLabel);
        }
    }

    const isEip = selectorTabIndex === 'eip';
    const title = parentDsl === undefined ? "Select source" : "Select step";
    const navigation: string = selectorTabIndex ? selectorTabIndex.toString() : '';
    const blockedComponents = ComponentApi.getBlockedComponentNames();
    const blockedKamelets = KameletApi.getBlockedKameletNames();
    const elements = CamelUi.getSelectorModelsForParentFiltered(parentDsl, navigation, showSteps);
    let allowedElements = selectorTabIndex === 'component' ?
        elements.filter(dsl => (!blockedComponents.includes(dsl.uri || dsl.name))) :
        (selectorTabIndex === 'kamelet' ? elements.filter(dsl => (!blockedKamelets.includes(dsl.name))) : elements);
    const eipLabels = [...new Set(elements.map(e => e.labels).join(",").split(",").filter(e => e !== 'eip'))];
    if (customOnly) allowedElements = allowedElements.filter(k => KameletApi.getCustomKameletNames().includes(k.name));
    const filteredElement = allowedElements
        .filter((dsl: DslMetaModel) => CamelUi.checkFilter(dsl, filter))
        .filter((dsl: DslMetaModel) => {
            if (!isEip || selectedLabels.length === 0) {
                return true;
            } else {
                return dsl.labels.split(",").some(r => selectedLabels.includes(r));
            }
        });

    return (
        <Modal
            aria-label={title}
            width={'90%'}
            className='dsl-modal'
            isOpen={showSelector}
            onClose={() => close()}
            header={
                <Flex direction={{default: "column"}}>
                    <FlexItem>
                        <h3>{title}</h3>
                        {searchInput()}
                    </FlexItem>
                    <FlexItem>
                        <Tabs style={{overflow: 'hidden'}} activeKey={selectorTabIndex}
                              onSelect={selectTab}>
                            {parentDsl !== undefined &&
                                <Tab eventKey={"eip"} key={"tab-eip"}
                                     title={<TabTitleText>Integration Patterns</TabTitleText>}>
                                </Tab>
                            }
                            <Tab eventKey={'kamelet'} key={"tab-kamelet"}
                                 title={<TabTitleText>Kamelets</TabTitleText>}>
                            </Tab>
                            <Tab eventKey={'component'} key={'tab-component'}
                                 title={<TabTitleText>Components</TabTitleText>}>
                            </Tab>
                        </Tabs>
                    </FlexItem>
                </Flex>
            }
            actions={{}}>
            <PageSection padding={{default: "noPadding"}} variant={dark ? "darker" : "light"}>
                {isEip && <ToggleGroup aria-label="Labels" isCompact>
                    {eipLabels.map(eipLabel => <ToggleGroupItem
                        key={eipLabel}
                        text={eipLabel}
                        buttonId={eipLabel}
                        isSelected={selectedLabels.includes(eipLabel)}
                        onChange={selected => selectLabel(eipLabel)}
                    />)}
                </ToggleGroup>}
                <Gallery key={"gallery-" + navigation} hasGutter className="dsl-gallery">
                    {showSelector && filteredElement.map((dsl: DslMetaModel, index: number) => getCard(dsl, index))}
                </Gallery>
            </PageSection>
        </Modal>
    )
}