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
    Button,
    Form, FormGroup, Modal, ModalVariant, TextInput,
} from '@patternfly/react-core';
import '../karavan.css';
import {Bean} from "karavan-core/lib/model/CamelDefinition";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import AddIcon from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {BeanIcon} from "../utils/KaravanIcons";
import {v4 as uuidv4} from 'uuid';

interface Props {
    bean: Bean
    dark: boolean
    show: boolean
    onChange: (bean: Bean) => void
}

interface State {
    bean: Bean
    properties: Map<string, [string, string]>
    key: string
}

export class BeanEditor extends React.Component<Props, State> {

    preparePropertiesMap = (): Map<string, [string, string]> => {
        const result = new Map<string, [string, string]>();
        Object.keys(this.props.bean.properties).forEach((k, i, a) => result.set(uuidv4(), [k, this.props.bean.properties[k]]));
        return result;
    }

    public state: State = {
        bean: this.props.bean,
        key: '',
        properties: this.props.bean.properties ? this.preparePropertiesMap() : new Map<string, [string, string]>()
    };

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevState.key !== this.state.key) {
            const bean = CamelUtil.cloneBean(this.state.bean);
            const properties: any = {};
            this.state.properties.forEach(p => properties[p[0]] = p[1]);
            bean.properties = properties;
            this.setState({bean: bean});
        }
    }

    beanChanged = (fieldId: string, value: string) => {
        const bean = CamelUtil.cloneBean(this.state.bean);
        (bean as any)[fieldId] = value;
        this.setState({bean: bean});
    }

    propertyChanged = (uuid: string, key: string,  value: string) => {
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

    render() {
        const bean = this.state.bean;
        return (
            <Modal
                title="Bean"
                variant={ModalVariant.medium}
                titleIconVariant={BeanIcon}
                className='bean-modal'
                isOpen={this.props.show}
                onClose={() => this.props.onChange?.call(this, this.state.bean)}
                actions={{}}>
                <Form autoComplete="off" onSubmit={event => event.preventDefault()} isHorizontal>
                    <FormGroup label="Name" fieldId="name" isRequired>
                        <TextInput className="text-field" isRequired isReadOnly={this.props.bean.name !== ''} type="text" id="name" name="name" value={bean?.name} onChange={e => this.beanChanged("name", e)}/>
                    </FormGroup>
                    <FormGroup label="Type" fieldId="type" isRequired>
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
                </Form>
            </Modal>

        );
    }
}