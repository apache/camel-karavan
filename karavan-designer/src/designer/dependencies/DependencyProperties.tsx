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
    TextInput,
} from '@patternfly/react-core';
import '../karavan.css';
import "@patternfly/patternfly/patternfly.css";
import {Integration, Dependency} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {IntegrationHeader} from "../utils/KaravanComponents";

interface Props {
    integration: Integration
    dependency?: Dependency
    dark: boolean
    onChange: (dependency: Dependency) => void
}

interface State {
    dependency?: Dependency
}

export class DependencyProperties extends React.Component<Props, State> {

    public state: State = {
        dependency: this.props.dependency,
    };

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevProps.dependency?.uuid !== this.props.dependency?.uuid) {
            this.setState({dependency:this.props.dependency});
        }
    }

    dependencyChanged = (fieldId: string, value: string) => {
        if (this.state.dependency) {
            const dependency = CamelUtil.cloneDependency(this.state.dependency);
            (dependency as any)[fieldId] = value;
            this.setState({dependency: dependency});
            this.props.onChange?.call(this, dependency);
        }
    }

    getDependencyForm() {
        const dependency = this.state.dependency;
        return (
            <>
                <FormGroup label="Group" fieldId="group" isRequired>
                    <TextInput className="text-field" isRequired type="text" id="group" name="group" value={dependency?.group}
                               onChange={e => this.dependencyChanged("group", e)}/>
                </FormGroup>
                <FormGroup label="Artifact" fieldId="artifact" isRequired>
                    <TextInput className="text-field" isRequired type="text" id="artifact" name="artifact" value={dependency?.artifact}
                               onChange={e => this.dependencyChanged("artifact", e)}/>
                </FormGroup>
                <FormGroup label="Version" fieldId="version" isRequired>
                    <TextInput className="text-field" isRequired type="text" id="version" name="version" value={dependency?.version}
                               onChange={e => this.dependencyChanged("version", e)}/>
                </FormGroup>
            </>
        )
    }

    render() {
        return (
            <div className='properties' key={this.state.dependency ? this.state.dependency.uuid : 'integration'}>
                <Form autoComplete="off" onSubmit={event => event.preventDefault()}>
                    {this.state.dependency === undefined && <IntegrationHeader integration={this.props.integration}/>}
                    {this.state.dependency !== undefined && this.getDependencyForm()}
                </Form>
            </div>
        )
    }
}