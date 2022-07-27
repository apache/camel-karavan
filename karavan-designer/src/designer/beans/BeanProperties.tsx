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
    TextInput, Button, Title, Tooltip, Popover,
} from '@patternfly/react-core';
import '../karavan.css';
import "@patternfly/patternfly/patternfly.css";
import {
    NamedBeanDefinition,
} from "karavan-core/lib/model/CamelDefinition";
import {Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {v4 as uuidv4} from "uuid";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import AddIcon from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import {IntegrationHeader} from "../utils/KaravanComponents";
import CloneIcon from '@patternfly/react-icons/dist/esm/icons/clone-icon'
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";

interface Props {
    integration: Integration
    bean?: NamedBeanDefinition
    dark: boolean
    onChange: (bean: NamedBeanDefinition) => void
    onClone: (bean: NamedBeanDefinition) => void
}

interface State {
    bean?: NamedBeanDefinition
    properties: Map<string, [string, string]>
    key: string
}

export class BeanProperties extends React.Component<Props, State> {

    preparePropertiesMap = (properties: any): Map<string, [string, string]> => {
        const result = new Map<string, [string, string]>();
        Object.keys(properties).forEach((k, i, a) => result.set(uuidv4(), [k, properties[k]]));
        return result;
    }

    public state: State = {
        bean: this.props.bean,
        key: '',
        properties: this.props.bean?.properties ? this.preparePropertiesMap(this.props.bean?.properties) : new Map<string, [string, string]>()
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

    setBean = (bean?: NamedBeanDefinition) => {
        this.setState({
            bean: bean,
            properties: bean?.properties ? this.preparePropertiesMap(bean.properties) : new Map<string, [string, string]>()
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

    propertyChanged = (uuid: string, key: string, value: string) => {
        this.setState(state => {
            state.properties.set(uuid, [key, value]);
            return {properties: state.properties, key: Math.random().toString()};
        })
    }

    propertyDeleted = (uuid: string) => {
        this.setState(state => {
            state.properties.delete(uuid);
            return {properties: state.properties, key: Math.random().toString()};
        })
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
                    }} className="pf-c-form__group-label-help">
                        <HelpIcon noVerticalAlign/>
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
                               onChange={e => this.beanChanged("name", e)}/>
                </FormGroup>
                <FormGroup label="Type" fieldId="type" isRequired labelIcon={this.getLabelIcon("Type", "Bean class Canonical Name ex: org.demo.MyBean")}>
                    <TextInput className="text-field" isRequired type="text" id="type" name="type" value={bean?.type} onChange={e => this.beanChanged("type", e)}/>
                </FormGroup>
                <FormGroup label="Properties" fieldId="properties" className="bean-properties">
                    {Array.from(this.state.properties.entries()).map((v, index, array) => {
                        const i = v[0];
                        const key = v[1][0];
                        const value = v[1][1];
                        return (
                            <div key={"key-" + i} className="bean-property">
                                <TextInput className="text-field" isRequired type="text" id="key" name="key" value={key} onChange={e => this.propertyChanged(i, e, value)}/>
                                <TextInput className="text-field" isRequired type="text" id="value" name="value" value={value} onChange={e => this.propertyChanged(i, key, e)}/>
                                <Button variant="link" className="delete-button" onClick={e => this.propertyDeleted(i)}><DeleteIcon/></Button>
                            </div>
                        )
                    })}
                    <Button variant="link" className="add-button" onClick={e => this.propertyChanged(uuidv4(), '', '')}><AddIcon/>Add property</Button>
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
            </div>
        )
    }
}
