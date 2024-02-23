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
    Button, HelperText, HelperTextItem,
    Modal,
    ModalVariant, Switch, Text, TextContent, TextVariants,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {useProjectStore} from "../api/ProjectStore";
import {ProjectService} from "../api/ProjectService";
import ExclamationIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-icon';

export function DeleteProjectModal () {

    const {project, operation} = useProjectStore();
    const [deleteContainers, setDeleteContainers] = useState(false);

    function closeModal () {
        useProjectStore.setState({operation: "none"})
    }

    function confirmAndCloseModal () {
        ProjectService.deleteProject(project, deleteContainers);
        useProjectStore.setState({operation: "none"});
    }

    const isOpen= operation === "delete";
    return (
            <Modal
                title="Confirmation"
                variant={ModalVariant.small}
                isOpen={isOpen}
                onClose={() => closeModal()}
                actions={[
                    <Button key="confirm" variant="danger" onClick={e => confirmAndCloseModal()}>Delete</Button>,
                    <Button key="cancel" variant="link"
                            onClick={e => closeModal()}>Cancel</Button>
                ]}
                onEscapePress={e => closeModal()}>
                    <TextContent>
                        <Text component={TextVariants.h3}>Delete project <b>{project?.projectId}</b> ?</Text>
                        <HelperText>
                            <HelperTextItem variant="warning">
                                Project will be also deleted from <b>git</b> repository
                            </HelperTextItem>
                        </HelperText>
                        <Text component={TextVariants.p}></Text>
                        <Text component={TextVariants.p}></Text>
                    </TextContent>
                    <Switch
                        label={"Delete related container and/or deployments?"}
                        isChecked={deleteContainers}
                        onChange={(_, checked) => setDeleteContainers(checked)}
                        isReversed
                    />
            </Modal>
    )
}