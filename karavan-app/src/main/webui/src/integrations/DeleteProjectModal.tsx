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
import {Content, ContentVariants, HelperText, HelperTextItem, Switch} from '@patternfly/react-core';
import {useProjectStore} from "@/api/ProjectStore";
import {ProjectService} from "@/api/ProjectService";
import {shallow} from "zustand/shallow";
import {ModalConfirmation} from "@/components/ModalConfirmation";

export function DeleteProjectModal() {

    const [project, operation] = useProjectStore((s) => [s.project, s.operation], shallow);
    const [deleteContainers, setDeleteContainers] = useState(false);

    function closeModal() {
        useProjectStore.setState({operation: "none"})
    }

    function confirmAndCloseModal() {
        ProjectService.deleteProject(project, deleteContainers);
        useProjectStore.setState({operation: "none"});
    }

    const isOpen = operation === "delete";
    return (
        <ModalConfirmation
            isOpen={isOpen}
            message={
                <>
                    <Content>
                        <Content component={ContentVariants.h3}>Delete project <b>{project?.projectId}</b> ?</Content>
                        <HelperText>
                            <HelperTextItem variant="warning">
                                Project will be also deleted from <b>git</b> repository
                            </HelperTextItem>
                        </HelperText>
                        <Content component={ContentVariants.p}></Content>
                        <Content component={ContentVariants.p}></Content>
                    </Content>
                    <Switch
                        label={"Delete related container and/or deployments?"}
                        isChecked={deleteContainers}
                        onChange={(_, checked) => setDeleteContainers(checked)}
                        isReversed
                    />
                </>
            }
            btnConfirm='Delete'
            btnConfirmVariant='danger'
            onConfirm={() => confirmAndCloseModal()}
            onCancel={() => closeModal()}
        />
    )
}