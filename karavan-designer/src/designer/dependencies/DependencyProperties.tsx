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
    Form,
    FormGroup, Popover,
    TextInput, Title, Tooltip,
} from '@patternfly/react-core';
import '../karavan.css';
import "@patternfly/patternfly/patternfly.css";
import {Integration, Dependency} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {IntegrationHeader} from "../utils/KaravanComponents";
import {v4 as uuidv4} from "uuid";
import CloneIcon from "@patternfly/react-icons/dist/esm/icons/clone-icon";
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";

interface Props {
    integration: Integration
    dependency?: Dependency
    dark: boolean
    onChange: (dependency: Dependency) => void
    onClone: (dependency: Dependency) => void
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


    cloneDependency = () => {
        if (this.state.dependency) {
            const dependency = CamelUtil.cloneDependency(this.state.dependency);
            dependency.uuid = uuidv4();
            this.props.onClone?.call(this, dependency);
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

    getDependencyForm() {
        const dependency = this.state.dependency;
        return (
            <>
                <div className="headers">
                    <div className="top">
                        <Title headingLevel="h1" size="md">Dependency</Title>
                        <Tooltip content="Clone dependency" position="bottom">
                            <Button variant="link" onClick={() => this.cloneDependency()} icon={<CloneIcon/>}/>
                        </Tooltip>
                    </div>
                </div>
                <FormGroup label="Group" fieldId="group" isRequired  labelIcon={this.getLabelIcon("Group ID", "Maven artifact groupId uniquely identifies project ex: org.demo.project ")}>
                    <TextInput className="text-field" isRequired type="text" id="group" name="group" value={dependency?.group}
                               onChange={e => this.dependencyChanged("group", e)}/>
                </FormGroup>
                <FormGroup label="Artifact" fieldId="artifact" isRequired  labelIcon={this.getLabelIcon("Artifact ID", "Maven artifact artifactId is the name of the jar without version ex: core")}>
                    <TextInput className="text-field" isRequired type="text" id="artifact" name="artifact" value={dependency?.artifact}
                               onChange={e => this.dependencyChanged("artifact", e)}/>
                </FormGroup>
                <FormGroup label="Version" fieldId="version" isRequired  labelIcon={this.getLabelIcon("Version", "Maven artifact version ex: 1.0.0")}>
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
