import React from 'react';
import {
    Button,
    Modal,
    ModalVariant,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {useFileStore} from "../api/ProjectStore";
import {ProjectService} from "../api/ProjectService";

export const DeleteFileModal = () => {

    const {file, operation} = useFileStore();

    function closeModal () {
        useFileStore.setState({operation: "none"})
    }

    function confirmAndCloseModal () {
        if (file) ProjectService.deleteFile(file);
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
                    <Button key="confirm" variant="primary" onClick={e => confirmAndCloseModal()}>Delete</Button>,
                    <Button key="cancel" variant="link"
                            onClick={e => closeModal()}>Cancel</Button>
                ]}
                onEscapePress={e => closeModal()}>
                <div>{"Are you sure you want to delete file " + file?.name + "?"}</div>
            </Modal>
    )
}