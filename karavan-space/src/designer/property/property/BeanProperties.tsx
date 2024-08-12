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
    TextInput, Button, Tooltip, Popover, InputGroup, InputGroupItem, capitalize,
} from '@patternfly/react-core';
import '../../karavan.css';
import "@patternfly/patternfly/patternfly.css";
import {
    BeanFactoryDefinition,
} from "karavan-core/lib/model/CamelDefinition";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {SensitiveKeys} from "karavan-core/lib/model/CamelMetadata";
import {v4 as uuidv4} from "uuid";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import AddIcon from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";
import {InfrastructureSelector} from "./InfrastructureSelector";
import {InfrastructureAPI} from "../../utils/InfrastructureAPI";
import ShowIcon from "@patternfly/react-icons/dist/js/icons/eye-icon";
import HideIcon from "@patternfly/react-icons/dist/js/icons/eye-slash-icon";
import DockerIcon from "@patternfly/react-icons/dist/js/icons/docker-icon";
import {useDesignerStore} from "../../DesignerStore";
import {shallow} from "zustand/shallow";
import {KubernetesIcon} from "../../icons/ComponentIcons";


interface Props {
    type: 'constructors' | 'properties'
    onChange: (bean: BeanFactoryDefinition) => void
    onClone: (bean: BeanFactoryDefinition) => void
}

export function BeanProperties (props: Props) {

    const [selectedStep] = useDesignerStore((s) => [s.selectedStep], shallow);
    const [infrastructureSelector, setInfrastructureSelector] = useState<boolean>(false);
    const [infrastructureSelectorProperty, setInfrastructureSelectorProperty] = useState<string | undefined>(undefined);
    const [infrastructureSelectorUuid, setInfrastructureSelectorUuid] = useState<string | undefined>(undefined);
    const [properties, setProperties] = useState<Map<string, [string, string, boolean]>>(new Map<string, [string, string, boolean]>());
    const [constructors, setConstructors] = useState<Map<string, [number, string, boolean]>>(new Map<string, [number, string, boolean]>());

    useEffect(()=> {
        setProperties(preparePropertiesMap((selectedStep as BeanFactoryDefinition)?.properties))
        setConstructors(prepareConstructorsMap((selectedStep as BeanFactoryDefinition)?.constructors))
    }, [selectedStep?.uuid])

    function preparePropertiesMap (properties: any): Map<string, [string, string, boolean]>  {
        const result = new Map<string, [string, string, boolean]>();
        if (properties) {
            Object.keys(properties).forEach((k, i, a) => result.set(uuidv4(), [k, properties[k], false]));
        }
        return result;
    }

    function prepareConstructorsMap (constructors: any): Map<string, [number, string, boolean]>  {
        const result = new Map<string, [number, string, boolean]>();
        if (constructors) {
            Object.keys(constructors).forEach((k, i, a) => result.set(uuidv4(), [parseInt(k), constructors[k], false]));
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

    function propertyChanged (uuid: string, key: string, value: string, showPassword: boolean)  {
        setProperties(prevState => {
            prevState.set(uuid, [key, value, showPassword]);
            return prevState;
        });
        onBeanPropertyUpdate();
    }

    function constructorChanged (uuid: string, key: number, value: string, showPassword: boolean)  {
        setConstructors(prevState => {
            prevState.set(uuid, [key, value, showPassword]);
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

    function selectInfrastructure (value: string)  {
        const propertyId = infrastructureSelectorProperty;
        const uuid = infrastructureSelectorUuid;
        if (propertyId && uuid){
            if (value.startsWith("config") || value.startsWith("secret")) value = "{{" + value + "}}";
            propertyChanged(uuid, propertyId, value, false);
            setInfrastructureSelector(false);
            setInfrastructureSelectorProperty(undefined);
        }
    }

    function openInfrastructureSelector (uuid: string, propertyName: string)  {
        setInfrastructureSelector(true);
        setInfrastructureSelectorProperty(propertyName);
        setInfrastructureSelectorUuid(uuid);
    }

    function closeInfrastructureSelector ()  {
        setInfrastructureSelector(false);
    }

    function getInfrastructureSelectorModal() {
        return (
            <InfrastructureSelector
                dark={false}
                isOpen={infrastructureSelector}
                onClose={() => closeInfrastructureSelector()}
                onSelect={selectInfrastructure}/>)
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
                    const showPassword = v[1][2];
                    const isSecret = false;
                    return (
                        <div key={"key-" + i} className="bean-property">
                            <TextInput placeholder="Argument Index" className="text-field" isRequired type="text" id={"key-" + i}
                                       name={"key-" + i} value={key}
                                       onChange={(_, beanFieldName) => {
                                           constructorChanged(i, parseInt(beanFieldName) , value, showPassword)
                                       }}/>
                            <InputGroup>
                                <InputGroupItem isFill>
                                    <TextInput
                                        placeholder="Argument Value"
                                        type={isSecret && !showPassword ? "password" : "text"}
                                        autoComplete="off"
                                        className="text-field"
                                        isRequired
                                        id={"value-" + i}
                                        name={"value-" + i}
                                        value={value}
                                        onChange={(_, value) => {
                                            constructorChanged(i, key, value, showPassword)
                                        }}/>
                                </InputGroupItem>
                                {isSecret && <Tooltip position="bottom-end" content={showPassword ? "Hide" : "Show"}>
                                    <Button variant="control" onClick={e => constructorChanged(i, key, value, !showPassword)}>
                                        {showPassword ? <ShowIcon/> : <HideIcon/>}
                                    </Button>
                                </Tooltip>}
                            </InputGroup>
                            <Button variant="link" className="delete-button" onClick={e => constructorDeleted(i)}>
                                <DeleteIcon/>
                            </Button>
                        </div>
                    )
                })}
                <Button variant="link" className="add-button" onClick={e => constructorChanged(uuidv4(), constructors.size, '', false)}>
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
                    const showPassword = v[1][2];
                    const isSecret = key !== undefined && SensitiveKeys.includes(key.toLowerCase());
                    const inInfrastructure = InfrastructureAPI.infrastructure !== 'local';
                    const icon = InfrastructureAPI.infrastructure === 'kubernetes' ? KubernetesIcon("infra-button"): <DockerIcon/>
                    return (
                        <div key={"key-" + i} className="bean-property">
                            <TextInput placeholder="Bean Field Name" className="text-field" isRequired type="text" id={"key-" + i}
                                       name={"key-" + i} value={key}
                                       onChange={(_, beanFieldName) => {
                                           propertyChanged(i, beanFieldName, value, showPassword)
                                       }}/>
                            <InputGroup>
                                {inInfrastructure &&
                                    <Tooltip position="bottom-end" content={"Select from " + capitalize(InfrastructureAPI.infrastructure)}>
                                        <Button variant="control" onClick={e => openInfrastructureSelector(i, key)}>
                                            {icon}
                                        </Button>
                                    </Tooltip>}
                                <InputGroupItem isFill>
                                    <TextInput
                                        placeholder="Bean Field Value"
                                        type={isSecret && !showPassword ? "password" : "text"}
                                        autoComplete="off"
                                        className="text-field"
                                        isRequired
                                        id={"value-" + i}
                                        name={"value-" + i}
                                        value={value}
                                        onChange={(_, value) => {
                                            propertyChanged(i, key, value, showPassword)
                                        }}/>
                                </InputGroupItem>
                                {isSecret && <Tooltip position="bottom-end" content={showPassword ? "Hide" : "Show"}>
                                    <Button variant="control" onClick={e => propertyChanged(i, key, value, !showPassword)}>
                                        {showPassword ? <ShowIcon/> : <HideIcon/>}
                                    </Button>
                                </Tooltip>}
                            </InputGroup>
                            <Button variant="link" className="delete-button" onClick={e => propertyDeleted(i)}><DeleteIcon/></Button>
                        </div>
                    )
                })}
                <Button variant="link" className="add-button" onClick={e => propertyChanged(uuidv4(), '', '', false)}>
                    <AddIcon/>Add property</Button>
            </>
        )
    }

    const bean = (selectedStep as BeanFactoryDefinition);
    return (
        <div className='properties' key={bean ? bean.uuid : 'integration'}>
            {props.type === 'constructors' && getBeanConstructors()}
            {props.type === 'properties' && getBeanProperties()}
            {getInfrastructureSelectorModal()}
        </div>
    )
}
