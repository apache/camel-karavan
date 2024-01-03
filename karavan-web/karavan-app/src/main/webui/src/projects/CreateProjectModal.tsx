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
    Alert,
    Button,
    Divider,
    Form,
    FormGroup,
    Grid,
    Modal,
    ModalVariant,
    Text,
    TextInput
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {useProjectStore} from "../api/ProjectStore";
import {ProjectService} from "../api/ProjectService";
import {Project} from "../api/ProjectModels";
import {CamelUi} from "../designer/utils/CamelUi";
import {isEmpty} from "../util/StringUtils";
import {EventBus} from "../designer/utils/EventBus";
import {useResponseErrorHandler} from "../shared/error/UseResponseErrorHandler";
import {useForm} from "react-hook-form";
import * as yup from 'yup';
import {yupResolver} from '@hookform/resolvers/yup';
import {AxiosError} from "axios";

export function CreateProjectModal () {

    const formValidationSchema = yup.object().shape({
        name: yup
            .string()
            .required("Project name is required"),
        description: yup
            .string()
            .required("Project description is required"),
        projectId: yup
            .string()
            .required("Project ID is required")
            .notOneOf(['templates', 'kamelets'], "'templates' or 'kamelets' can't be used as project ID")
    });

    const defaultFormValues = {
        name: "",
        description: "",
        projectId: ""
    };

    const responseToFormErrorFields = new Map<string, string>([
        ["projectId", "projectId"],
        ["name", "name"],
        ["description", "description"]
    ]);

    const {
        register,
        setError,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm({
        resolver: yupResolver(formValidationSchema),
        mode: "onChange",
        defaultValues: defaultFormValues
    });

    const {project, operation, setOperation} = useProjectStore();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [projectId, setProjectId] = useState('');
    const [globalErrors, registerResponseErrors, resetGlobalErrors] = useResponseErrorHandler(
        responseToFormErrorFields,
        setError
    );

    function resetForm() {
        resetGlobalErrors();
        reset(defaultFormValues);
    }

    function closeModal() {
        setOperation("none");
        resetForm();
    }

    function handleFormSubmit() {
        const action = operation !== "copy" ?
            ProjectService.createProject(new Project({name: name, description: description, projectId: projectId})) :
            ProjectService.copyProject(project?.projectId, new Project({name: name, description: description, projectId: projectId}))

        return action
            .then(() => handleOnFormSubmitSuccess())
            .catch((error) => handleOnFormSubmitFailure(error));
    }

    function handleOnFormSubmitSuccess () {
        const message = operation !== "copy" ? "Project successfully created." : "Project successfully copied.";

        EventBus.sendAlert( "Success", message, "success");
        ProjectService.refreshProjectData(projectId);
        ProjectService.refreshProjects();
        setOperation("none");
        resetForm();
    }

    function handleOnFormSubmitFailure(error: AxiosError) {
        registerResponseErrors(error);
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
        if (event.key === 'Enter' && !isEmpty(name) && !isEmpty(description) && !isEmpty(projectId)) {
            handleFormSubmit();
        }
    }

    return (
        <Modal
            title={operation !== 'copy' ? "Create new project" : "Copy project from " + project?.projectId}
            variant={ModalVariant.small}
            isOpen={["create", "copy"].includes(operation)}
            onClose={closeModal}
            onKeyDown={onKeyDown}
            actions={[
                <Button key="confirm" variant="primary" onClick={handleSubmit(handleFormSubmit)}>Save</Button>,
                <Button key="cancel" variant="secondary" onClick={closeModal}>Cancel</Button>
            ]}
            className="new-project"
        >
            <Form isHorizontal={true} autoComplete="off">
                <FormGroup label="Name" fieldId="name" isRequired>
                    <TextInput className="text-field" type="text" id="name"
                               value={name}
                               validated={!!errors.name ? 'error' : 'default'}
                               {...register('name')}
                               onChange={(e, v) => {
                                   setName(v);
                                   register('name').onChange(e);
                               }}
                    />
                    {!!errors.name && <Text  style={{ color: 'red', fontStyle: 'italic'}}>{errors?.name?.message}</Text>}
                </FormGroup>
                <FormGroup label="Description" fieldId="description" isRequired>
                    <TextInput className="text-field" type="text" id="description"
                               value={description}
                               validated={!!errors.description ? 'error' : 'default'}
                               {...register('description')}
                               onChange={(e, v) => {
                                   setDescription(v);
                                   register('description').onChange(e);
                               }}
                    />
                    {!!errors.description && <Text  style={{ color: 'red', fontStyle: 'italic'}}>{errors?.description?.message}</Text>}
                </FormGroup>
                <FormGroup label="Project ID" fieldId="projectId" isRequired>
                    <TextInput className="text-field" type="text" id="projectId"
                               value={projectId}
                               onFocus={e => setProjectId(projectId === '' ? CamelUi.nameFromTitle(name) : projectId)}
                               validated={!!errors.projectId ? 'error' : 'default'}
                               {...register('projectId')}
                               onChange={(e, v) => {
                                   setProjectId(CamelUi.nameFromTitle(v));
                                   register('projectId').onChange(e);
                               }}
                    />
                    {!!errors.projectId && <Text  style={{ color: 'red', fontStyle: 'italic'}}>{errors?.projectId?.message}</Text>}
                </FormGroup>
                <Grid>
                    {globalErrors &&
                        globalErrors.map((error) => (
                            <Alert title={error} key={error} variant="danger"></Alert>
                        ))}
                    <Divider role="presentation" />
                </Grid>
            </Form>
        </Modal>
    )
}