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
    Button,
    Flex,
    Modal, ModalVariant,
} from '@patternfly/react-core';
import '../../karavan.css';
import {useDesignerStore, useIntegrationStore} from "../../DesignerStore";
import {shallow} from "zustand/shallow";
import {useRouteDesignerHook} from "../useRouteDesignerHook";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";

export function DslElementMoveModal() {

    const {moveElement} = useRouteDesignerHook();
    const [integration] = useIntegrationStore((s) => [s.integration, s.setIntegration], shallow)
    const [ showMoveConfirmation, setShowMoveConfirmation, moveElements, setMoveElements] =
        useDesignerStore((s) =>
            [s.showMoveConfirmation, s.setShowMoveConfirmation, s.moveElements, s.setMoveElements], shallow)

    function confirmMove(asChild: boolean) {
        const sourceUuid = moveElements[0];
        const targetUuid = moveElements[1];
        if (sourceUuid && targetUuid && sourceUuid !== targetUuid) {
            moveElement(sourceUuid, targetUuid, asChild);
            cancelMove();
        }
    }

    function cancelMove() {
        setShowMoveConfirmation(false);
        setMoveElements([undefined, undefined]);
    }

    function canReplace() {
        const targetUuid = moveElements[1];
        if (targetUuid) {
            const targetElement = CamelDefinitionApiExt.findElementInIntegration(integration, targetUuid);
            if (targetElement) {
                return  !['WhenDefinition', 'OtherwiseDefinition'].includes(targetElement?.dslName);
            }
        }
        return true;
    }

    return (
        <Modal
            aria-label="title"
            className='move-modal'
            isOpen={showMoveConfirmation}
            onClose={event => cancelMove()}
            variant={ModalVariant.small}
        >
            <Flex direction={{default: "column"}}>
                <div>Select move type:</div>
                {canReplace() && <Button key="place" variant="primary" onClick={event => confirmMove(false)}
                >
                    Replace (target down)
                </Button>}
                <Button key="child" variant="secondary" onClick={event => confirmMove(true)}>Set as child</Button>
                <Button key="cancel" variant="tertiary" onClick={event => cancelMove()}>Cancel</Button>
            </Flex>
        </Modal>
    )
}
