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
    Button,
    Flex,
    FlexItem, Modal, Tooltip, TooltipPosition,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {useAppConfigStore, useProjectStore} from "../api/ProjectStore";
import {ProjectService} from "../api/ProjectService";
import {shallow} from "zustand/shallow";
import RefreshIcon from "@patternfly/react-icons/dist/esm/icons/sync-alt-icon";
import {ProjectType} from "../api/ProjectModels";
import {KaravanApi} from "../api/KaravanApi";
import ShareIcon from "@patternfly/react-icons/dist/esm/icons/share-alt-icon";


export function ResourceToolbar() {

    const [project] = useProjectStore((state) => [state.project], shallow)
    const {config} = useAppConfigStore();
    const [showConfirmation, setShowConfirmation] = useState<boolean>(false);

    const isConfiguration = project.projectId === ProjectType.configuration.toString();
    const isKubernetes = config.infrastructure === 'kubernetes';
    const tooltip = isKubernetes ? "Save All Configmaps" : "Save all on shared volume";
    const confirmMessage = isKubernetes ? "Save all configurations as Configmaps" : "Save all configurations on shared volume";

    function shareConfigurations () {
        KaravanApi.shareConfigurations(res => {});
        setShowConfirmation(false);
    }

    function getConfirmation() {
        return (<Modal
            className="modal-confirm"
            title="Confirmation"
            variant={"small"}
            isOpen={showConfirmation}
            onClose={() => setShowConfirmation(false)}
            actions={[
                <Button key="confirm" variant="primary" onClick={shareConfigurations}>Confirm</Button>,
                <Button key="cancel" variant="link" onClick={_ => setShowConfirmation(false)}>Cancel</Button>
            ]}
            onEscapePress={e => setShowConfirmation(false)}>
            <div>{confirmMessage}</div>
        </Modal>)
    }

    return (
        <Flex className="toolbar" direction={{default: "row"}} alignItems={{default: "alignItemsCenter"}}>
            {showConfirmation && getConfirmation()}
            <FlexItem>
                <Button icon={<RefreshIcon/>}
                        variant={"link"}
                        onClick={e => ProjectService.refreshProjectData(project.projectId)}
                />
                {isConfiguration &&
                <Tooltip content={tooltip} position={TooltipPosition.bottom}>
                    <Button variant="primary" icon={<ShareIcon/>}
                            onClick={_ => setShowConfirmation(true)}>
                        Share all
                    </Button>
                </Tooltip>
                }
            </FlexItem>
        </Flex>
    );
}
