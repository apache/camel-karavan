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
import {PageSection
} from '@patternfly/react-core';
// import '../karavan.css';
import {NamedBeanDefinition} from "karavan-core/lib/model/CamelDefinition";
import {Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import Editor from '@monaco-editor/react';

const LINE_HEIGHT = 18;

interface Props {
    onSave?: (integration: Integration) => void
    integration: Integration
    borderColor: string
    borderColorSelected: string
    dark: boolean
}

interface State {
    integration: Integration
    showDeleteConfirmation: boolean
    selectedBean?: NamedBeanDefinition
    key: string
    showBeanEditor: boolean
    editorHeight: number

}

export class YamlDesigner extends React.Component<Props, State> {

    public state: State = {
        integration: this.props.integration,
        showDeleteConfirmation: false,
        key: "",
        showBeanEditor: false,
        editorHeight: 3000,
    };

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevState.key !== this.state.key) {
            this.props.onSave?.call(this, this.state.integration);
        }
    }

    onIntegrationUpdate = (i: Integration) => {
        this.setState({integration: i, showDeleteConfirmation: false, key: Math.random().toString()});
    }

    deleteBean = () => {
        const i = CamelDefinitionApiExt.deleteBeanFromIntegration(this.state.integration, this.state.selectedBean);
        this.setState({
            integration: i,
            showDeleteConfirmation: false,
            key: Math.random().toString(),
            selectedBean: new NamedBeanDefinition()
        });
    }

    render() {
        const code = CamelDefinitionYaml.integrationToYaml(this.state.integration);
        const height = code.split("\n").length * LINE_HEIGHT;
        return (
            <PageSection className="yaml-page" isFilled padding={{default: 'noPadding'}} >
                <Editor
                    height="100vh"
                    defaultLanguage={'yaml'}
                    theme={'light'}
                    value={code}
                    className={'code-editor'}

                />
            </PageSection>
        );
    }
}
