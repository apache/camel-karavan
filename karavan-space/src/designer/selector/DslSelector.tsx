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
    Button,
    Flex,
    FlexItem,
    Gallery,
    Modal,
    PageSection,
    Switch,
    TextInputGroup,
    TextInputGroupUtilities, TextVariants, Text,
    ToggleGroup,
    ToggleGroupItem, TextContent, Badge, TextInput, Skeleton
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
import {addPreferredElement, deletePreferredElement, getPreferredElements} from "./DslPreferences";
import {DslFastCard} from "./DslFastCard";
import {DslCard} from "./DslCard";
import {useDebounceCallback, useDebounceValue} from 'usehooks-ts';

interface Props {
    tabIndex?: string | number
}

export function DslSelector(props: Props) {

    const [showSelector, showSteps, parentId, parentDsl, setShowSelector,
        selectedPosition, selectedToggles, addSelectedToggle, deleteSelectedToggle] =
        useSelectorStore((s) =>
            [s.showSelector, s.showSteps, s.parentId, s.parentDsl, s.setShowSelector,
                s.selectedPosition, s.selectedToggles, s.addSelectedToggle, s.deleteSelectedToggle], shallow)

    const [dark] = useDesignerStore((s) => [s.dark], shallow)

    const {onDslSelect} = useRouteDesignerHook();

    const [filterShown, setFilterShown] =  useState<string>('');
    const [filter, setFilter] = useDebounceValue('', 300);

    const [customOnly, setCustomOnly] = useState<boolean>(false);
    const [elements, setElements] = useState<DslMetaModel[]>([]);
    const [preferredElements, setPreferredElements] = useState<string[]>([]);
    const [ready, setReady] = useState<boolean>(false);

    useEffect(() => {
        setAllElements();
        setPreferences();
        setReady(true);
    }, []);

    function setAllElements() {
        const blockedComponents = ComponentApi.getBlockedComponentNames();
        const blockedKamelets = KameletApi.getBlockedKameletNames();
        const eipE = CamelUi.getSelectorModelsForParentFiltered(parentDsl, 'eip', showSteps);
        const cE = CamelUi.getSelectorModelsForParentFiltered(parentDsl, 'component', showSteps)
            .filter(dsl => (!blockedComponents.includes(dsl.uri || dsl.name)));
        const kE = CamelUi.getSelectorModelsForParentFiltered(parentDsl, 'kamelet', showSteps)
            .filter(dsl => (!blockedKamelets.includes(dsl.name)));
        const e: DslMetaModel[] = [];
        if (parentDsl !== undefined) {
            e.push(...eipE)
        }
        e.push(...cE)
        e.push(...kE)
        setElements(e);
    }

    function setPreferences() {
        const p: string[] = []
        p.push(...getPreferredElements('kamelets'));
        p.push(...getPreferredElements('components'));
        if (parentDsl !== undefined) {
            p.push(...getPreferredElements('eip'));
        }
        setPreferredElements(p);
    }

    function getDslMetaModelType(dsl: DslMetaModel){
        return ['ToDefinition', 'FromDefinition'].includes(dsl.type) ? 'components' : (dsl.uri?.startsWith("kamelet:") ? "kamelets" : 'eip');
    }

    function selectDsl(evt: React.MouseEvent, dsl: any) {
        evt.stopPropagation();
        setFilter('');
        setShowSelector(false);
        onDslSelect(dsl, parentId, selectedPosition);
        addPreferredElement(getDslMetaModelType(dsl), dsl)
    }

    function deleteFast(evt: React.MouseEvent, dsl: DslMetaModel) {
        evt.stopPropagation();
        deletePreferredElement(getDslMetaModelType(dsl), dsl);
        setPreferences();
    }

    function searchInput() {
        return (
            <TextInputGroup className="search">
                <TextInput
                    value={filterShown}
                    type="text"
                    autoComplete={"off"}
                    autoFocus={true}
                    onChange={(_event, value) => {
                        setFilterShown(value);
                        setFilter(value);
                    }}
                    aria-label="text input example"
                />
                <TextInputGroupUtilities>
                    <Button variant="plain" onClick={_ => {
                        setFilterShown('');
                        setFilter('');
                    }}>
                        <TimesIcon aria-hidden={true}/>
                    </Button>
                </TextInputGroupUtilities>
            </TextInputGroup>
        )
    }

    function getToggles() {
        const isEIP = selectedToggles.includes('eip')
        const isComp = selectedToggles.includes('components')
        const isKam = selectedToggles.includes('kamelets')
        return (
            <ToggleGroup aria-label="Default with single selectable" className='navigation-selector'>
                {parentDsl !== undefined && <ToggleGroupItem
                    text={
                        <div style={{display: 'flex', flexDirection: 'row'}}>
                            <div style={{marginRight: '6px'}}>EIP</div>
                            {ready && <Badge isRead={!isEIP} className={isEIP ? "label-eip" : ""}>{eCount}</Badge>}
                        </div>
                    }
                    buttonId="eip"
                    isSelected={selectedToggles.includes('eip')}
                    onChange={(_, selected) => {
                        if (selected) addSelectedToggle('eip')
                        else deleteSelectedToggle('eip')
                    }}
                />}
                <ToggleGroupItem
                    text={
                        <div style={{display: 'flex', flexDirection: 'row'}}>
                            <div style={{marginRight: '6px'}}>Components</div>
                            {ready && <Badge isRead={!isComp} className={isComp ? "label-component" : ""}>{cCount}</Badge>}
                        </div>
                    }
                    buttonId="components"
                    isSelected={selectedToggles.includes('components')}
                    onChange={(_, selected) => {
                        if (selected) addSelectedToggle('components')
                        else deleteSelectedToggle('components')
                    }}
                />
                <ToggleGroupItem
                    text={
                        <div style={{display: 'flex', flexDirection: 'row'}}>
                            <div style={{marginRight: '6px'}}>Kamelets</div>
                            {ready && <Badge isRead={!isKam} className={isKam ? "label-kamelet" : ""}>{kCount}</Badge>}
                        </div>
                    }
                    buttonId="kamelets"
                    isSelected={selectedToggles.includes('kamelets')}
                    onChange={(_, selected) => {
                        if (selected) addSelectedToggle('kamelets')
                        else deleteSelectedToggle('kamelets')
                    }}
                />
            </ToggleGroup>
        )
    }

    function getHeader() {
        return (
            <Flex direction={{default: "row"}}>
                <FlexItem>
                    <TextContent>
                        <Text component={TextVariants.h3}>{title}</Text>
                    </TextContent>
                </FlexItem>
                <FlexItem>
                    {searchInput()}
                </FlexItem>
                <FlexItem>
                    {getToggles()}
                </FlexItem>
                {selectedToggles.includes('kamelets') && <FlexItem>
                    <Switch
                        label="Custom only"
                        id="switch"
                        isChecked={customOnly}
                        onChange={(_event, checked) => setCustomOnly(checked)}
                    />
                </FlexItem>}
            </Flex>
        )
    }

    function close() {
        setFilter('');
        setShowSelector(false);
    }

    const title = parentDsl === undefined ? "Select source" : "Select step";
    const filteredElements: DslMetaModel[] = elements
        .filter(d => {
            if (selectedToggles.includes('eip') && d.navigation === 'eip') return true
            else if (selectedToggles.includes('components') && d.navigation === 'component') return true
            else if (selectedToggles.includes('kamelets') && d.navigation === 'kamelet') return true
            else return false;
        })
        .filter(d => CamelUi.checkFilter(d, filter));

    const eCount = filteredElements.filter(e => e.navigation === 'eip').length;
    const cCount = filteredElements.filter(e => e.navigation === 'component').length;
    const kCount = filteredElements.filter(e => e.navigation === 'kamelet').length;

    const fastElements: DslMetaModel[] = elements
        .filter((d: DslMetaModel) => {
        if (selectedToggles.includes('eip') && d.navigation === 'eip') {
            return preferredElements.includes(d.dsl);
        } else if (d.navigation === 'component' && d.navigation === 'component') {
            return d.uri && preferredElements.includes(d.uri)
        } else {
            return preferredElements.includes(d.name)
        }
        })
        .filter(d => CamelUi.checkFilter(d, filter))
        .filter((_, i) => i < 7)

    return (
        <Modal
            aria-label={title}
            width={'90%'}
            className='dsl-modal'
            isOpen={showSelector}
            onClose={() => close()}
            header={getHeader()}
            actions={{}}>
            <PageSection padding={{default: "noPadding"}} variant={dark ? "darker" : "light"}>
                {!ready && [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i =>
                    <React.Fragment>
                        <Skeleton width={i * 10 + '%'} screenreaderText="Loading..."/>
                        <br/>
                    </React.Fragment>)
                }
                <Gallery key={"fast-gallery"} hasGutter className="dsl-gallery"
                         minWidths={{default: '150px'}}>
                    {showSelector && fastElements.map((dsl: DslMetaModel, index: number) =>
                        <DslFastCard dsl={dsl} index={index} onDslSelect={selectDsl} onDeleteFast={deleteFast}/>
                    )}
                </Gallery>
                <Gallery key={"gallery"} hasGutter className="dsl-gallery" minWidths={{default: '200px'}}>
                    {showSelector && filteredElements.map((dsl: DslMetaModel, index: number) =>
                        <DslCard dsl={dsl} index={index} onDslSelect={selectDsl}/>
                    )}
                </Gallery>
            </PageSection>
        </Modal>
    )
}