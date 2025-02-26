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
    Text,
    Title,
    TextVariants,
    ExpandableSection,
    Dropdown,
    MenuToggleElement,
    MenuToggle,
    DropdownList,
    DropdownItem, Flex, Popover, FlexItem, Badge, ClipboardCopy,
    Switch, Tooltip, Label, Button,
} from '@patternfly/react-core';
import './DslProperties.css';
import "@patternfly/patternfly/patternfly.css";
import {CamelUi} from "../utils/CamelUi";
import {useDesignerStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";
import {usePropertiesHook} from "./usePropertiesHook";
import {CamelDisplayUtil} from "karavan-core/lib/api/CamelDisplayUtil";
import EllipsisVIcon from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";
import {CamelMetadataApi} from "karavan-core/lib/model/CamelMetadata";
import {useRouteDesignerHook} from "../route/useRouteDesignerHook";

interface Props {
    designerType: 'routes' | 'rest' | 'beans'
}

export function PropertiesHeader(props: Props) {

    const {saveAsRoute, convertStep, onPropertyChange} = usePropertiesHook(props.designerType);
    const {openSelectorToReplaceFrom} = useRouteDesignerHook();

    const [selectedStep, dark] = useDesignerStore((s) => [s.selectedStep, s.dark], shallow)

    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);
    const [isHeadersExpanded, setIsHeadersExpanded] = useState<boolean>(false);
    const [isExchangePropertiesExpanded, setIsExchangePropertiesExpanded] = useState<boolean>(false);
    const [isMenuOpen, setMenuOpen] = useState<boolean>(false);
    const [stepIsPoll, setStepIsPoll] = React.useState(false);
    const [stepDynamic, setStepDynamic] = React.useState(false);

    useEffect(() => {
        setStepDynamic(selectedStep?.dslName === 'ToDynamicDefinition')
        setStepIsPoll(selectedStep?.dslName === 'PollDefinition')
    }, [])

    useEffect(() => {
        setMenuOpen(false)
    }, [selectedStep])

    function getHeaderMenu(): React.JSX.Element {
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

    function getExchangePropertiesSection(): React.JSX.Element {
        return (
            <ExpandableSection toggleText='Exchange Properties'
                               onToggle={(_event, isExpanded) => setIsExchangePropertiesExpanded(!isExchangePropertiesExpanded)}
                               isExpanded={isExchangePropertiesExpanded}>
                <Flex className='component-headers' direction={{default: "column"}}>
                    {exchangeProperties.map((header, index, array) =>
                        <Flex key={index}>
                            <ClipboardCopy key={index} hoverTip="Copy" clickTip="Copied" variant="inline-compact"
                                           isCode>
                                {header.name}
                            </ClipboardCopy>
                            <FlexItem align={{default: 'alignRight'}}>
                                <Popover
                                    position={"left"}
                                    headerContent={header.name}
                                    bodyContent={header.description}
                                    footerContent={
                                        <Flex>
                                            <Text component={TextVariants.p}>{header.javaType}</Text>
                                            <FlexItem align={{default: 'alignRight'}}>
                                                <Badge isRead>{header.label}</Badge>
                                            </FlexItem>
                                        </Flex>
                                    }
                                >
                                    <button type="button" aria-label="More info" onClick={e => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }} className="pf-v5-c-form__group-label-help">
                                        <HelpIcon/>
                                    </button>
                                </Popover>
                            </FlexItem>
                        </Flex>
                    )}
                </Flex>
            </ExpandableSection>
        )
    }

    function getComponentHeadersSection(): React.JSX.Element {
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
                                        position={"left"}
                                        headerContent={header.name}
                                        bodyContent={header.description}
                                        footerContent={
                                            <Flex>
                                                <Text component={TextVariants.p}>{header.javaType}</Text>
                                                <FlexItem align={{default: 'alignRight'}}>
                                                    <Badge isRead>{header.group}</Badge>
                                                </FlexItem>
                                            </Flex>
                                        }
                                    >
                                        <button type="button" aria-label="More info" onClick={e => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }} className="pf-v5-c-form__group-label-help">
                                            <HelpIcon/>
                                        </button>
                                    </Popover>
                                </FlexItem>
                            </Flex>
                        )}
                </Flex>
            </ExpandableSection>
        )
    }

    function getDescriptionSection(): React.JSX.Element {
        return (
            <ExpandableSection toggleText={isDescriptionExpanded ? 'Show less' : 'Show more'}
                               onToggle={(_event, isExpanded) => setIsDescriptionExpanded(!isDescriptionExpanded)}
                               isExpanded={isDescriptionExpanded}>
                {descriptionLines.filter((value, index) => index > 0)
                    .map((desc, index, array) => <Text key={index} component={TextVariants.p}>{desc}</Text>)}
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
    const showSwitchers = !isFrom && selectedStep !== undefined && ['ToDefinition', 'PollDefinition', 'ToDynamicDefinition'].includes(selectedStep?.dslName);

    function changeStepType(poll: boolean, dynamic: boolean) {
        if (selectedStep) {
            if  (poll) {
                convertStep(selectedStep, 'PollDefinition');
                setStepIsPoll(true);
                setStepDynamic(false);
            } else if (dynamic) {
                convertStep(selectedStep, 'ToDynamicDefinition');
                setStepIsPoll(false);
                setStepDynamic(true);
            } else {
                convertStep(selectedStep, 'ToDefinition');
                setStepIsPoll(false);
                setStepDynamic(false);
            }
        }
    }

    function getStepTypeSwitch() {
        const pollSupported = !component?.component.producerOnly;
        return (<div style={{display: 'flex', flexDirection: 'row', justifyContent: 'end', width: '100%', gap: '10px'}}>
                <Tooltip content='Send messages to a dynamic endpoint evaluated on-demand' position='top-end'>
                    <Switch
                        id="step-type-dynamic"
                        label="Dynamic"
                        isChecked={stepDynamic}
                        onChange={(event, checked) => {
                            changeStepType(stepIsPoll, checked)
                        }}
                        ouiaId="step-type-switch"
                        isDisabled={stepIsPoll}
                        isReversed
                    />
                </Tooltip>
                {pollSupported && !isKamelet &&
                    <Tooltip content='Simple Polling Consumer to obtain the additional data' position='top-end'>
                        <Switch
                            id="step-type-poll"
                            label="Poll"
                            isChecked={stepIsPoll}
                            onChange={(event, checked) => {
                                changeStepType(checked, stepDynamic)
                            }}
                            ouiaId="step-type-switch"
                            isDisabled={stepDynamic}
                            isReversed
                        />
                    </Tooltip>
                }
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

    return (
        <div className="headers">
            <div className="top">
                <Title headingLevel="h1" size="md">{title}</Title>
                {getIdInput()}
                {getHeaderMenu()}
                {showSwitchers && getStepTypeSwitch()}
            </div>
            <Text component={TextVariants.p}>{descriptionLines.at(0)}</Text>
            {descriptionLines.length > 1 && getDescriptionSection()}
            {headers.length > 0 && getComponentHeadersSection()}
            {exchangeProperties.length > 0 && getExchangePropertiesSection()}
        </div>
    )
}
