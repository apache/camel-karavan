import React, {useState} from 'react';
import {
    Button, Form, FormGroup, FormHelperText, HelperText, HelperTextItem,
    Modal,
    ModalVariant, TextInput, ToggleGroup, ToggleGroupItem,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {useAppConfigStore, useProjectStore} from "../api/ProjectStore";
import {ProjectService} from "../api/ProjectService";
import {Project} from "../api/ProjectModels";
import {QuarkusIcon, SpringIcon, CamelIcon} from "../designer/utils/KaravanIcons";
import {CamelUi} from "../designer/utils/CamelUi";


export const CreateProjectModal = () => {

    const {project, operation} = useProjectStore();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [projectId, setProjectId] = useState('');
    const {config} = useAppConfigStore();
    const [runtime, setRuntime] = useState(config.runtime);

    function cleanValues() {
        setName("");
        setDescription("");
        setRuntime(config.runtime);
        setProjectId("");
    }

    function closeModal() {
        useProjectStore.setState({operation: "none"});
        cleanValues();
    }

    function confirmAndCloseModal() {
        ProjectService.createProject(new Project({name: name, description: description, runtime: runtime, projectId: projectId}));
        useProjectStore.setState({operation: "none"});
        cleanValues();
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
        if (event.key === 'Enter' && name !== undefined && description !== undefined && projectId !== undefined) {
            confirmAndCloseModal();
        }
    }

    function getIcon(runtime: string) {
        if (runtime === 'quarkus') return QuarkusIcon();
        else if (runtime === 'spring-boot') return SpringIcon();
        else if (runtime === 'camel-main') return CamelIcon();
    }

    function getTitle(runtime: string) {
        if (runtime === 'quarkus') return "Quarkus";
        else if (runtime === 'spring-boot') return "Spring";
        else if (runtime === 'camel-main') return "Camel";
    }

    const runtimes = config.runtimes;
    const defaultRuntime = config.runtime;
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
                               onChange={(_, e) => setName(e)}/>
                </FormGroup>
                <FormGroup label="Description" fieldId="description" isRequired>
                    <TextInput className="text-field" type="text" id="description" name="description"
                               value={description}
                               onChange={(_, e) => setDescription(e)}/>
                </FormGroup>
                <FormGroup label="Project ID" fieldId="projectId" isRequired>
                    <TextInput className="text-field" type="text" id="projectId" name="projectId"
                               value={projectId}
                               onFocus={e => setProjectId(projectId === '' ? CamelUi.nameFromTitle(name) : projectId)}
                               onChange={(_, e) => setProjectId(CamelUi.nameFromTitle(e))}/>
                    <FormHelperText>
                        <HelperText>
                            <HelperTextItem>Unique project name</HelperTextItem>
                        </HelperText>
                    </FormHelperText>
                </FormGroup>
                <FormGroup label="Runtime" fieldId="runtime" isRequired>
                    <ToggleGroup>
                        {runtimes?.map((r: string) => (
                            <ToggleGroupItem key={r} id={r} name={r}
                                             aria-label="runtime"
                                             isSelected={r === runtime}
                                             text={getTitle(r)}
                                             icon={getIcon(r)}
                                              onChange={(_, checked) => {
                                                 if (checked) setRuntime(r)
                                             }}
                            />
                        ))}
                    </ToggleGroup>
                </FormGroup>
            </Form>
        </Modal>
    )
}