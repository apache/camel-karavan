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
    FormGroup,
    TextInput, Button, Title, Tooltip, Popover, InputGroup, InputGroupItem,
} from '@patternfly/react-core';
import '../karavan.css';
import "@patternfly/patternfly/patternfly.css";
import {
    RegistryBeanDefinition,
} from "karavan-core/lib/model/CamelDefinition";
import {Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {SensitiveKeys} from "karavan-core/lib/model/CamelMetadata";
import {v4 as uuidv4} from "uuid";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import AddIcon from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import CloneIcon from '@patternfly/react-icons/dist/esm/icons/clone-icon'
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";
import {InfrastructureSelector} from "../route/property/InfrastructureSelector";
import KubernetesIcon from "@patternfly/react-icons/dist/js/icons/openshift-icon";
import {InfrastructureAPI} from "../utils/InfrastructureAPI";
import ShowIcon from "@patternfly/react-icons/dist/js/icons/eye-icon";
import HideIcon from "@patternfly/react-icons/dist/js/icons/eye-slash-icon";
import DockerIcon from "@patternfly/react-icons/dist/js/icons/docker-icon";
import {useDesignerStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";
import {IntegrationHeader} from "../utils/IntegrationHeader";


interface Props {
    integration: Integration
    dark: boolean
    onChange: (bean: RegistryBeanDefinition) => void
    onClone: (bean: RegistryBeanDefinition) => void
}

export function BeanProperties (props: Props) {

    const [selectedStep] = useDesignerStore((s) => [s.selectedStep], shallow);
    const [infrastructureSelector, setInfrastructureSelector] = useState<boolean>(false);
    const [infrastructureSelectorProperty, setInfrastructureSelectorProperty] = useState<string | undefined>(undefined);
    const [infrastructureSelectorUuid, setInfrastructureSelectorUuid] = useState<string | undefined>(undefined);
    const [properties, setProperties] = useState<Map<string, [string, string, boolean]>>(new Map<string, [string, string, boolean]>());

    useEffect(()=> {
        setProperties(preparePropertiesMap((selectedStep as RegistryBeanDefinition)?.properties))
    }, [selectedStep?.uuid])

    function preparePropertiesMap (properties: any): Map<string, [string, string, boolean]>  {
        const result = new Map<string, [string, string, boolean]>();
        if (properties) {
            Object.keys(properties).forEach((k, i, a) => result.set(uuidv4(), [k, properties[k], false]));
        }
        return result;
    }

    function onBeanPropertyUpdate ()  {
        if (selectedStep) {
            const bean = CamelUtil.cloneBean(selectedStep);
            const beanProperties: any = {};
            properties.forEach((p: any) => beanProperties[p[0]] = p[1]);
            bean.properties = beanProperties;
            props.onChange(bean);
        }
    }

    function beanFieldChanged (fieldId: string, value: string) {
        if (selectedStep) {
            const bean = CamelUtil.cloneBean(selectedStep);
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

    function propertyDeleted (uuid: string)  {
        setProperties(prevState => {
            prevState.delete(uuid);
            return prevState;
        })
        onBeanPropertyUpdate();
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
            const bean = CamelUtil.cloneBean(selectedStep);
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
    function getBeanForm() {
        const bean = (selectedStep as RegistryBeanDefinition);
        return (
            <>
                <div className="headers">
                    <div className="top">
                        <Title headingLevel="h1" size="md">Bean</Title>
                        <Tooltip content="Clone bean" position="bottom">
                            <Button variant="link" onClick={() => cloneBean()} icon={<CloneIcon/>}/>
                        </Tooltip>
                    </div>
                </div>
                <FormGroup label="Name" fieldId="name" isRequired labelIcon={getLabelIcon("Name", "Bean name used as a reference ex: myBean")}>
                    <TextInput className="text-field" isRequired type="text" id="name" name="name" value={bean?.name}
                                onChange={(_, value)=> beanFieldChanged("name", value)}/>
                </FormGroup>
                <FormGroup label="Type" fieldId="type" isRequired labelIcon={getLabelIcon("Type", "Bean class Canonical Name ex: org.demo.MyBean")}>
                    <TextInput className="text-field" isRequired type="text" id="type" name="type" value={bean?.type}
                        onChange={(_, value) => beanFieldChanged("type", value)}/>
                </FormGroup>
                <FormGroup label="Properties" fieldId="properties" className="bean-properties">
                    {Array.from(properties.entries()).map((v, index, array) => {
                        const i = v[0];
                        const key = v[1][0];
                        const value = v[1][1];
                        const showPassword = v[1][2];
                        const isSecret = key !== undefined && SensitiveKeys.includes(key.toLowerCase());
                        const inInfrastructure = InfrastructureAPI.infrastructure !== 'local';
                        const icon = InfrastructureAPI.infrastructure === 'kubernetes' ? <KubernetesIcon/> : <DockerIcon/>
                        return (
                            <div key={"key-" + i} className="bean-property">
                                <TextInput placeholder="Bean Field Name" className="text-field" isRequired type="text" id={"key-" + i}
                                           name={"key-" + i} value={key}
                                            onChange={(_, beanFieldName) => {
                                                propertyChanged(i, beanFieldName, value, showPassword)
                                            }}/>
                                <InputGroup>
                                    {inInfrastructure &&
                                        <Tooltip position="bottom-end" content="Select value from Infrastructure">
                                        <Button variant="control" onClick={e => openInfrastructureSelector(i, key)}>
                                            {icon}
                                        </Button>
                                    </Tooltip>}
                                    <InputGroupItem isFill>
                                        <TextInput
                                            placeholder="Bean Field Value"
                                            type={isSecret && !showPassword ? "password" : "text"}
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
                </FormGroup>
            </>
        )
    }

    const bean = (selectedStep as RegistryBeanDefinition);
    return (
        <div className='properties' key={bean ? bean.uuid : 'integration'}>
            <Form autoComplete="off" onSubmit={event => event.preventDefault()}>
                {bean === undefined && <IntegrationHeader/>}
                {bean !== undefined && getBeanForm()}
            </Form>
            {getInfrastructureSelectorModal()}
        </div>
    )
}
