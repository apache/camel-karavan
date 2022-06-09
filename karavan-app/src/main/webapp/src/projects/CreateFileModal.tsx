import React from 'react';
import {
    Button,
    Modal,
    FormGroup,
    ModalVariant,
    Form,
    ToggleGroupItem, ToggleGroup, TextInputGroupMain, ChipGroup, Chip, TextInputGroupUtilities, TextInputGroup, Text
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {KaravanApi} from "../api/KaravanApi";
import {Project, ProjectFile, ProjectFileTypes} from "../models/ProjectModels";
import {CamelUi} from "../designer/utils/CamelUi";

interface Props {
    isOpen: boolean,
    project: Project,
    onClose: any
}

interface State {
    name: string
    extension: string
}

export class CreateFileModal extends React.Component<Props, State> {

    public state: State = {
        name: '',
        extension: '',
    };

    closeModal = () => {
        this.props.onClose?.call(this);
    }

    saveAndCloseModal = () => {
        const {name, extension} = this.state;
        const filename = (extension !== 'java') ? CamelUi.nameFromTitle(name) : CamelUi.javaNameFromTitle(name)
        if (filename && extension){
            const file = new ProjectFile(filename + '.' + extension, this.props.project.getKey(), '');
            KaravanApi.postProjectFile(file, res => {
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

    render() {
        const filename = (this.state.extension !== 'java')
            ? CamelUi.nameFromTitle(this.state.name)
            : CamelUi.javaNameFromTitle(this.state.name)
        return (
            <Modal
                title="Create"
                variant={ModalVariant.small}
                isOpen={this.props.isOpen}
                onClose={this.closeModal}
                actions={[
                    <Button key="confirm" variant="primary" onClick={this.saveAndCloseModal}>Save</Button>,
                    <Button key="cancel" variant="secondary" onClick={this.closeModal}>Cancel</Button>
                ]}
            >
                <Form autoComplete="off" isHorizontal className="create-file-form">
                    <FormGroup label="Type" fieldId="type" isRequired>
                        <ToggleGroup aria-label="Default with single selectable">
                            {ProjectFileTypes.filter(p => p.name !== 'PROPERTIES').map(p => {
                                const title = p.title + (p.name === 'CODE' ? ' (' + p.extension + ')' : '');
                                return <ToggleGroupItem key={title} text={title} buttonId={p.name}
                                                        isSelected={this.state.extension === p.extension}
                                                        onChange={selected => this.setState({extension: p.extension})} />
                            })}
                        </ToggleGroup>
                    </FormGroup>
                    <FormGroup label="Name" fieldId="name" isRequired>
                        <TextInputGroup className="input-group">
                            <TextInputGroupMain value={this.state.name} onChange={value => this.setState({name: value})} />
                            <TextInputGroupUtilities>
                                <Text>{filename + '.' + this.state.extension}</Text>
                            </TextInputGroupUtilities>
                        </TextInputGroup>

                    </FormGroup>
                </Form>
            </Modal>
        )
    }
}