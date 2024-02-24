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
    Button, Modal,
} from '@patternfly/react-core';
import '../karavan.css';
import {useRouteDesignerHook} from "./useRouteDesignerHook";
import {useDesignerStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";

export function DeleteConfirmation() {


    const {deleteElement} = useRouteDesignerHook();

    const [showDeleteConfirmation, deleteMessage , setShowDeleteConfirmation] =
        useDesignerStore((s) => [s.showDeleteConfirmation, s.deleteMessage, s.setShowDeleteConfirmation], shallow)

    return (
        <Modal
            className="modal-delete"
            title="Confirmation"
            isOpen={showDeleteConfirmation}
            onClose={() => setShowDeleteConfirmation(false)}
            actions={[
                <Button key="confirm" variant="primary" onClick={e => deleteElement()}>Delete</Button>,
                <Button key="cancel" variant="link"
                        onClick={e => setShowDeleteConfirmation(false)}>Cancel</Button>
            ]}
            onEscapePress={e => setShowDeleteConfirmation(false)}>
            <div>
                {deleteMessage}
            </div>
        </Modal>
    )
}