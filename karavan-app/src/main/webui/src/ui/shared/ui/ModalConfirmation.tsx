/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, {useEffect, useRef} from 'react';
import {Button, Modal, ModalBody, ModalFooter, ModalHeader} from '@patternfly/react-core';

export interface ModalConfirmationProps {
    isOpen: boolean
    title?: string
    message: React.ReactNode
    btnConfirm?: string
    btnConfirmVariant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'warning' | 'link' | 'plain' | 'control';
    btnCancel?: string
    btnCancelVariant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'warning' | 'link' | 'plain' | 'control';
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'small' | 'medium' | 'large' | 'default';
}

export function ModalConfirmation(props: ModalConfirmationProps) {

    const {title, isOpen, message, onConfirm, onCancel, btnConfirm, btnCancel, btnConfirmVariant, btnCancelVariant, variant} = props;

    // 1. Create a ref for the button
    const confirmBtnRef = useRef<HTMLButtonElement>(null);

    // 2. Focus the button when the modal opens
    useEffect(() => {
        if (isOpen) {
            // A small timeout ensures the modal DOM is ready before focusing
            const timer = setTimeout(() => {
                confirmBtnRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    return (
        <Modal
            variant={variant ?? "small"}
            isOpen={isOpen}
            onClose={() => onCancel()}
            onEscapePress={e => onCancel()}>
            <ModalHeader title={title || 'Confirmation'}/>
            <ModalBody>
                {message}
            </ModalBody>
            <ModalFooter>
                <Button
                    ref={confirmBtnRef} // 3. Attach the ref here
                    key="confirm"
                    variant={btnConfirmVariant || 'primary'}
                    onClick={event => onConfirm()}
                >
                    {btnConfirm || 'Confirm'}
                </Button>
                <Button key="cancel" variant={btnCancelVariant || 'secondary'} onClick={e => onCancel()}>
                    {btnCancel || 'Cancel'}
                </Button>
            </ModalFooter>
        </Modal>
    )
}