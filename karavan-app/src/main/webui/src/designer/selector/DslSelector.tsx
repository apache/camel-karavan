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
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Flex,
    FlexItem,
    Gallery,
    Modal,
    PageSection,
    Switch,
    Tab,
    Tabs,
    TabTitleText,
    Text,
    TextInputGroup,
    TextInputGroupMain,
    TextInputGroupUtilities,
    ToggleGroup,
    ToggleGroupItem
} from '@patternfly/react-core';
import './DslSelector.css';
import {CamelUi} from "../utils/CamelUi";
import {DslMetaModel} from "../utils/DslMetaModel";
import {useDesignerStore, useSelectorStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";
import {useRouteDesignerHook} from "../route/useRouteDesignerHook";
import {ComponentApi} from 'karavan-core/lib/api/ComponentApi';
import {KameletApi} from 'karavan-core/lib/api/KameletApi';
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import {addPreferredElement, getPreferredElements} from "./DslPreferences";

interface Props {
    tabIndex?: string | number
}

export function DslSelector (props: Props) {

    const [showSelector, showSteps, parentId, parentDsl, selectorTabIndex, setShowSelector, setSelectorTabIndex,
        selectedPosition, selectedLabels, addSelectedLabel, deleteSelectedLabel, clearSelectedLabels] =
        useSelectorStore((s) =>
            [s.showSelector, s.showSteps, s.parentId, s.parentDsl, s.selectorTabIndex, s.setShowSelector, s.setSelectorTabIndex,
                s.selectedPosition, s.selectedLabels, s.addSelectedLabel, s.deleteSelectedLabel, s.clearSelectedLabels], shallow)

    const [dark] = useDesignerStore((s) => [s.dark], shallow)

    const {onDslSelect} = useRouteDesignerHook();

    const [filter, setFilter] = useState<string>('');
    const [customOnly, setCustomOnly] = useState<boolean>(false);
    const [preferredEip, setPreferredEip] = useState<string[]>([]);
    const [preferredComponents, setPreferredComponents] = useState<string[]>([]);
    const [preferredKamelets, setPreferredKamelets] = useState<string[]>([]);

    useEffect(() => {
        setPreferredEip(getPreferredElements('eip'));
        setPreferredComponents(getPreferredElements('components'));
        setPreferredKamelets(getPreferredElements('kamelets'));
    }, [selectedLabels]);


    function selectTab(evt: React.MouseEvent<HTMLElement, MouseEvent>, eventKey: string | number) {
        setSelectorTabIndex(eventKey);
    }

    function selectDsl(evt: React.MouseEvent, dsl: any) {
        evt.stopPropagation();
        setFilter('');
        setShowSelector(false);
        onDslSelect(dsl, parentId, selectedPosition);
        const type = isEip ? 'eip' : (selectorTabIndex === 'components' ? 'components' : 'kamelets');
        addPreferredElement(type, dsl)
    }

    function searchInput() {
        return (
            <Flex className="search">
                {selectorTabIndex === 'kamelets' && <FlexItem>
                    <Switch
                        label="Custom only"
                        id="switch"
                        isChecked={customOnly}
                        onChange={(_event, checked) => setCustomOnly(checked)}
                    />
                </FlexItem>}
                <FlexItem>
                    <TextInputGroup>
                        <TextInputGroupMain className="text-field" type="text" autoComplete={"off"}
                               value={filter}
                               onChange={(_, value) => setFilter(value)}/>
                        <TextInputGroupUtilities>
                            <Button variant="plain" onClick={_ => setFilter('')}>
                                <TimesIcon />
                            </Button>
                        </TextInputGroupUtilities>
                    </TextInputGroup>
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
                    <Text className='dsl-card-title'>{dsl.title}</Text>
                </CardHeader>
                <CardBody>
                    {/*<Text>{dsl.description}</Text>*/}
                    <Text className="pf-v5-u-color-200">{dsl.description}</Text>
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

    function getFastCard(dsl: DslMetaModel, index: number) {
        return (
            <Card key={dsl.dsl + index} isCompact className="dsl-card dsl-fast-card"
                  onClick={event => selectDsl(event, dsl)}>
                <CardHeader className='header'>
                    {CamelUi.getIconForDsl(dsl)}
                    <Text className='dsl-fast-card-title'>{dsl.title}</Text>
                </CardHeader>
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

    function filterElements(elements: DslMetaModel[], type: 'eip' | 'components' | 'kamelets'):DslMetaModel[] {
        return elements.filter((dsl: DslMetaModel) => CamelUi.checkFilter(dsl, filter))
            .filter((dsl: DslMetaModel) => {
                if (type !== 'eip' || selectedLabels.length === 0) {
                    return true;
                } else {
                    return dsl.labels.split(",").some(r => selectedLabels.includes(r));
                }
            });
    }

    const isEip = selectorTabIndex === 'eip';
    const isRouteConfig = parentDsl === 'RouteConfigurationDefinition';
    const title = parentDsl === undefined ? "Select source" : "Select step";
    const navigation: string = selectorTabIndex ? selectorTabIndex.toString() : '';
    const blockedComponents = ComponentApi.getBlockedComponentNames();
    const blockedKamelets = KameletApi.getBlockedKameletNames();

    const eipElements = CamelUi.getSelectorModelsForParentFiltered(parentDsl, 'eip', showSteps);
    const componentElements = CamelUi.getSelectorModelsForParentFiltered(parentDsl, 'component', showSteps)
        .filter(dsl => (!blockedComponents.includes(dsl.uri || dsl.name)));
    let kameletElements = CamelUi.getSelectorModelsForParentFiltered(parentDsl, 'kamelet', showSteps)
        .filter(dsl => (!blockedKamelets.includes(dsl.name)));
    if (customOnly) kameletElements = kameletElements.filter(k => KameletApi.getCustomKameletNames().includes(k.name));

    const elements = navigation === 'components'
        ? componentElements
        : (navigation === 'kamelets' ? kameletElements : eipElements);

    const preferredElements = navigation === 'components'
        ? preferredComponents
        : (navigation === 'kamelets' ? preferredKamelets : preferredEip);

    const filteredEipElements = filterElements(eipElements, 'eip');
    const filteredComponentElements = filterElements(componentElements, 'components');
    const filteredKameletElements = filterElements(kameletElements, 'kamelets');

    const eipLabels = [...new Set(eipElements.map(e => e.labels).join(",").split(",").filter(e => e !== 'eip'))];


    const filteredElements = navigation === 'components'
        ? filteredComponentElements
        : (navigation === 'kamelets' ? filteredKameletElements : filteredEipElements);

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
                                     title={<TabTitleText>{`Integration Patterns (${filteredEipElements?.length})`}</TabTitleText>}>
                                </Tab>
                            }
                            {!isRouteConfig &&
                                <Tab eventKey={'components'} key={'tab-component'}
                                     title={
                                         <TabTitleText>{`Components (${filteredComponentElements?.length})`}</TabTitleText>}>
                                </Tab>
                            }
                            {!isRouteConfig &&
                                <Tab eventKey={'kamelets'} key={"tab-kamelet"}
                                     title={
                                         <TabTitleText>{`Kamelets (${filteredKameletElements?.length})`}</TabTitleText>}>
                                </Tab>
                            }
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
                    <ToggleGroupItem key='clean' buttonId='clean' isSelected={false} onChange={clearSelectedLabels} icon={<TimesIcon/>}/>
                </ToggleGroup>}
                <Gallery key={"fast-gallery-" + navigation} hasGutter className="dsl-gallery" minWidths={{default: '150px'}}>
                    {showSelector && elements
                        .filter((d: DslMetaModel) => {
                            if (isEip) {
                                return preferredElements.includes(d.dsl);
                            } else if (navigation === 'components') {
                                return d.uri && preferredElements.includes(d.uri)
                            } else {
                                return preferredElements.includes(d.name)
                            }
                        })
                        .filter((_, i) => i < 7).map((dsl: DslMetaModel, index: number) => getFastCard(dsl, index))}
                </Gallery>
                <Gallery key={"gallery-" + navigation} hasGutter className="dsl-gallery" minWidths={{default: '200px'}}>
                    {showSelector && filteredElements.map((dsl: DslMetaModel, index: number) => getCard(dsl, index))}
                </Gallery>
            </PageSection>
        </Modal>
    )
}