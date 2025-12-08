import React, {useState} from 'react';
import {Button, Flex, FlexItem, Modal, ModalBody, ModalFooter, ModalHeader,} from '@patternfly/react-core';
import {useAppConfigStore, useFileStore, useProjectStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {ProjectType} from "@models/ProjectModels";
import {KaravanApi} from "@api/KaravanApi";
import {CatalogIcon} from '@patternfly/react-icons';
import {EditorToolbar} from "@features/integration/developer/EditorToolbar";

export function SettingsToolbar() {

    const [project] = useProjectStore((state) => [state.project], shallow)
    const [file, operation] = useFileStore((state) => [state.file, state.operation], shallow)
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

    function getToolbar() {
        if (file !== undefined && isConfiguration) {
            return (<EditorToolbar/>)
        } else {
            return (
                <Flex className="toolbar" direction={{default: "row"}} alignItems={{default: "alignItemsCenter"}}>
                    {showConfirmation && getConfirmation()}
                </Flex>
            )
        }
    }

    return getToolbar();
}
