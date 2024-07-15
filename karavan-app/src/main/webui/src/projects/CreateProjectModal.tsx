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
import {
    Alert,
    Button,
    Form, FormAlert,
    Modal,
    ModalVariant,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {useProjectsStore, useProjectStore} from "../api/ProjectStore";
import {ProjectService} from "../api/ProjectService";
import {Project} from "../api/ProjectModels";
import {isValidProjectId} from "../util/StringUtils";
import {EventBus} from "../designer/utils/EventBus";
import {SubmitHandler, useForm} from "react-hook-form";
import {useFormUtil} from "../util/useFormUtil";
import {KaravanApi} from "../api/KaravanApi";
import {AxiosResponse} from "axios";
import {shallow} from "zustand/shallow";

export function CreateProjectModal() {

    const [project, operation, setOperation] = useProjectStore((s) => [s.project, s.operation, s.setOperation], shallow);
    const [projects] = useProjectsStore((s) => [s.projects], shallow);
    const [isReset, setReset] = React.useState(false);
    const [backendError, setBackendError] = React.useState<string>();
    const formContext = useForm<Project>({mode: "all"});
    const {getTextField} = useFormUtil(formContext);
    const {
        formState: {errors},
        handleSubmit,
        reset,
        trigger
    } = formContext;

    useEffect(() => {
        reset(new Project());
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
            onSuccess(res.projectId);
        } else {
            setBackendError(res?.response?.data);
        }
    }

    function onSuccess (projectId: string) {
        const message = operation !== "copy" ? "Project successfully created." : "Project successfully copied.";
        EventBus.sendAlert( "Success", message, "success");
        ProjectService.refreshProjectData(projectId);
        ProjectService.refreshProjects();
        setOperation("none");
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
        if (event.key === 'Enter') {
            handleSubmit(onSubmit)()
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
                <Button key="confirm" variant="primary"
                        onClick={handleSubmit(onSubmit)}
                        isDisabled={Object.getOwnPropertyNames(errors).length > 0}
                >
                    Save
                </Button>,
                <Button key="cancel" variant="secondary" onClick={closeModal}>Cancel</Button>
            ]}
            className="new-project"
        >
            <Form isHorizontal={true} autoComplete="off">
                {getTextField('projectId', 'ProjectID', {
                    regex: v => isValidProjectId(v) || 'Only lowercase characters, numbers and dashes allowed',
                    length: v => v.length > 5 || 'Project ID should be longer that 5 characters',
                    name: v => !['templates', 'kamelets', 'karavan'].includes(v) || "'templates', 'kamelets', 'karavan' can't be used as project",
                    uniques: v => !projects.map(p=> p.name).includes(v) || "Project already exists!",
                })}
                {getTextField('name', 'Name', {
                    length: v => v.length > 5 || 'Project name should be longer that 5 characters',
                })}
                {backendError &&
                    <FormAlert>
                        <Alert variant="danger" title={backendError} aria-live="polite" isInline />
                    </FormAlert>
                }
            </Form>
        </Modal>
    )
}