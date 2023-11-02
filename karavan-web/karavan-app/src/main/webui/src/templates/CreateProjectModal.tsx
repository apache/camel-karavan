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

import React, {useState} from 'react';
import {
    Button, Form, FormGroup, FormHelperText, HelperText, HelperTextItem,
    Modal,
    ModalVariant, TextInput
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {useProjectStore} from "../api/ProjectStore";
import {ProjectService} from "../api/ProjectService";
import {Project} from "../api/ProjectModels";
import {CamelUi} from "../designer/utils/CamelUi";


export function CreateProjectModal () {

    const {project, operation} = useProjectStore();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [projectId, setProjectId] = useState('');

    function cleanValues() {
        setName("");
        setDescription("");
        setProjectId("");
    }

    function closeModal() {
        useProjectStore.setState({operation: "none"});
        cleanValues();
    }

    function confirmAndCloseModal() {
        operation !== 'copy' ?
            ProjectService.createProject(new Project({name: name, description: description, projectId: projectId})) :
            ProjectService.copyProject(project?.projectId, new Project({name: name, description: description, projectId: projectId}));
        useProjectStore.setState({operation: "none"});
        cleanValues();
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
        if (event.key === 'Enter' && name !== undefined && description !== undefined && projectId !== undefined) {
            confirmAndCloseModal();
        }
    }

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
            </Form>
        </Modal>
    )
}