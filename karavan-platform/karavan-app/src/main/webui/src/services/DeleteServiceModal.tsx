import React from 'react';
import {
    Button,
    Modal,
    ModalVariant,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {useProjectStore} from "../api/ProjectStore";
import {ProjectService} from "../api/ProjectService";

export const DeleteServiceModal = () => {

    const {project, operation} = useProjectStore();

    function closeModal () {
        useProjectStore.setState({operation: "none"})
    }

    function confirmAndCloseModal () {
        ProjectService.deleteProject(project);
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
                    <Button key="confirm" variant="primary" onClick={e => confirmAndCloseModal()}>Delete</Button>,
                    <Button key="cancel" variant="link"
                            onClick={e => closeModal()}>Cancel</Button>
                ]}
                onEscapePress={e => closeModal()}>
                <div>{"Are you sure you want to delete the project " + project?.projectId + "?"}</div>
            </Modal>
            // }
            // {(this.state.isProjectDeploymentModalOpen === true) && <Modal
            //     variant={ModalVariant.small}
            //     isOpen={this.state.isProjectDeploymentModalOpen}
            //     onClose={() => this.setState({ isProjectDeploymentModalOpen: false })}
            //     onEscapePress={e => this.setState({ isProjectDeploymentModalOpen: false })}>
            //     <div>
            //         <Alert key={this.state.projectToDelete?.projectId} className="main-alert" variant="warning"
            //                title={"Deployment is Running!!"} isInline={true} isPlain={true}>
            //             {"Delete the deployment (" + this.state.projectToDelete?.projectId + ")" + " first."}
            //         </Alert>
            //     </div>
            // </Modal>
    )
}