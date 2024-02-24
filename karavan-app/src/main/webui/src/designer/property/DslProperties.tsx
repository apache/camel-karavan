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
    Form,
    Text,
    Title,
    TextVariants,
    ExpandableSection,
    Button,
    Tooltip,
    Dropdown,
    MenuToggleElement,
    MenuToggle,
    DropdownList,
    DropdownItem, Flex, Popover, FlexItem, Badge, ClipboardCopy,
} from '@patternfly/react-core';
import '../karavan.css';
import './DslProperties.css';
import "@patternfly/patternfly/patternfly.css";
import {DataFormatField} from "./property/DataFormatField";
import {DslPropertyField} from "./property/DslPropertyField";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {CamelUi} from "../utils/CamelUi";
import {CamelMetadataApi, DataFormats, PropertyMeta} from "karavan-core/lib/model/CamelMetadata";
import {IntegrationHeader} from "../utils/IntegrationHeader";
import CloneIcon from "@patternfly/react-icons/dist/esm/icons/clone-icon";
import {useDesignerStore, useIntegrationStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";
import {usePropertiesHook} from "./usePropertiesHook";
import {CamelDisplayUtil} from "karavan-core/lib/api/CamelDisplayUtil";
import EllipsisVIcon from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";

interface Props {
    designerType: 'routes' | 'rest' | 'beans'
}

export function DslProperties(props: Props) {

    const [integration] = useIntegrationStore((s) => [s.integration], shallow)

    const {
        saveAsRoute,
        convertStep,
        cloneElement,
        onDataFormatChange,
        onPropertyChange,
        onParametersChange,
        onExpressionChange
    } =
        usePropertiesHook(props.designerType);

    const [selectedStep, dark]
        = useDesignerStore((s) => [s.selectedStep, s.dark], shallow)

    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);
    const [isMenuOpen, setMenuOpen] = useState<boolean>(false);

    useEffect(() => {
        setMenuOpen(false)
    }, [selectedStep])

    function getHeaderMenu(): JSX.Element {
        const hasSteps = selectedStep?.hasSteps();
        const targetDsl = CamelUi.getConvertTargetDsl(selectedStep?.dslName);
        const targetDslTitle = targetDsl?.replace("Definition", "");
        const showMenu = hasSteps || targetDsl !== undefined;
        return showMenu ?
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
                    {hasSteps &&
                        <DropdownItem key="saveRoute" onClick={(ev) => {
                            ev.preventDefault()
                            if (selectedStep) {
                                saveAsRoute(selectedStep, true);
                                setMenuOpen(false);
                            }
                        }}>
                            Save Steps to Route
                        </DropdownItem>}
                    {hasSteps &&
                        <DropdownItem key="saveRoute" onClick={(ev) => {
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
            </Dropdown> : <></>;
    }

    function getRouteHeader(): JSX.Element {
        const title = selectedStep && CamelDisplayUtil.getTitle(selectedStep)
        const description = selectedStep && CamelDisplayUtil.getDescription(selectedStep);
        const descriptionLines: string [] = description ? description?.split("\n") : [""];
        const headers = ComponentApi.getComponentHeadersList(selectedStep)
        const groups = selectedStep?.dslName === 'FromDefinition' ? ['consumer', 'common'] : ['producer', 'common']
        return (
            <div className="headers">
                <div className="top">
                    <Title headingLevel="h1" size="md">{title}</Title>
                    {getHeaderMenu()}
                </div>
                <Text component={TextVariants.p}>{descriptionLines.at(0)}</Text>
                {descriptionLines.length > 1 &&
                    <ExpandableSection toggleText={isDescriptionExpanded ? 'Show less' : 'Show more'}
                                       onToggle={(_event, isExpanded) => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                       isExpanded={isDescriptionExpanded}>
                        {descriptionLines.filter((value, index) => index > 0)
                            .map((desc, index, array) => <Text key={index} component={TextVariants.p}>{desc}</Text>)}
                    </ExpandableSection>}

                {headers.length > 0 &&
                    <ExpandableSection toggleText='Headers'
                                       onToggle={(_event, isExpanded) => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                       isExpanded={isDescriptionExpanded}>
                        <Flex className='component-headers' direction={{default:"column"}}>
                            {headers.filter((header) => groups.includes(header.group))
                                .map((header, index, array) =>
                                    <Flex key={index}>
                                        <ClipboardCopy key={index} hoverTip="Copy" clickTip="Copied" variant="inline-compact" isCode>
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
                    </ExpandableSection>}
            </div>
        )
    }

    function getClonableElementHeader(): JSX.Element {
        const title = selectedStep && CamelDisplayUtil.getTitle(selectedStep);
        const description = selectedStep?.dslName ? CamelMetadataApi.getCamelModelMetadataByClassName(selectedStep?.dslName)?.description : title;
        const descriptionLines: string [] = description ? description?.split("\n") : [""];
        return (
            <div className="headers">
                <div className="top">
                    <Title headingLevel="h1" size="md">{title}</Title>
                    <Tooltip content="Clone element" position="bottom">
                        <Button variant="link" onClick={() => cloneElement()} icon={<CloneIcon/>}/>
                    </Tooltip>
                </div>
                {descriptionLines.map((desc, index, array) => <Text key={index}
                                                                    component={TextVariants.p}>{desc}</Text>)}
            </div>
        )
    }

    function getComponentHeader(): JSX.Element {
        if (props.designerType === 'routes') return getRouteHeader()
        else return getClonableElementHeader();
    }

    function getProperties(): PropertyMeta[] {
        const dslName = selectedStep?.dslName;
        return CamelDefinitionApiExt.getElementProperties(dslName)
            // .filter((p: PropertyMeta) => (showAdvanced && p.label.includes('advanced')) || (!showAdvanced && !p.label.includes('advanced')))
            .filter((p: PropertyMeta) => !p.isObject || (p.isObject && !CamelUi.dslHasSteps(p.type)) || (dslName === 'CatchDefinition' && p.name === 'onWhen'))
            .filter((p: PropertyMeta) => !(dslName === 'RestDefinition' && ['get', 'post', 'put', 'patch', 'delete', 'head'].includes(p.name)));
        // .filter((p: PropertyMeta) => dslName && !(['RestDefinition', 'GetDefinition', 'PostDefinition', 'PutDefinition', 'PatchDefinition', 'DeleteDefinition', 'HeadDefinition'].includes(dslName) && ['param', 'responseMessage'].includes(p.name))) // TODO: configure this properties
    }

    function getPropertyFields(properties: PropertyMeta[]) {
        return (<>
            {properties.map((property: PropertyMeta) =>
                <DslPropertyField key={property.name}
                                  property={property}
                                  element={selectedStep}
                                  value={selectedStep ? (selectedStep as any)[property.name] : undefined}
                                  onExpressionChange={onExpressionChange}
                                  onParameterChange={onParametersChange}
                                  onDataFormatChange={onDataFormatChange}
                                  onPropertyChange={onPropertyChange}
                />
            )}
        </>)
    }

    const dataFormats = DataFormats.map(value => value[0]);
    const dataFormatElement = selectedStep !== undefined && ['MarshalDefinition', 'UnmarshalDefinition'].includes(selectedStep.dslName);
    const properties = !dataFormatElement
        ? getProperties()
        : getProperties().filter(p => !dataFormats.includes(p.name));
    const propertiesMain = properties.filter(p => !p.label.includes("advanced"));
    const propertiesAdvanced = properties.filter(p => p.label.includes("advanced"));
    return (
        <div key={selectedStep ? selectedStep.uuid : 'integration'}
             className='properties'>
            <Form autoComplete="off" onSubmit={event => event.preventDefault()}>
                {selectedStep === undefined && <IntegrationHeader/>}
                {selectedStep && getComponentHeader()}
                {getPropertyFields(propertiesMain)}
                {selectedStep && !['MarshalDefinition', 'UnmarshalDefinition'].includes(selectedStep.dslName)
                    && propertiesAdvanced.length > 0 &&
                    <ExpandableSection
                        toggleText={'EIP advanced properties'}
                        onToggle={(_event, isExpanded) => setShowAdvanced(!showAdvanced)}
                        isExpanded={showAdvanced}>
                        <div className="parameters">
                            {getPropertyFields(propertiesAdvanced)}
                        </div>
                    </ExpandableSection>}
                {selectedStep && ['MarshalDefinition', 'UnmarshalDefinition'].includes(selectedStep.dslName) &&
                    <DataFormatField
                        integration={integration}
                        dslName={selectedStep.dslName}
                        value={selectedStep}
                        onDataFormatChange={onDataFormatChange}
                        dark={dark}/>
                }
            </Form>
        </div>
    )
}
