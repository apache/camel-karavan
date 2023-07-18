import React, {useState} from 'react';
import {
    Button, Form, FormGroup,
    Modal,
    ModalVariant, Radio, TextInput,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {useAppConfigStore, useProjectStore} from "../api/ProjectStore";
import {ProjectService} from "../api/ProjectService";
import {Project} from "../api/ProjectModels";
import {QuarkusIcon, SpringIcon} from "../designer/utils/KaravanIcons";
import {CamelUi} from "../designer/utils/CamelUi";


export const CreateServiceModal = () => {

    const {project, operation} = useProjectStore();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [runtime, setRuntime] = useState('');
    const [projectId, setProjectId] = useState('');
    const {config} = useAppConfigStore();

    function cleanValues()  {
        setName("");
        setDescription("");
        setRuntime("");
        setProjectId("");
    }

    function closeModal () {
        useProjectStore.setState({operation: "none"});
        cleanValues();
    }

    function confirmAndCloseModal () {
        ProjectService.createProject(new Project({name: name, description: description, runtime: runtime, projectId: projectId}));
        useProjectStore.setState({operation: "none"});
        cleanValues();
    }

    function onKeyDown (event: React.KeyboardEvent<HTMLDivElement>): void {
        if (event.key === 'Enter' && name !== undefined && description !== undefined && projectId !== undefined) {
            confirmAndCloseModal();
        }
    }

    const runtimes = config.runtimes;
    const isReady = projectId && name && description && !['templates', 'kamelets'].includes(projectId);
    return (
        <Modal
            title={operation !== 'copy' ? "Create new project" : "Copy project from " + project?.projectId}
            variant={ModalVariant.small}
            isOpen={["create", "copy"].includes(operation)}
            onClose={closeModal}
            onKeyDown={onKeyDown}
            actions={[
                <Button key="confirm" variant="primary" isDisabled={!isReady}
                        onClick={confirmAndCloseModal}>Save</Button>,
                <Button key="cancel" variant="secondary" onClick={closeModal}>Cancel</Button>
            ]}
            className="new-project"
        >
            <Form isHorizontal={true} autoComplete="off">
                <FormGroup label="Name" fieldId="name" isRequired>
                    <TextInput className="text-field" type="text" id="name" name="name"
                               value={name}
                               onChange={e => setName(e)}/>
                </FormGroup>
                <FormGroup label="Description" fieldId="description" isRequired>
                    <TextInput className="text-field" type="text" id="description" name="description"
                               value={description}
                               onChange={e => setDescription(e)}/>
                </FormGroup>
                <FormGroup label="Project ID" fieldId="projectId" isRequired helperText="Unique project name">
                    <TextInput className="text-field" type="text" id="projectId" name="projectId"
                               value={projectId}
                               onFocus={e => setProjectId(projectId === '' ? CamelUi.nameFromTitle(name) : projectId)}
                               onChange={e => setProjectId(CamelUi.nameFromTitle(e))}/>
                </FormGroup>
                <FormGroup label="Runtime" fieldId="runtime" isRequired>
                    {runtimes?.map((r: string) => (
                        <Radio key={r} id={r} name={r} className="radio" aria-label="runtime"
                               isChecked={r === runtime}
                               onChange={checked => {
                                   if (checked) setRuntime(r)
                               }}
                               body={
                                   <div className="runtime-radio">
                                       {r === 'quarkus' ? QuarkusIcon() : SpringIcon()}
                                       <div className="runtime-label">{CamelUtil.capitalizeName(r)}</div>
                                   </div>}
                        />
                    ))}
                </FormGroup>
            </Form>
        </Modal>
    )
}