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
import React, {ReactElement, useEffect, useRef, useState} from 'react';
import {
    Badge,
    Button,
    ClipboardCopy,
    Content,
    ContentVariants,
    Dropdown,
    DropdownItem,
    DropdownList,
    ExpandableSection,
    Flex,
    FlexItem,
    FormGroupLabelHelp,
    Label,
    MenuToggle,
    MenuToggleElement,
    Popover,
    Switch,
    Title,
    Tooltip,
} from '@patternfly/react-core';
import './DslProperties.css';
import {CamelUi} from "../utils/CamelUi";
import {useDesignerStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";
import {usePropertiesHook} from "./usePropertiesHook";
import {CamelDisplayUtil} from "core/api/CamelDisplayUtil";
import {EllipsisVIcon} from '@patternfly/react-icons';
import {ComponentApi} from "core/api/ComponentApi";
import {CamelMetadataApi} from "core/model/CamelMetadata";
import {useRouteDesignerHook} from "../route/useRouteDesignerHook";

interface Props {
    designerType: 'routes' | 'rest' | 'beans'
}

export function PropertiesHeader(props: Props) {

    const {saveAsRoute, convertStep, onPropertyChange} = usePropertiesHook(props.designerType);
    const {openSelectorToReplaceFrom} = useRouteDesignerHook();

    const [selectedStep] = useDesignerStore((s) => [s.selectedStep], shallow)

    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);
    const [isHeadersExpanded, setIsHeadersExpanded] = useState<boolean>(false);
    const [isExchangePropertiesExpanded, setIsExchangePropertiesExpanded] = useState<boolean>(false);
    const [isMenuOpen, setMenuOpen] = useState<boolean>(false);
    const [stepIsPoll, setStepIsPoll] = React.useState(false);
    const [stepDynamic, setStepDynamic] = React.useState(false);
    const [stepWireTap, setStepWireTap] = React.useState(false);
    const labelHelpRef = useRef(null);

    useEffect(() => {
        setStepDynamic(selectedStep?.dslName === 'ToDynamicDefinition')
        setStepIsPoll(selectedStep?.dslName === 'PollDefinition')
        setStepWireTap(selectedStep?.dslName === 'WireTapDefinition')
    }, [])

    useEffect(() => {
        setMenuOpen(false)
    }, [selectedStep])

    function getHeaderMenu(): ReactElement {
        const hasSteps = selectedStep?.hasSteps();
        const targetDsl = CamelUi.getConvertTargetDsl(selectedStep?.dslName);
        const targetDslTitle = targetDsl?.replace("Definition", "");
        const showMenu = hasSteps || targetDsl !== undefined;
        return showMenu ?
            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'end', width: '100%'}}>
                <Dropdown
                    popperProps={{position: "end"}}
                    isOpen={isMenuOpen}
                    onSelect={() => {
                    }}
                    onOpenChange={(isOpen: boolean) => setMenuOpen(isOpen)}
                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                            className="header-menu-toggle"
                            ref={toggleRef}
                            aria-label="menu"
                            variant="plain"
                            onClick={() => setMenuOpen(!isMenuOpen)}
                            isExpanded={isMenuOpen}
                        >
                            <EllipsisVIcon/>
                        </MenuToggle>
                    )}
                >
                    <DropdownList>
                        {isFrom &&
                            <DropdownItem key="changeFrom" onClick={(ev) => {
                                ev.preventDefault()
                                openSelectorToReplaceFrom((selectedStep as any).id)
                                setMenuOpen(false);
                            }}>
                                Change From...
                            </DropdownItem>}
                        {hasSteps &&
                            <DropdownItem key="saveStepsRoute" onClick={(ev) => {
                                ev.preventDefault()
                                if (selectedStep) {
                                    saveAsRoute(selectedStep, true);
                                    setMenuOpen(false);
                                }
                            }}>
                                Save Steps to Route
                            </DropdownItem>}
                        {hasSteps && !isFrom &&
                            <DropdownItem key="saveElementRoute" onClick={(ev) => {
                                ev.preventDefault()
                                if (selectedStep) {
                                    saveAsRoute(selectedStep, false);
                                    setMenuOpen(false);
                                }
                            }}>
                                Save Element to Route
                            </DropdownItem>}
                        {targetDsl &&
                            <DropdownItem key="convert"
                                          onClick={(ev) => {
                                              ev.preventDefault()
                                              if (selectedStep) {
                                                  convertStep(selectedStep, targetDsl);
                                                  setMenuOpen(false);
                                              }
                                          }}>
                                Convert to {targetDslTitle}
                            </DropdownItem>}
                    </DropdownList>
                </Dropdown>
            </div>
            : <></>;
    }

    function getExchangePropertiesSection(): ReactElement {
        return (
            <ExpandableSection toggleText='Exchange Properties'
                               onToggle={(_event, isExpanded) => setIsExchangePropertiesExpanded(!isExchangePropertiesExpanded)}
                               isExpanded={isExchangePropertiesExpanded}>
                <Flex className='component-headers' direction={{default: "column"}}>
                    {exchangeProperties.map((header, index, array) =>
                        <div key={index} style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', padding: 0}}>
                            <ClipboardCopy key={index} hoverTip="Copy" clickTip="Copied" variant="inline-compact"
                                           isCode>
                                {header.name}
                            </ClipboardCopy>
                            <Popover
                                position={"left"}
                                headerContent={header.name}
                                bodyContent={header.description}
                                footerContent={
                                    <Flex>
                                        <Content component={ContentVariants.p}>{header.javaType}</Content>
                                        <FlexItem align={{default: 'alignRight'}}>
                                            <Badge isRead>{header.label}</Badge>
                                        </FlexItem>
                                    </Flex>
                                }
                            >
                                <FormGroupLabelHelp aria-label="More info"/>
                            </Popover>
                        </div>
                    )}
                </Flex>
            </ExpandableSection>
        )
    }

    function getComponentHeadersSection(): ReactElement {
        return (
            <ExpandableSection toggleText='Headers'
                               onToggle={(_event, isExpanded) => setIsHeadersExpanded(!isHeadersExpanded)}
                               isExpanded={isHeadersExpanded}>
                <Flex className='component-headers' direction={{default: "column"}}>
                    {headers.filter((header) => groups.includes(header.group))
                        .map((header, index, array) =>
                            <Flex key={index}>
                                <ClipboardCopy key={index} hoverTip="Copy" clickTip="Copied" variant="inline-compact"
                                               isCode>
                                    {header.name}
                                </ClipboardCopy>
                                <FlexItem align={{default: 'alignRight'}}>
                                    <Popover
                                        triggerRef={labelHelpRef}
                                        position={"left"}
                                        headerContent={header.name}
                                        bodyContent={header.description}
                                        footerContent={
                                            <Flex>
                                                <Content component={ContentVariants.p}>{header.javaType}</Content>
                                                <FlexItem align={{default: 'alignRight'}}>
                                                    <Badge isRead>{header.group}</Badge>
                                                </FlexItem>
                                            </Flex>
                                        }
                                    >
                                        <FormGroupLabelHelp ref={labelHelpRef} aria-label="More info"/>
                                    </Popover>
                                </FlexItem>
                            </Flex>
                        )}
                </Flex>
            </ExpandableSection>
        )
    }

    function getDescriptionSection(): ReactElement {
        return (
            <ExpandableSection toggleText={isDescriptionExpanded ? 'Show less' : 'Show more'}
                               onToggle={(_event, isExpanded) => setIsDescriptionExpanded(!isDescriptionExpanded)}
                               isExpanded={isDescriptionExpanded}>
                {descriptionLines.filter((value, index) => index > 0)
                    .map((desc, index, array) => <Content key={index} component={ContentVariants.p}>{desc}</Content>)}
            </ExpandableSection>
        )
    }

    const title = selectedStep && CamelDisplayUtil.getTitle(selectedStep)
    const description = selectedStep && CamelDisplayUtil.getDescription(selectedStep);
    const descriptionLines: string [] = description ? description?.split("\n") : [""];
    const headers = ComponentApi.getComponentHeadersList(selectedStep)
    const exchangeProperties = selectedStep ? CamelMetadataApi.getExchangeProperties(selectedStep.dslName) : [];
    const isFrom = selectedStep?.dslName === 'FromDefinition';
    const isPoll = selectedStep?.dslName === 'PollDefinition';
    const component = ComponentApi.findStepComponent(selectedStep);
    const groups = (isFrom || isPoll) ? ['consumer', 'common'] : ['producer', 'common'];
    const isKamelet = CamelUi.isKamelet(selectedStep);
    const showSwitchers = !isFrom && selectedStep !== undefined && ['ToDefinition', 'PollDefinition', 'ToDynamicDefinition', 'WireTapDefinition']
        .includes(selectedStep?.dslName);

    function changeStepType(poll: boolean, dynamic: boolean, wireTap: boolean) {
        if (selectedStep) {
            if (poll) {
                convertStep(selectedStep, 'PollDefinition');
                setStepIsPoll(true);
                setStepDynamic(false);
                setStepWireTap(false);
            } else if (dynamic) {
                convertStep(selectedStep, 'ToDynamicDefinition');
                setStepIsPoll(false);
                setStepDynamic(true);
                setStepWireTap(false);
            } else if (wireTap) {
                convertStep(selectedStep, 'WireTapDefinition');
                setStepIsPoll(false);
                setStepDynamic(false);
                setStepWireTap(true);
            } else {
                convertStep(selectedStep, 'ToDefinition');
                setStepIsPoll(false);
                setStepDynamic(false);
                setStepWireTap(false);
            }
        }
    }

    function getStepTypeSwitch() {
        const pollSupported = !component?.component.producerOnly;
        return (<div style={{display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', width: '100%', gap: '16px'}}>
                <Tooltip content='Send messages to a dynamic endpoint evaluated on-demand' position='top-end'>
                    <Switch
                        id="step-type-dynamic"
                        className='step-type-switch'
                        label="Dynamic"
                        isChecked={stepDynamic}
                        onChange={(event, checked) => {
                            changeStepType(stepIsPoll, checked, stepWireTap)
                        }}
                        ouiaId="step-type-switch"
                        isDisabled={stepIsPoll || stepWireTap}
                        isReversed
                    />
                </Tooltip>
                {pollSupported && !isKamelet &&
                    <Tooltip content='Simple Polling Consumer to obtain the additional data' position='top-end'>
                        <Switch
                            id="step-type-poll"
                            className='step-type-switch'
                            label="Poll"
                            isChecked={stepIsPoll}
                            onChange={(event, checked) => {
                                changeStepType(checked, stepDynamic, stepWireTap)
                            }}
                            ouiaId="step-type-switch"
                            isDisabled={stepDynamic || stepWireTap}
                            isReversed
                        />
                    </Tooltip>
                }
                <Tooltip content='Copy the original Exchange and route to a separate location' position='top-end'>
                    <Switch
                        id="step-type-wiretap"
                        className='step-type-switch'
                        label="WireTap"
                        isChecked={stepWireTap}
                        onChange={(event, checked) => {
                            changeStepType(stepIsPoll, stepDynamic, checked)
                        }}
                        ouiaId="step-type-switch"
                        isDisabled={stepIsPoll || stepDynamic}
                        isReversed
                    />
                </Tooltip>
            </div>
        )
    }

    function getIdInput() {
        return (
            (selectedStep as any)?.id !== undefined
                ? <Label isEditable color='blue' isCompact onEditComplete={(event, newText) => onPropertyChange("id", newText)}>
                    {(selectedStep as any)?.id || ''}
                </Label>
                : <Button variant="link" onClick={event => onPropertyChange("id", "rc-" + Math.floor(1000 + Math.random() * 9000).toString())}>
                    Add Id
                </Button>
        )
    }

    function getDslDescription() {
        return (
            <div style={{flex: 2, display: 'flex', justifyContent: 'flex-end'}}>
                <Popover position={"left"} bodyContent={description}>
                    <FormGroupLabelHelp style={{padding: 0}} aria-label="More info"/>
                </Popover>
            </div>
        )
    }

    return (
        <div className="headers">
            <div className="top">
                <Title headingLevel="h1" size="md">{title}</Title>
                {getIdInput()}
                {getHeaderMenu()}
                {getDslDescription()}
            </div>
            {/*<Content component={ContentVariants.p}>{descriptionLines.at(0)}</Content>*/}
            {/*{descriptionLines.length > 1 && getDescriptionSection()}*/}
            {showSwitchers && getStepTypeSwitch()}
            {headers.length > 0 && getComponentHeadersSection()}
            {exchangeProperties.length > 0 && getExchangePropertiesSection()}
        </div>
    )
}
