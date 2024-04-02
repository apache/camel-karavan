import React from 'react';
import {
    Button,
    Modal,
    ModalVariant
} from '@patternfly/react-core';
import '../designer/karavan.css';

interface Props {
    content: string | React.JSX.Element
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title?: string
}

export function ModalDeleteConfirmation(props: Props) {

    const {title, isOpen, onClose, onConfirm, content} = props;
    return (
            <Modal
                title={title ? title : 'Confirmation'}
                variant={ModalVariant.small}
                isOpen={isOpen}
                onClose={() => onClose()}
                actions={[
                    <Button key="confirm" variant="danger" onClick={e => onConfirm()}>Confirm</Button>,
                    <Button key="cancel" variant="link"
                            onClick={e => onClose()}>Cancel</Button>
                ]}
                onEscapePress={e => onClose()}>
                {content}
            </Modal>
    )
}