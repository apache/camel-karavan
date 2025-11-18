import React, {useState} from 'react';
import {Button, Flex, FlexItem, Modal, ModalBody, ModalFooter, ModalHeader, Tooltip, TooltipPosition,} from '@patternfly/react-core';
import {useAppConfigStore, useProjectStore} from "@/api/ProjectStore";
import {ProjectService} from "@/api/ProjectService";
import {shallow} from "zustand/shallow";
import RefreshIcon from "@patternfly/react-icons/dist/esm/icons/sync-alt-icon";
import {ProjectType} from "@/api/ProjectModels";
import {KaravanApi} from "@/api/KaravanApi";
import ShareIcon from "@patternfly/react-icons/dist/esm/icons/share-alt-icon";
import {CatalogIcon} from '@patternfly/react-icons';

export function ResourceToolbar() {

    const [project] = useProjectStore((state) => [state.project], shallow)
    const {config} = useAppConfigStore();
    const [showConfirmation, setShowConfirmation] = useState<boolean>(false);

    const isConfiguration = project.projectId === ProjectType.configuration.toString();
    const isKamelets = project.projectId === ProjectType.kamelets.toString();
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
            variant={"small"}
            isOpen={showConfirmation}
            onClose={() => setShowConfirmation(false)}
            onEscapePress={e => setShowConfirmation(false)}>
            <ModalHeader title="Confirmation" />
            <ModalBody>
                <div>{confirmMessage}</div>
            </ModalBody>
            <ModalFooter>
                <Button key="confirm" variant="primary" onClick={shareConfigurations}>Confirm</Button>,
                <Button key="cancel" variant="link" onClick={_ => setShowConfirmation(false)}>Cancel</Button>
            </ModalFooter>
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
