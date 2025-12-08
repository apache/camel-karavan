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

import React, {useEffect} from 'react';
import {Alert, Button, Form, FormAlert, Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant} from '@patternfly/react-core';
import {useProjectsStore, useProjectStore} from "@stores/ProjectStore";
import {Project, RESERVED_WORDS} from "@models/ProjectModels";
import {isValidProjectId, nameToProjectId} from "@util/StringUtils";
import {EventBus} from "@features/integration/designer/utils/EventBus";
import {SubmitHandler, useForm} from "react-hook-form";
import {useFormUtil} from "@util/useFormUtil";
import {KaravanApi} from "@api/KaravanApi";
import {AxiosResponse} from "axios";
import {shallow} from "zustand/shallow";
import {useNavigate} from "react-router-dom";
import {ROUTES} from "@app/navigation/Routes";

export function CreateProjectModal() {

    const [project, operation, setOperation] = useProjectStore((s) => [s.project, s.operation, s.setOperation], shallow);
    const [projects, setProjects] = useProjectsStore((s) => [s.projects, s.setProjects], shallow);
    const [isReset, setReset] = React.useState(false);
    const [isProjectIdChanged, setIsProjectIdChanged] = React.useState(false);
    const [backendError, setBackendError] = React.useState<string>();
    const formContext = useForm<Project>({mode: "all"});
    const {getTextField} = useFormUtil(formContext);
    const {
        formState: {errors},
        handleSubmit,
        reset,
        trigger,
        setValue,
        getValues
    } = formContext;
    const navigate = useNavigate();

    useEffect(() => {
        const p = new Project();
        if (operation === 'copy') {
            p.projectId = project.projectId;
            p.name = project.name;
            p.type = project.type;
        }
        reset(p);
        setBackendError(undefined);
        setReset(true);
    }, [reset]);

    React.useEffect(() => {
        isReset && trigger();
    }, [trigger, isReset]);

    function closeModal() {
        setOperation("none");
    }

    const onSubmit: SubmitHandler<Project> = (data) => {
        if (operation === 'copy') {
            KaravanApi.copyProject(project.projectId, data, after)
        } else {
            KaravanApi.postProject(data, after)
        }
    }

    function after (result: boolean, res: AxiosResponse<Project> | any) {
        if (result) {
            onSuccess(res.data.projectId);
        } else {
            setBackendError(res?.response?.data);
        }
    }

    function onSuccess (projectId: string) {
        const message = operation !== "copy" ? "Integration successfully created." : "Integration successfully copied.";
        EventBus.sendAlert( "Success", message, "success");
        KaravanApi.getProjects((projects: Project[]) => {
            setProjects(projects);
            setOperation("none");
            navigate(`${ROUTES.INTEGRATIONS}/${projectId}`);
        });
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
        if (event.key === 'Enter') {
            handleSubmit(onSubmit)()
        }
    }

    function onNameChange (value: string) {
        if (!isProjectIdChanged) {
            setValue('projectId', nameToProjectId(value), {shouldValidate: true})
        }
    }
    function onIdChange (value: string) {
        setIsProjectIdChanged(true)
    }

    return (
        <Modal
            variant={ModalVariant.small}
            isOpen={["create", "copy"].includes(operation)}
            onClose={closeModal}
            onKeyDown={onKeyDown}
        >

            <ModalHeader title={operation !== 'copy' ? "Create Integration" : "Copy Integration from " + project?.projectId}/>
            <ModalBody>
                <Form isHorizontal={true} autoComplete="off">
                    {getTextField('name', 'Name', {
                        length: v => v.length > 5 || 'Integration name should be longer that 5 characters',
                    }, 'text', onNameChange)}
                    {getTextField('projectId', 'Integration ID', {
                        regex: v => isValidProjectId(v) || 'Only lowercase characters, numbers and dashes allowed',
                        length: v => v.length > 5 || 'Integration ID should be longer that 5 characters',
                        name: v => !RESERVED_WORDS.includes(v) || "Reserved word",
                        uniques: v => !projects.map(p=> p.name).includes(v) || "Integration already exists!",
                    }, 'text', onIdChange)}
                    {backendError &&
                        <FormAlert>
                            <Alert variant="danger" title={backendError} aria-live="polite" isInline />
                        </FormAlert>
                    }
                </Form>
            </ModalBody>
            <ModalFooter>
                <Button key="confirm" variant="primary"
                        onClick={handleSubmit(onSubmit)}
                        isDisabled={Object.getOwnPropertyNames(errors).length > 0}
                >
                    Save
                </Button>
                <Button key="cancel" variant="secondary" onClick={closeModal}>Cancel</Button>
            </ModalFooter>
        </Modal>
    )
}