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
    TextInput,
    Button, Modal, FormGroup, ModalVariant, Switch, Form, FileUpload, Radio
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {ProjectFile} from "../../api/ProjectModels";
import {KaravanApi} from "../../api/KaravanApi";
import {useFileStore} from "../../api/ProjectStore";
import {ProjectEventBus} from "../../api/ProjectEventBus";
import {Accept, DropEvent, FileRejection} from "react-dropzone";
import {EventBus} from "../../designer/utils/EventBus";

interface Props {
    projectId: string,
    isOpen: boolean,
}

interface State {
    type: 'integration' | 'openapi'
    data: string
    filename: string
    integrationName: string
    isLoading: boolean
    isRejected: boolean
    generateRest: boolean
    generateRoutes: boolean
}

export class UploadFileModal extends React.Component<Props, State> {

    public state: State = {
        type: 'integration',
        data: '',
        filename: '',
        integrationName: '',
        isLoading: false,
        isRejected: false,
        generateRest: true,
        generateRoutes: true
    };

    closeModal () {
        useFileStore.setState({operation:"none"});
    }

    saveAndCloseModal () {
        const state = this.state;
        const file = new ProjectFile(state.filename, this.props.projectId, state.data, Date.now());
        if (this.state.type === "integration"){
            KaravanApi.postProjectFile(file, res => {
                if (res.status === 200) {
                    //TODO show notification
                    this.closeModal();
                } else {
                    this.closeModal();
                    EventBus.sendAlert("Error", res.statusText, "warning")
                }
            })
        } else {
            KaravanApi.postOpenApi(file, state.generateRest, state.generateRoutes, state.integrationName, res => {
                if (res.status === 200) {
                    console.log(res) //TODO show notification
                    this.closeModal();
                } else {
                    this.closeModal();
                    EventBus.sendAlert("Error", res.statusText, "warning")
                }
            })
        }
    }

    handleFileInputChange = (file: File) => this.setState({filename: file.name});
    handleFileReadStarted = (fileHandle: File) => this.setState({isLoading: true});
    handleFileReadFinished = (fileHandle: File) => this.setState({isLoading: false});
    handleTextOrDataChange = (data: string) => this.setState({data: data});
    handleFileRejected = (fileRejections: FileRejection[], event: DropEvent) => this.setState({isRejected: true});
    handleClear = (event: React.MouseEvent<HTMLButtonElement>) => this.setState({
        filename: '',
        data: '',
        isRejected: false
    });


    render() {
        const fileNotUploaded = (this.state.filename === '' || this.state.data === '');
        const isDisabled = this.state.type === 'integration'
            ? fileNotUploaded
            : !(!fileNotUploaded && this.state.integrationName !== undefined && this.state.integrationName.endsWith(".yaml"));
        const accept : Accept = this.state.type === 'integration'
            ? {'application/yaml': ['.yaml', '.yml']}
            :  {'application/yaml': ['.yaml', '.yml'], 'application/json': ['.json'], 'plain/text': ['.sql']};
        return (
            <Modal
                title="Upload"
                variant={ModalVariant.small}
                isOpen={this.props.isOpen}
                onClose={this.closeModal}
                actions={[
                    <Button key="confirm" variant="primary" onClick={this.saveAndCloseModal} isDisabled={isDisabled}>Save</Button>,
                    <Button key="cancel" variant="secondary" onClick={this.closeModal}>Cancel</Button>
                ]}
            >
                <Form>
                    <FormGroup fieldId="type">
                        <Radio value="Integration" label="Integration yaml" name="Integration" id="Integration" isChecked={this.state.type === 'integration'}
                            onChange={(event, _) => this.setState({ type: _ ? 'integration': 'openapi' })}
                        />{' '}
                        <Radio value="OpenAPI" label="OpenAPI json/yaml" name="OpenAPI" id="OpenAPI" isChecked={this.state.type === 'openapi'}
                            onChange={(event, _) => this.setState({ type: _ ? 'openapi' : 'integration' })}
                        />
                    </FormGroup>
                    <FormGroup fieldId="upload">
                        <FileUpload
                            id="file-upload"
                            value={this.state.data}
                            filename={this.state.filename}
                            type="text"
                            hideDefaultPreview
                            browseButtonText="Upload"
                            isLoading={this.state.isLoading}
                            onFileInputChange={(_event, fileHandle: File) => this.handleFileInputChange(fileHandle)}
                            onDataChange={(_event, data) => this.handleTextOrDataChange(data)}
                            onTextChange={(_event, text) => this.handleTextOrDataChange(text)}
                            onReadStarted={(_event, fileHandle: File) => this.handleFileReadStarted(fileHandle)}
                            onReadFinished={(_event, fileHandle: File) => this.handleFileReadFinished(fileHandle)}
                            allowEditingUploadedText={false}
                            onClearClick={this.handleClear}
                            dropzoneProps={{accept: accept, onDropRejected: this.handleFileRejected}}
                            validated={this.state.isRejected ? 'error' : 'default'}
                        />
                    </FormGroup>
                    {this.state.type === 'openapi' && <FormGroup fieldId="generateRest">
                        <Switch
                            id="generate-rest"
                            label="Generate REST DSL"
                            labelOff="Do not generate REST DSL"
                            isChecked={this.state.generateRest}
                             onChange={(_, checked) => this.setState({generateRest: checked})}
                        />
                    </FormGroup>}
                    {this.state.type === 'openapi' && this.state.generateRest && <FormGroup fieldId="generateRoutes">
                        <Switch
                            id="generate-routes"
                            label="Generate Routes"
                            labelOff="Do not generate Routes"
                            isChecked={this.state.generateRoutes}
                             onChange={(_, checked) => this.setState({generateRoutes: checked})}
                        />
                    </FormGroup>}
                    {this.state.type === 'openapi' && this.state.generateRest && <FormGroup fieldId="integrationName" label="Integration name">
                        <TextInput autoComplete="off"
                            id="integrationName"
                            type="text"
                            placeholder="Integration file name with yaml extension"
                            required
                            onChange={(_, value) => this.setState({integrationName: value})}
                        />
                    </FormGroup>}
                </Form>
            </Modal>
        )
    }
};