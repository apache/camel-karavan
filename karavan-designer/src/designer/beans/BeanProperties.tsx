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
import React from 'react';
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
import {IntegrationHeader} from "../utils/KaravanComponents";
import CloneIcon from '@patternfly/react-icons/dist/esm/icons/clone-icon'
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";
import {InfrastructureSelector} from "../route/property/InfrastructureSelector";
import KubernetesIcon from "@patternfly/react-icons/dist/js/icons/openshift-icon";
import {InfrastructureAPI} from "../utils/InfrastructureAPI";
import ShowIcon from "@patternfly/react-icons/dist/js/icons/eye-icon";
import HideIcon from "@patternfly/react-icons/dist/js/icons/eye-slash-icon";
import DockerIcon from "@patternfly/react-icons/dist/js/icons/docker-icon";


interface Props {
    integration: Integration
    bean?: RegistryBeanDefinition
    dark: boolean
    onChange: (bean: RegistryBeanDefinition) => void
    onClone: (bean: RegistryBeanDefinition) => void
}

interface State {
    bean?: RegistryBeanDefinition
    properties: Map<string, [string, string, boolean]>
    key: string,
    showInfrastructureSelector: boolean
    infrastructureSelectorUuid?: string
    infrastructureSelectorProperty?: string
}

export class BeanProperties extends React.Component<Props, State> {

    preparePropertiesMap = (properties: any): Map<string, [string, string, boolean]> => {
        const result = new Map<string, [string, string, boolean]>();
        Object.keys(properties).forEach((k, i, a) => result.set(uuidv4(), [k, properties[k], false]));
        return result;
    }

    public state: State = {
        bean: this.props.bean,
        key: '',
        showInfrastructureSelector: false,
        properties: this.props.bean?.properties ? this.preparePropertiesMap(this.props.bean?.properties) : new Map<string, [string, string, boolean]>()
    };

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevProps.bean?.uuid !== this.props.bean?.uuid) {
            this.setBean(this.props.bean);
        }
        if (prevState.key !== this.state.key && this.state.bean) {
            const bean = CamelUtil.cloneBean(this.state.bean);
            const properties: any = {};
            this.state.properties.forEach(p => properties[p[0]] = p[1]);
            bean.properties = properties;
            this.setState({bean: bean});
            this.props.onChange?.call(this, bean);
        }
    }

    setBean = (bean?: RegistryBeanDefinition) => {
        this.setState({
            bean: bean,
            properties: bean?.properties ? this.preparePropertiesMap(bean.properties) : new Map<string, [string, string, false]>()
        });
    }

    beanChanged = (fieldId: string, value: string) => {
        if (this.state.bean) {
            const bean = CamelUtil.cloneBean(this.state.bean);
            (bean as any)[fieldId] = value;
            this.setState({bean: bean});
            this.props.onChange?.call(this, bean);
        }
    }

    propertyChanged = (uuid: string, key: string, value: string, showPassword: boolean) => {
        this.setState(state => {
            state.properties.set(uuid, [key, value, showPassword]);
            return {properties: state.properties, key: Math.random().toString()};
        })
    }

    propertyDeleted = (uuid: string) => {
        this.setState(state => {
            state.properties.delete(uuid);
            return {properties: state.properties, key: Math.random().toString()};
        })
    }

    selectInfrastructure = (value: string) => {
        const propertyId = this.state.infrastructureSelectorProperty;
        const uuid = this.state.infrastructureSelectorUuid;
        if (propertyId && uuid){
            if (value.startsWith("config") || value.startsWith("secret")) value = "{{" + value + "}}";
            this.propertyChanged(uuid, propertyId, value, false);
            this.setState({showInfrastructureSelector: false, infrastructureSelectorProperty: undefined})
        }
    }

    openInfrastructureSelector = (uuid: string, propertyName: string) => {
        this.setState({infrastructureSelectorUuid: uuid, infrastructureSelectorProperty: propertyName, showInfrastructureSelector: true});
    }

    closeInfrastructureSelector = () => {
        this.setState({showInfrastructureSelector: false})
    }

    getInfrastructureSelectorModal() {
        return (
            <InfrastructureSelector
                dark={false}
                isOpen={this.state.showInfrastructureSelector}
                onClose={() => this.closeInfrastructureSelector()}
                onSelect={this.selectInfrastructure}/>)
    }

    cloneBean = () => {
        if (this.state.bean) {
            const bean = CamelUtil.cloneBean(this.state.bean);
            bean.uuid = uuidv4();
            this.props.onClone?.call(this, bean);
        }
    }

    getLabelIcon = (displayName: string, description: string) => {
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

    getBeanForm() {
        const bean = this.state.bean;
        return (
            <>
                <div className="headers">
                    <div className="top">
                        <Title headingLevel="h1" size="md">Bean</Title>
                        <Tooltip content="Clone bean" position="bottom">
                            <Button variant="link" onClick={() => this.cloneBean()} icon={<CloneIcon/>}/>
                        </Tooltip>
                    </div>
                </div>
                <FormGroup label="Name" fieldId="name" isRequired labelIcon={this.getLabelIcon("Name", "Bean name used as a reference ex: myBean")}>
                    <TextInput className="text-field" isRequired type="text" id="name" name="name" value={bean?.name}
                                onChange={(_, value)=> this.beanChanged("name", value)}/>
                </FormGroup>
                <FormGroup label="Type" fieldId="type" isRequired labelIcon={this.getLabelIcon("Type", "Bean class Canonical Name ex: org.demo.MyBean")}>
                    <TextInput className="text-field" isRequired type="text" id="type" name="type" value={bean?.type}
                        onChange={(_, value) => this.beanChanged("type", value)}/>
                </FormGroup>
                <FormGroup label="Properties" fieldId="properties" className="bean-properties">
                    {Array.from(this.state.properties.entries()).map((v, index, array) => {
                        const i = v[0];
                        const key = v[1][0];
                        const value = v[1][1];
                        const showPassword = v[1][2];
                        const isSecret = key !== undefined && SensitiveKeys.includes(key.toLowerCase());
                        const inInfrastructure = InfrastructureAPI.infrastructure !== 'local';
                        const icon = InfrastructureAPI.infrastructure === 'kubernetes' ? <KubernetesIcon/> : <DockerIcon/>
                        return (
                            <div key={"key-" + i} className="bean-property">
                                <TextInput placeholder="Bean Field Name" className="text-field" isRequired type="text" id="key" name="key" value={key}
                                            onChange={(_, beanFieldName) => {
                                                // TODO: is this correct
                                                this.propertyChanged(i, beanFieldName, value, showPassword)
                                            }}/>
                                <InputGroup>
                                    {inInfrastructure &&
                                        <Tooltip position="bottom-end" content="Select value from Infrastructure">
                                        <Button variant="control" onClick={e => this.openInfrastructureSelector(i, key)}>
                                            {icon}
                                        </Button>
                                    </Tooltip>}
                                    <InputGroupItem isFill>
                                        <TextInput
                                            placeholder="Bean Field Value"
                                            type={isSecret && !showPassword ? "password" : "text"}
                                            className="text-field"
                                            isRequired
                                            id="value"
                                            name="value"
                                            value={value}
                                            onChange={(_, value) => {
                                                // TODO: is this correct
                                                this.propertyChanged(i, key, value, showPassword)
                                            }}/>
                                    </InputGroupItem>
                                    {isSecret && <Tooltip position="bottom-end" content={showPassword ? "Hide" : "Show"}>
                                        <Button variant="control" onClick={e => this.propertyChanged(i, key, value, !showPassword)}>
                                            {showPassword ? <ShowIcon/> : <HideIcon/>}
                                        </Button>
                                    </Tooltip>}
                                </InputGroup>
                                <Button variant="link" className="delete-button" onClick={e => this.propertyDeleted(i)}><DeleteIcon/></Button>
                            </div>
                        )
                    })}
                    <Button variant="link" className="add-button" onClick={e => this.propertyChanged(uuidv4(), '', '', false)}>
                        <AddIcon/>Add property</Button>
                </FormGroup>
            </>
        )
    }

    render() {
        return (
            <div className='properties' key={this.state.bean ? this.state.bean.uuid : 'integration'}>
                <Form autoComplete="off" onSubmit={event => event.preventDefault()}>
                    {this.state.bean === undefined && <IntegrationHeader integration={this.props.integration}/>}
                    {this.state.bean !== undefined && this.getBeanForm()}
                </Form>
                {this.getInfrastructureSelectorModal()}
            </div>
        )
    }
}
