import React from 'react';
import {
    Button,
    Modal,
    FormGroup,
    ModalVariant,
    Form,
    ToggleGroupItem, ToggleGroup, TextInputGroupMain, TextInputGroupUtilities, TextInputGroup, Text, FormHelperText, HelperText, HelperTextItem, TextInput
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {KaravanApi} from "../api/KaravanApi";
import {Project, ProjectFile, ProjectFileTypes} from "./ProjectModels";
import {CamelUi} from "../designer/utils/CamelUi";
import {Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";

interface Props {
    isOpen: boolean,
    project: Project,
    onClose: any,
    types: string[]
}

interface State {
    name: string
    fileType: string
}

export class CreateFileModal extends React.Component<Props, State> {

    public state: State = {
        name: '',
        fileType: this.props.types.at(0) || 'INTEGRATION',
    };

    closeModal = () => {
        this.props.onClose?.call(this);
    }

    saveAndCloseModal = () => {
        const {name, fileType} = this.state;
        const extension = ProjectFileTypes.filter(value => value.name === fileType)[0].extension;
        const filename = (extension !== 'java') ? CamelUi.nameFromTitle(name) : CamelUi.javaNameFromTitle(name);
        const code = fileType === 'INTEGRATION'
            ? CamelDefinitionYaml.integrationToYaml(Integration.createNew(name, 'plain'))
            : '';
        if (filename && extension) {
            const file = new ProjectFile(filename + '.' + extension, this.props.project.projectId, code, Date.now());
            KaravanApi.postProjectFile(file, res => {
                if (res.status === 200) {
                    // console.log(res) //TODO show notification
                    this.props.onClose?.call(this);
                } else {
                    // console.log(res) //TODO show notification
                    this.props.onClose?.call(this);
                }
            })
        }
    }

    render() {
        const {fileType} = this.state;
        const {types} = this.props;
        const extension = ProjectFileTypes.filter(value => value.name === fileType)[0].extension;
        const filename = (extension !== 'java')
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
                        <ToggleGroup aria-label="Type" isCompact>
                            {ProjectFileTypes.filter(p => types.includes(p.name))
                                .map(p => {
                                    const title = p.title + ' (' + p.extension + ')';
                                    return <ToggleGroupItem key={title} text={title} buttonId={p.name}
                                                            isSelected={fileType === p.name}
                                                            onChange={selected => this.setState({fileType: p.name})}/>
                                })}
                        </ToggleGroup>
                    </FormGroup>
                    <FormGroup label="Name" fieldId="name" isRequired>
                        <TextInput value={this.state.name} onChange={value => this.setState({name: value})}/>
                        <FormHelperText isHidden={false} component="div">
                            <HelperText id="helper-text1">
                                <HelperTextItem variant={'default'}>{filename + '.' + extension}</HelperTextItem>
                            </HelperText>
                        </FormHelperText>
                    </FormGroup>
                </Form>
            </Modal>
        )
    }
}