import React, {useState} from 'react';
import {
    Button,
    Modal,
    FormGroup,
    ModalVariant,
    Form,
    ToggleGroupItem, ToggleGroup, FormHelperText, HelperText, HelperTextItem, TextInput
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {useFileStore, useProjectStore} from "../api/ProjectStore";
import {ProjectFile, ProjectFileTypes} from "../api/ProjectModels";
import {CamelUi} from "../designer/utils/CamelUi";
import {ProjectService} from "../api/ProjectService";

interface Props {
    types: string[]
}

export const CreateFileModal = (props: Props) => {

    const {operation} = useFileStore();
    const {project, setProject} = useProjectStore();
    const [name, setName] = useState<string>( '');
    const [fileType, setFileType] = useState<string>(props.types.at(0) || 'INTEGRATION');

    function cleanValues()  {
        setName("");
        setFileType(props.types.at(0) || 'INTEGRATION');
    }

    function closeModal () {
        useFileStore.setState({operation: "none"});
        cleanValues();
    }

    function confirmAndCloseModal () {
        const extension = ProjectFileTypes.filter(value => value.name === fileType)[0].extension;
        const filename = (extension !== 'java') ? CamelUi.nameFromTitle(name) : CamelUi.javaNameFromTitle(name);
        const code = fileType === 'INTEGRATION'
            ? CamelDefinitionYaml.integrationToYaml(Integration.createNew(name, 'plain'))
            : '';
        if (filename && extension) {
            const file = new ProjectFile(filename + '.' + extension, project.projectId, code, Date.now());
            ProjectService.createFile(file);
            useFileStore.setState({operation: "none"});
            cleanValues();
        }
    }

    const extension = ProjectFileTypes.filter(value => value.name === fileType)[0].extension;
    const filename = (extension !== 'java')
        ? CamelUi.nameFromTitle(name)
        : CamelUi.javaNameFromTitle(name)
    return (
        <Modal
            title="Create"
            variant={ModalVariant.small}
            isOpen={["create", "copy"].includes(operation)}
            onClose={closeModal}
            actions={[
                <Button key="confirm" variant="primary" onClick={event => confirmAndCloseModal()}>Save</Button>,
                <Button key="cancel" variant="secondary" onClick={event => closeModal()}>Cancel</Button>
            ]}
        >
            <Form autoComplete="off" isHorizontal className="create-file-form">
                <FormGroup label="Type" fieldId="type" isRequired>
                    <ToggleGroup aria-label="Type" isCompact>
                        {ProjectFileTypes.filter(p => props.types.includes(p.name))
                            .map(p => {
                                const title = p.title + ' (' + p.extension + ')';
                                return <ToggleGroupItem key={title} text={title} buttonId={p.name}
                                                        isSelected={fileType === p.name}
                                                        onChange={selected => {
                                                            setFileType(p.name);
                                                        }}/>
                            })}
                    </ToggleGroup>
                </FormGroup>
                <FormGroup label="Name" fieldId="name" isRequired>
                    <TextInput id="name" aria-label="name" value={name} onChange={value => setName(value)}/>
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