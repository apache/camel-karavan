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
    Bullseye,
    Button,
    Card,
    Content,
    ContentVariants,
    Gallery,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Skeleton,
    Switch,
    TextInput,
    TextInputGroup,
    TextInputGroupUtilities,
    ToggleGroup,
    ToggleGroupItem
} from '@patternfly/react-core';
import './DslSelector.css';
import {CamelUi} from "../utils/CamelUi";
import {DslMetaModel} from "../utils/DslMetaModel";
import {useSelectorStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";
import {ComponentApi} from 'karavan-core/lib/api/ComponentApi';
import {KameletApi} from 'karavan-core/lib/api/KameletApi';
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import {addPreferredElement, deletePreferredElement, getPreferredElements} from "./DslPreferences";
import {DslFastCard} from "./DslFastCard";
import {DslCard} from "./DslCard";
import {useDebounceValue} from 'usehooks-ts';

interface Props {
    onDslSelect: (dsl: DslMetaModel, parentId: string, position?: number | undefined) => void,
    tabIndex?: string | number
}

export function DslSelector(props: Props) {

    const [showSelector, showSteps, parentId, parentDsl, setShowSelector, showProperties, selectedDsl,
        selectedPosition, selectedToggles, addSelectedToggle, deleteSelectedToggle, setShowProperties, setSelectedDsl] =
        useSelectorStore((s) =>
            [s.showSelector, s.showSteps, s.parentId, s.parentDsl, s.setShowSelector, s.showProperties, s.selectedDsl,
                s.selectedPosition, s.selectedToggles, s.addSelectedToggle, s.deleteSelectedToggle, s.setShowProperties, s.setSelectedDsl], shallow)

    const [filterShown, setFilterShown] = useState<string>('');
    const [filter, setFilter] = useDebounceValue('', 300);

    const [customOnly, setCustomOnly] = useState<boolean>(false);
    const [elements, setElements] = useState<DslMetaModel[]>([]);
    const [preferredElements, setPreferredElements] = useState<string[]>([]);
    const [ready, setReady] = useState<boolean>(false);
    const [pageSize, setPageSize] = useState<number>(100);

    useEffect(() => {
        setAllElements();
        setPreferences();
        setReady(true);
        setPageSize(100);
        setShowProperties(false);
        setSelectedDsl(undefined);
        return () => {
            setShowProperties(false);
            setSelectedDsl(undefined);
        }
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

    function getDslMetaModelType(dsl: DslMetaModel) {
        return ['ToDefinition', 'FromDefinition'].includes(dsl.type) ? 'components' : (dsl.uri?.startsWith("kamelet:") ? "kamelets" : 'eip');
    }

    function dslCardClick(evt: React.MouseEvent, dsl: any) {
        evt.stopPropagation();
        if (parentId?.length > 0) {
            afterSelect(dsl as DslMetaModel);
        } else {
            setSelectedDsl(dsl as DslMetaModel);
            setShowProperties(true)
        }
    }

    function afterSelect(dsl: DslMetaModel) {
        setFilter('');
        setShowSelector(false);
        props.onDslSelect(dsl, parentId, selectedPosition);
        addPreferredElement(getDslMetaModelType(dsl), dsl)
    }

    function deleteFast(evt: React.MouseEvent, dsl: DslMetaModel) {
        evt.stopPropagation();
        deletePreferredElement(getDslMetaModelType(dsl), dsl);
        setPreferences();
    }

    function searchInput() {
        return (
            <div>
                <TextInputGroup className="search">
                    <TextInput
                        id={'modal-special-focus'}
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
                        <Button icon={<TimesIcon aria-hidden={true}/>} variant="plain" onClick={_ => {
                            setFilterShown('');
                            setFilter('');
                            setShowProperties(false)
                            setSelectedDsl(undefined)
                        }}/>
                    </TextInputGroupUtilities>
                </TextInputGroup>
            </div>
        )
    }

    function getToggles() {
        const isEIP = selectedToggles.includes('eip')
        const isComp = selectedToggles.includes('components')
        const isKam = selectedToggles.includes('kamelets')
        return (
            <ToggleGroup aria-label="Default with single selectable" className='navigation-selector'>
                {parentDsl !== undefined &&
                    <ToggleGroupItem
                        key='eip'
                        text={
                            <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                                <div style={{marginRight: '6px'}}>Processors</div>
                                {ready && <Badge isRead={!isEIP} className={isEIP ? "label-eip" : ""}>{eCount}</Badge>}
                            </div>
                        }
                        buttonId="eip"
                        isSelected={selectedToggles.includes('eip')}
                        onChange={(_, selected) => {
                            if (selected) addSelectedToggle('eip')
                            else deleteSelectedToggle('eip')
                        }}
                    />
                }
                <ToggleGroupItem
                    key='component'
                    text={
                        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                            <div style={{marginRight: '6px'}}>Components</div>
                            {ready &&
                                <Badge isRead={!isComp} className={isComp ? "label-component" : ""}>{cCount}</Badge>}
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
                    key='kamelet'
                    text={
                        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                            <div style={{marginRight: '6px'}}>Kamelets</div>
                            {ready && <Badge isRead={!isKam} className={isKam ? "label-kamelets" : ""}>{kCount}</Badge>}
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
            <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px'}}>
                <Content component={ContentVariants.h2} style={{textWrap: 'nowrap'}}>{title}</Content>
                {searchInput()}
                {getToggles()}
                {selectedToggles.includes('kamelets') &&
                    <Switch
                        label="Custom only"
                        id="switch"
                        isChecked={customOnly}
                        onChange={(_event, checked) => {
                            setCustomOnly(checked);
                            if (checked) {
                                deleteSelectedToggle('eip');
                                deleteSelectedToggle('components');
                            }
                        }}
                    />}
            </div>
        )
    }

    function close() {
        setFilter('');
        setShowSelector(false);
    }

    const title = parentDsl === undefined ? "Select source" : "Select step";
    const filteredElements: DslMetaModel[] = selectedDsl
        ? [selectedDsl]
        : elements.filter(d => {
            if (selectedToggles.includes('eip') && d.navigation === 'eip') return true
            else if (selectedToggles.includes('components') && d.navigation === 'component') return true
            else if (selectedToggles.includes('kamelets') && d.navigation === 'kamelet') {
                if (customOnly) {
                    return KameletApi.getCustomKameletNames().includes(d.name) || KameletApi.getProjectKameletNames().includes(d.name);
                } else {
                    return true;
                }
            } else return false;
        })
            .filter(d => CamelUi.checkFilter(d, filter));

    const eCount = filteredElements.filter(e => e.navigation === 'eip').length;
    const cCount = filteredElements.filter(e => e.navigation === 'component').length;
    const kCount = filteredElements.filter(e => e.navigation === 'kamelet').length;

    const fElementCount = filteredElements.length;
    const moreElements = fElementCount > pageSize ? fElementCount - pageSize : 0;

    const fastElements: DslMetaModel[] = selectedDsl
        ? [selectedDsl]
        : elements.filter((d: DslMetaModel) => {
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
            position="top"
            isOpen={showSelector}
            onClose={() => close()}
            elementToFocus='#modal-special-focus'
        >
            <ModalHeader>
                {getHeader()}
            </ModalHeader>
            <ModalBody>
                {!ready && [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i =>
                    <React.Fragment key={i}>
                        <Skeleton key={i} width={i * 10 + '%'} screenreaderText="Loading..."/>
                        <br/>
                    </React.Fragment>)
                }
                {!showProperties &&
                    <Gallery key={"fast-gallery"} hasGutter className="dsl-gallery" minWidths={{default: '150px'}}>
                        {showSelector && fastElements.map((dsl: DslMetaModel, index: number) =>
                            <DslFastCard key={dsl.name + ":" + index} dsl={dsl} index={index} onDslSelect={dslCardClick} onDeleteFast={deleteFast}/>
                        )}
                    </Gallery>
                }
                {!showProperties &&
                    <Gallery key={"gallery"} hasGutter className="dsl-gallery" minWidths={{default: '200px'}}>
                        {showSelector && filteredElements.slice(0, pageSize).map((dsl: DslMetaModel, index: number) =>
                            <DslCard key={dsl.name + ":" + index} dsl={dsl} index={index} onDslCardClick={dslCardClick}/>
                        )}
                        {moreElements > 0 &&
                            <Card isCompact isPlain style={{minHeight: '140px'}}>
                                <Bullseye>
                                    <Button variant='link'
                                            onClick={_ => setPageSize(pageSize + 10)}>{`${moreElements} more`}</Button>
                                </Bullseye>
                            </Card>
                        }
                    </Gallery>
                }
                {showProperties && selectedDsl &&
                    <Bullseye>
                        <DslCard key={selectedDsl.name} dsl={selectedDsl} index={0} onDslCardClick={dslCardClick}/>
                    </Bullseye>
                }

            </ModalBody>
            <ModalFooter className="dsl-footer">
                <Button variant={selectedDsl ? 'tertiary' : 'primary'} onClick={_ => close()}>Close</Button>
                {showProperties && selectedDsl && <Button variant='secondary' onClick={_ => setSelectedDsl(undefined)}>Back</Button>}
                {showProperties && selectedDsl && <Button variant='primary' onClick={_ => afterSelect(selectedDsl)}>Select</Button>}
            </ModalFooter>
        </Modal>
    )
}