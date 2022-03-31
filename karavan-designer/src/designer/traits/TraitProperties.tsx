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
    TextInput, Button,
} from '@patternfly/react-core';
import '../karavan.css';
import "@patternfly/patternfly/patternfly.css";
import {
    NamedBeanDefinition,
} from "karavan-core/lib/model/CamelDefinition";
import {CamelElement, Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {v4 as uuidv4} from "uuid";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import AddIcon from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import {IntegrationHeader} from "../utils/KaravanComponents";

interface Props {
    integration: Integration
    trait?: CamelElement
    dark: boolean
    onChange: (trait: CamelElement) => void
}

interface State {
    trait?: CamelElement
    // properties: Map<string, [string, string]>
    key: string
}

export class TraitProperties extends React.Component<Props, State> {

    preparePropertiesMap = (properties: any): Map<string, [string, string]> => {
        const result = new Map<string, [string, string]>();
        Object.keys(properties).forEach((k, i, a) => result.set(uuidv4(), [k, properties[k]]));
        return result;
    }

    public state: State = {
        trait: this.props.trait,
        key: '',
        // properties: this.props.trait?.properties ? this.preparePropertiesMap(this.props.trait?.properties) : new Map<string, [string, string]>()
    };

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevProps.trait?.uuid !== this.props.trait?.uuid) {
            // this.setBean(this.props.trait);
        }
        // if (prevState.key !== this.state.key && this.state.bean) {
        //     const bean = CamelUtil.cloneBean(this.state.bean);
        //     const properties: any = {};
        //     this.state.properties.forEach(p => properties[p[0]] = p[1]);
        //     bean.properties = properties;
        //     this.setState({bean: bean});
        //     this.props.onChange?.call(this, bean);
        // }
    }

    setBean = (trait?: CamelElement) => {
        this.setState({
            trait: trait,
            // properties: bean?.properties ? this.preparePropertiesMap(bean.properties) : new Map<string, [string, string]>()
        });
    }

    beanChanged = (fieldId: string, value: string) => {
        // if (this.state.bean) {
        //     const bean = CamelUtil.cloneBean(this.state.bean);
        //     (bean as any)[fieldId] = value;
        //     this.setState({bean: bean});
        //     this.props.onChange?.call(this, bean);
        // }
    }

    propertyChanged = (uuid: string, key: string, value: string) => {
        // this.setState(state => {
        //     state.properties.set(uuid, [key, value]);
        //     return {properties: state.properties, key: Math.random().toString()};
        // })
    }

    propertyDeleted = (uuid: string) => {
        this.setState(state => {
            // state.properties.delete(uuid);
            // return {properties: state.properties, key: Math.random().toString()};
        })
    }

    getBeanForm() {
        const trait = this.state.trait;
        return (
            <>
                <FormGroup label="Name" fieldId="name" isRequired>
                    {/*<TextInput className="text-field" isRequired type="text" id="name" name="name" value={trait?.name}*/}
                    {/*           onChange={e => this.beanChanged("name", e)}/>*/}
                </FormGroup>
                <FormGroup label="Type" fieldId="type" isRequired>
                    {/*<TextInput className="text-field" isRequired type="text" id="type" name="type" value={bean?.type} onChange={e => this.beanChanged("type", e)}/>*/}
                </FormGroup>
                {/*<FormGroup label="Properties" fieldId="properties" className="bean-properties">*/}
                {/*    {Array.from(this.state.properties.entries()).map((v, index, array) => {*/}
                {/*        const i = v[0];*/}
                {/*        const key = v[1][0];*/}
                {/*        const value = v[1][1];*/}
                {/*        return (*/}
                {/*            <div key={"key-" + i} className="bean-property">*/}
                {/*                <TextInput className="text-field" isRequired type="text" id="key" name="key" value={key} onChange={e => this.propertyChanged(i, e, value)}/>*/}
                {/*                <TextInput className="text-field" isRequired type="text" id="value" name="value" value={value} onChange={e => this.propertyChanged(i, key, e)}/>*/}
                {/*                <Button variant="link" className="delete-button" onClick={e => this.propertyDeleted(i)}><DeleteIcon/></Button>*/}
                {/*            </div>*/}
                {/*        )*/}
                {/*    })}*/}
                {/*    <Button variant="link" className="add-button" onClick={e => this.propertyChanged(uuidv4(), '', '')}><AddIcon/>Add property</Button>*/}
                {/*</FormGroup>*/}
            </>
        )
    }

    render() {
        return (
            <div className='properties' key={this.state.trait ? this.state.trait.uuid : 'integration'}>
                <Form autoComplete="off" onSubmit={event => event.preventDefault()}>
                    {this.state.trait === undefined && <IntegrationHeader integration={this.props.integration}/>}
                    {this.state.trait !== undefined && this.getBeanForm()}
                </Form>
            </div>
        )
    }
}