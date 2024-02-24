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

import React from 'react';
import {
    Button, HelperText, HelperTextItem,
    Modal,
    ModalVariant, Text, TextContent, TextVariants,
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {useFileStore} from "../../api/ProjectStore";
import {ProjectService} from "../../api/ProjectService";
import { KameletApi } from 'karavan-core/lib/api/KameletApi';

export function DeleteFileModal () {

    const {file, operation} = useFileStore();

    function closeModal () {
        useFileStore.setState({operation: "none"})
    }

    function isKameletsProject(): boolean {
        return file?.name.includes ('kamelet.yaml') || false;
    }

    function confirmAndCloseModal() {
        if (file) ProjectService.deleteFile(file);
        if (isKameletsProject()) KameletApi.removeKamelet(file?.code || '');
        useFileStore.setState({operation: "none"});
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
                    <Text component={TextVariants.h3}>Delete file <b>{file?.name}</b> ?</Text>
                    <HelperText>
                        <HelperTextItem variant="warning">
                            File will be also deleted from <b>git</b> repository
                        </HelperTextItem>
                    </HelperText>
                </TextContent>
            </Modal>
    )
}