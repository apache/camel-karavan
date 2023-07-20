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
    Modal,
    ModalVariant, Title, TitleSizes
} from '@patternfly/react-core';
import '../../karavan.css';
import "@patternfly/patternfly/patternfly.css";
import {PropertyMeta} from "karavan-core/lib/model/CamelMetadata";
import Editor from "@monaco-editor/react";

interface Props {
    property: PropertyMeta,
    customCode: any,
    onSave: (fieldId: string, value: string | number | boolean | any) => void,
    onClose: () => void,
    title: string,
    dslLanguage?: [string, string, string],
    dark: boolean
    showEditor: boolean
}

interface State {
    customCode: any,
}

export class ModalEditor extends React.Component<Props, State> {

    public state: State = {
        customCode: this.props.customCode,
    }

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevProps.showEditor !== this.props.showEditor) {
            this.setState({customCode: this.props.customCode})
        }
    }

    close(){
        this.props.onClose?.call(this);
    }

    closeAndSave(){
        this.props.onSave?.call(this, this.props.property.name, this.state.customCode);
    }

    render() {
        const {dark, dslLanguage, title, showEditor} = this.props;
        const {customCode} = this.state;
        return (
            <Modal
                aria-label={"expression"}
                variant={ModalVariant.large}
                header={<React.Fragment>
                    <Title id="modal-custom-header-label" headingLevel="h1" size={TitleSizes['2xl']}>
                        {title}
                    </Title>
                    <p className="pf-u-pt-sm">{dslLanguage?.[2]}</p>
                </React.Fragment>}
                isOpen={showEditor}
                onClose={() => this.close()}
                actions={[
                    <Button key="save" variant="primary" isSmall
                            onClick={e => this.closeAndSave()}>Save</Button>,
                    <Button key="cancel" variant="secondary" isSmall
                            onClick={e => this.close()}>Close</Button>
                ]}
                onEscapePress={e => this.close()}>
                <Editor
                    height="400px"
                    width="100%"
                    defaultLanguage={'java'}
                    language={'java'}
                    theme={dark ? 'vs-dark' : 'light'}
                    options={{lineNumbers: "off", folding: false, lineNumbersMinChars: 10, showUnused: false, fontSize: 12, minimap: {enabled: false}}}
                    value={customCode?.toString()}
                    className={'code-editor'}
                    onChange={(value: any, ev: any) => this.setState({customCode: value})}
                />
            </Modal>
        )
    }
}
