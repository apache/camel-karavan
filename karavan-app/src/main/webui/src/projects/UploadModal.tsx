import React from 'react';
import {
    TextInput,
    Button, Modal, FormGroup, ModalVariant, Switch, Form, FileUpload, Radio
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {KaravanApi} from "../api/KaravanApi";
import {ProjectFile} from "./ProjectModels";

interface Props {
    projectId: string,
    isOpen: boolean,
    onClose: any
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

export class UploadModal extends React.Component<Props, State> {

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

    closeModal = () => {
        this.props.onClose?.call(this);
    }

    saveAndCloseModal = () => {
        const state = this.state;
        const file = new ProjectFile(state.filename, this.props.projectId, state.data, Date.now());
        if (this.state.type === "integration"){
            KaravanApi.postProjectFile(file, res => {
                if (res.status === 200) {
                    //TODO show notification
                    this.props.onClose?.call(this);
                } else {
                    // TODO show notification
                    this.props.onClose?.call(this);
                }
            })
        } else {
            KaravanApi.postOpenApi(file, state.generateRest, state.generateRoutes, state.integrationName, res => {
                if (res.status === 200) {
                    console.log(res) //TODO show notification
                    this.props.onClose?.call(this);
                } else {
                    console.log(res) //TODO show notification
                    this.props.onClose?.call(this);
                }
            })
        }
    }

    handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>, file: File) => this.setState({filename: file.name});
    handleFileReadStarted = (fileHandle: File) => this.setState({isLoading: true});
    handleFileReadFinished = (fileHandle: File) => this.setState({isLoading: false});
    handleTextOrDataChange = (data: string) => this.setState({data: data});
    handleFileRejected = (acceptedOrRejected: File[], event: React.DragEvent<HTMLElement>) => this.setState({isRejected: true});
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
        const accept = this.state.type === 'integration' ? '.yaml' : '.json, .yaml';
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
                            onChange={(_, event) => this.setState({ type: _ ? 'integration': 'openapi' })}
                        />{' '}
                        <Radio value="OpenAPI" label="OpenAPI json/yaml" name="OpenAPI" id="OpenAPI" isChecked={this.state.type === 'openapi'}
                            onChange={(_, event) => this.setState({ type: _ ? 'openapi' : 'integration' })}
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
                            onFileInputChange={this.handleFileInputChange}
                            onDataChange={data => this.handleTextOrDataChange(data)}
                            onTextChange={text => this.handleTextOrDataChange(text)}
                            onReadStarted={this.handleFileReadStarted}
                            onReadFinished={this.handleFileReadFinished}
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
                            onChange={checked => this.setState({generateRest: checked})}
                        />
                    </FormGroup>}
                    {this.state.type === 'openapi' && this.state.generateRest && <FormGroup fieldId="generateRoutes">
                        <Switch
                            id="generate-routes"
                            label="Generate Routes"
                            labelOff="Do not generate Routes"
                            isChecked={this.state.generateRoutes}
                            onChange={checked => this.setState({generateRoutes: checked})}
                        />
                    </FormGroup>}
                    {this.state.type === 'openapi' && this.state.generateRest && <FormGroup fieldId="integrationName" label="Integration name">
                        <TextInput autoComplete="off"
                            id="integrationName"
                            type="text"
                            placeholder="Integration file name with yaml extension"
                            required

                            onChange={value => this.setState({integrationName: value})}
                        />
                    </FormGroup>}
                </Form>
            </Modal>
        )
    }
};