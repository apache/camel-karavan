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
    InputGroup,
    InputGroupItem,
    Popover,
    TextInput, TextInputGroup, TextInputGroupMain, TextInputGroupUtilities,
    Tooltip,
    ValidatedOptions,
} from '@patternfly/react-core';
import './BeanProperties.css';
import "@patternfly/patternfly/patternfly.css";
import {BeanFactoryDefinition,} from "karavan-core/lib/model/CamelDefinition";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {SensitiveKeys} from "karavan-core/lib/model/CamelMetadata";
import {v4 as uuidv4} from "uuid";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import AddIcon from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";
import {ConfigurationSelectorModal} from "./ConfigurationSelectorModal";
import {InfrastructureAPI} from "../../utils/InfrastructureAPI";
import DockerIcon from "@patternfly/react-icons/dist/js/icons/docker-icon";
import {useDesignerStore} from "../../DesignerStore";
import {shallow} from "zustand/shallow";
import {KubernetesIcon} from "../../icons/ComponentIcons";
import {isSensitiveFieldValid} from "../../utils/ValidatorUtils";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import CogIcon from "@patternfly/react-icons/dist/js/icons/cog-icon";

interface Props {
    type: 'constructors' | 'properties'
    onChange: (bean: BeanFactoryDefinition) => void
    onClone: (bean: BeanFactoryDefinition) => void
    expressionEditor: React.ComponentType<any>
}

export function BeanProperties (props: Props) {

    const [selectedStep] = useDesignerStore((s) => [s.selectedStep], shallow);
    const [configurationSelector, setConfigurationSelector] = useState<boolean>(false);
    const [configurationSelectorProperty, setConfigurationSelectorProperty] = useState<string | undefined>(undefined);
    const [configurationSelectorUuid, setConfigurationSelectorUuid] = useState<string | undefined>(undefined);
    const [properties, setProperties] = useState<Map<string, [string, string]>>(new Map<string, [string, string]>());
    const [constructors, setConstructors] = useState<Map<string, [number, string]>>(new Map<string, [number, string]>());

    useEffect(()=> {
        setProperties(preparePropertiesMap((selectedStep as BeanFactoryDefinition)?.properties))
        setConstructors(prepareConstructorsMap((selectedStep as BeanFactoryDefinition)?.constructors))
    }, [selectedStep?.uuid])

    function preparePropertiesMap (properties: any): Map<string, [string, string]>  {
        const result = new Map<string, [string, string]>();
        if (properties) {
            Object.keys(properties).forEach((k, i, a) => result.set(uuidv4(), [k, properties[k]]));
        }
        return result;
    }

    function prepareConstructorsMap (constructors: any): Map<string, [number, string]>  {
        const result = new Map<string, [number, string]>();
        if (constructors) {
            Object.keys(constructors).forEach((k, i, a) => result.set(uuidv4(), [parseInt(k), constructors[k]]));
        }
        return result;
    }

    function onBeanPropertyUpdate ()  {
        if (selectedStep) {
            const bean = CamelUtil.cloneBean(selectedStep as BeanFactoryDefinition);
            const beanProperties: any = {};
            properties.forEach((p: any) => beanProperties[p[0]] = p[1]);
            bean.properties = beanProperties;
            props.onChange(bean);
        }
    }

    function onBeanConstructorsUpdate ()  {
        if (selectedStep) {
            const bean = CamelUtil.cloneBean(selectedStep as BeanFactoryDefinition);
            const beanConstructors: any = {};
            constructors.forEach((p: any) => beanConstructors[p[0]] = p[1]);
            bean.constructors = beanConstructors;
            props.onChange(bean);
        }
    }

    function beanFieldChanged (fieldId: string, value: string) {
        if (selectedStep) {
            const bean = CamelUtil.cloneBean(selectedStep as BeanFactoryDefinition);
            (bean as any)[fieldId] = value;
            props.onChange(bean);
        }
    }

    function propertyChanged (uuid: string, key: string, value: string)  {
        setProperties(prevState => {
            prevState.set(uuid, [key, value]);
            return prevState;
        });
        onBeanPropertyUpdate();
    }

    function constructorChanged (uuid: string, key: number, value: string)  {
        setConstructors(prevState => {
            prevState.set(uuid, [key, value]);
            return prevState;
        });
        onBeanConstructorsUpdate();
    }

    function propertyDeleted (uuid: string)  {
        setProperties(prevState => {
            prevState.delete(uuid);
            return prevState;
        })
        onBeanPropertyUpdate();
    }

    function constructorDeleted (uuid: string)  {
        setConstructors(prevState => {
            prevState.delete(uuid);
            return prevState;
        })
        onBeanConstructorsUpdate();
    }

    function selectConfiguration (value: string)  {
        const propertyId = configurationSelectorProperty;
        const uuid = configurationSelectorUuid;
        if (propertyId && uuid){
            if (value.startsWith("config") || value.startsWith("secret")) value = "{{" + value + "}}";
            propertyChanged(uuid, propertyId, value);
            setConfigurationSelector(false);
            setConfigurationSelectorProperty(undefined);
        }
    }

    function openConfigurationSelector (uuid: string, propertyName: string)  {
        setConfigurationSelector(true);
        setConfigurationSelectorProperty(propertyName);
        setConfigurationSelectorUuid(uuid);
    }

    function closeConfigurationSelector ()  {
        setConfigurationSelector(false);
    }

    function getConfigurationSelectorModal() {
        return (
            configurationSelector && <ConfigurationSelectorModal
                dark={false}
                isOpen={configurationSelector}
                onClose={() => closeConfigurationSelector()}
                name={'configurationSelectorProperty'}
                customCode={undefined}
                defaultTabIndex={'properties'}
                dslLanguage={undefined}
                hideEditor={true}
                title={'' + configurationSelectorProperty}
                onSave={(fieldId, value1) => {
                    selectConfiguration(value1)
                    closeConfigurationSelector();
                }}
                expressionEditor={props.expressionEditor}
                onSelect={selectConfiguration}/>)
    }

    function getOpenConfigButton(uuid: string, propertyName: string) {
        return (
            <Tooltip position="bottom-end" content="Open config selector">
                <Button variant="control" className='open-config-buton' onClick={e => {
                    openConfigurationSelector(uuid, propertyName)
                }}>
                    <CogIcon style={{fill: 'var(--pf-v5-global--Color--200)'}}/>
                </Button>
            </Tooltip>
        )
    }

    function cloneBean ()  {
        if (selectedStep) {
            const bean = CamelUtil.cloneBean(selectedStep as BeanFactoryDefinition);
            bean.uuid = uuidv4();
            props.onClone(bean);
        }
    }

    function getLabelIcon (displayName: string, description: string)  {
        return (
            <Popover
                position={"left"}
                headerContent={displayName}
                bodyContent={description}
                footerContent={
                    <div>
                        <b>Required</b>
                    </div>
                }>
                <button type="button" aria-label="More info" onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                }} className="pf-v5-c-form__group-label-help">
                    <HelpIcon />
                </button>
            </Popover>
        )
    }

    function getBeanConstructors() {
        return (
            <>
                {Array.from(constructors.entries()).map((v, index, array) => {
                    const i = v[0];
                    const key = v[1][0];
                    const value = v[1][1];
                    const isSecret = false;
                    return (
                        <div key={"key-" + i} className="bean-property">
                            <TextInput placeholder="Argument Index" className="text-field argument-name" isRequired type="text" id={"key-" + i}
                                       name={"key-" + i} value={key}
                                       onChange={(_, beanFieldName) => {
                                           constructorChanged(i, parseInt(beanFieldName) , value)
                                       }}/>
                            <InputGroup className="text-field argument-value">
                                <InputGroupItem isFill>
                                    <TextInput
                                        placeholder="Argument Value"
                                        type='text'
                                        autoComplete="off"
                                        className="text-field"
                                        isRequired
                                        id={"value-" + i}
                                        name={"value-" + i}
                                        value={value}
                                        onChange={(_, value) => {
                                            constructorChanged(i, key, value)
                                        }}/>
                                </InputGroupItem>
                            </InputGroup>
                            <Button variant="link" className="delete-button" onClick={e => constructorDeleted(i)}>
                                <DeleteIcon/>
                            </Button>
                        </div>
                    )
                })}
                <Button variant="link" className="add-button" onClick={e => constructorChanged(uuidv4(), constructors.size, '')}>
                    <AddIcon/>Add argument</Button>
            </>
        )
    }

    function getBeanProperties() {
        return (
            <>
                {Array.from(properties.entries()).map((v, index, array) => {
                    const i = v[0];
                    const key = v[1][0];
                    const value = v[1][1];
                    const isSecret = key !== undefined && SensitiveKeys.includes(key.toLowerCase());
                    const validated = (isSecret && !isSensitiveFieldValid(value)) ? ValidatedOptions.error : ValidatedOptions.default;
                    const inInfrastructure = InfrastructureAPI.infrastructure !== 'local';
                    const icon = InfrastructureAPI.infrastructure === 'kubernetes' ? KubernetesIcon("infra-button"): <DockerIcon/>
                    return (
                        <div key={"key-" + i} className="bean-property">
                            <TextInput placeholder="Bean Field Name" className="text-field field-name" isRequired type="text" id={"key-" + i}
                                       name={"key-" + i} value={key}
                                       onChange={(_, beanFieldName) => {
                                           propertyChanged(i, beanFieldName, value)
                                       }}/>
                            <InputGroup className='field-value'>
                                <TextInputGroup className='text-field'>
                                    <TextInputGroupMain
                                        placeholder="Bean Field Value"
                                        type='text'
                                        autoComplete="off"
                                        className="text-field"
                                        id={"value-" + i}
                                        name={"value-" + i}
                                        value={value}
                                        onBlur={_ => propertyChanged(i, key, value)}
                                        onChange={(_, v) => {
                                            propertyChanged(i, key, v)
                                        }}
                                    />
                                    <TextInputGroupUtilities>
                                        <Button variant="plain" className='button-clear' onClick={_ => {
                                            propertyChanged(i, key,'');
                                        }}>
                                            <TimesIcon aria-hidden={true}/>
                                        </Button>
                                    </TextInputGroupUtilities>
                                </TextInputGroup>
                                <InputGroupItem className=''>
                                    {getOpenConfigButton(i, key)}
                                </InputGroupItem>
                            </InputGroup>
                            {/*<InputGroup>*/}
                            {/*    {inInfrastructure &&*/}
                            {/*        <Tooltip position="bottom-end" content={'Select from ' + capitalize(InfrastructureAPI.infrastructure)}>*/}
                            {/*            <Button variant="control" onClick={e => openConfigurationSelector(i, key)}>*/}
                            {/*                {icon}*/}
                            {/*            </Button>*/}
                            {/*        </Tooltip>}*/}
                            {/*    <InputGroupItem isFill>*/}
                            {/*        <TextInput*/}
                            {/*            placeholder="Bean Field Value"*/}
                            {/*            type='text'*/}
                            {/*            autoComplete="off"*/}
                            {/*            className="text-field"*/}
                            {/*            isRequired*/}
                            {/*            validated={validated}*/}
                            {/*            id={"value-" + i}*/}
                            {/*            name={"value-" + i}*/}
                            {/*            value={value}*/}
                            {/*            onChange={(_, value) => {*/}
                            {/*                propertyChanged(i, key, value)*/}
                            {/*            }}/>*/}
                            {/*    </InputGroupItem>*/}
                            {/*</InputGroup>*/}
                            <Button variant="link" className="delete-button" onClick={e => propertyDeleted(i)}><DeleteIcon/></Button>
                        </div>
                    )
                })}
                <Button variant="link" className="add-button" onClick={e => propertyChanged(uuidv4(), '', '')}>
                    <AddIcon/>Add property</Button>
            </>
        )
    }

    const bean = (selectedStep as BeanFactoryDefinition);
    return (
        <div className='properties' key={bean ? bean.uuid : 'integration'}>
            {props.type === 'constructors' && getBeanConstructors()}
            {props.type === 'properties' && getBeanProperties()}
            {getConfigurationSelectorModal()}
        </div>
    )
}
