import React from 'react';
import {
    TextInput,
    Button, Modal, FormGroup, ModalVariant, Switch, Form, FileUpload, Radio
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {GeneratorApi} from "../api/GeneratorApi";
import {SpaceBus} from "./SpaceBus";

interface Props {
    isOpen: boolean,
    onClose: (yaml: string | undefined) => void
}

interface State {
    data: string
    filename: string
    isLoading: boolean
    isRejected: boolean
    generateRest: boolean
    generateRoutes: boolean
    generating: boolean
}

export class UploadModal extends React.Component<Props, State> {

    public state: State = {
        data: '',
        filename: '',
        isLoading: false,
        isRejected: false,
        generateRest: true,
        generateRoutes: true,
        generating: false
    };

    closeModal = (yaml: string | undefined) => {
        this.props.onClose?.call(this, yaml);
    }

    saveAndCloseModal = () => {
        this.setState({generating: true});
        const {filename, data} = this.state;
        GeneratorApi.generate(filename, data).then(value => {
            SpaceBus.sendAlert('Success', 'Generated REST DSL');
            this.setState({generating: false});
            this.closeModal(value);
        }).catch(reason => {
            SpaceBus.sendAlert('Error', reason.toString(), 'danger');
            this.setState({generating: false});
        })
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
        const {generating} = this.state;
        const fileNotUploaded = (this.state.filename === '' || this.state.data === '');
        const isDisabled = fileNotUploaded || generating;
        const accept = '.json, .yaml';
        return (
            <Modal
                title="Upload OpenAPI"
                variant={ModalVariant.small}
                isOpen={this.props.isOpen}
                onClose={() => this.closeModal(undefined)}
                actions={[
                    <Button isLoading={generating} key="confirm" variant="primary" onClick={this.saveAndCloseModal} isDisabled={isDisabled}>Save</Button>,
                    <Button key="cancel" variant="secondary" onClick={event => this.closeModal(undefined)}>Cancel</Button>
                ]}
            >
                <Form>
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
                    {/*<FormGroup fieldId="generateRest">*/}
                    {/*    <Switch*/}
                    {/*        id="generate-rest"*/}
                    {/*        label="Generate REST DSL"*/}
                    {/*        labelOff="Do not generate REST DSL"*/}
                    {/*        isChecked={this.state.generateRest}*/}
                    {/*        onChange={checked => this.setState({generateRest: checked})}*/}
                    {/*    />*/}
                    {/*</FormGroup>*/}
                    {/*{this.state.generateRest && <FormGroup fieldId="generateRoutes">*/}
                    {/*    <Switch*/}
                    {/*        id="generate-routes"*/}
                    {/*        label="Generate Routes"*/}
                    {/*        labelOff="Do not generate Routes"*/}
                    {/*        isChecked={this.state.generateRoutes}*/}
                    {/*        onChange={checked => this.setState({generateRoutes: checked})}*/}
                    {/*    />*/}
                    {/*</FormGroup>}*/}
                </Form>
            </Modal>
        )
    }
};