import React, {useEffect} from 'react';
import {Button, Content, ContentVariants, Modal, ModalFooter, ModalVariant, ToggleGroup, ToggleGroupItem,} from '@patternfly/react-core';
import '@features/integration/designer/karavan.css';
import {useFileStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {KaravanApi} from "@api/KaravanApi";
import {ProjectService} from "@services/ProjectService";

interface Props{
    show: boolean
    environments: string[]
    close: () => void
}

export function FileCopyForEnvModal(props: Props) {

    const [file] = useFileStore((s) => [s.file], shallow);
    const [envSelected, setEnvSelected] = React.useState<string>();
    const {show, environments, close} = props;

    useEffect(() => {
        if (environments.length === 1) {
            setEnvSelected(environments[0]);
        }
    }, []);

    function closeModal() {
        useFileStore.setState({operation: "none"})
        close();
    }

    function confirmAndCloseModal() {
        if (file && envSelected) {
            KaravanApi.copyProjectFile(file.projectId, file.name, file.projectId,envSelected + "." + file.name, false, res => {
                ProjectService.refreshProjectFiles(file.projectId);
                closeModal();
            })
        }
    }

    function getEnvs() {
        return (
            <ToggleGroup isCompact aria-label="Environment selector">
                {environments.filter(env => env !== 'dev').map(env => (
                    <ToggleGroupItem key={env}
                                     text={env}
                                     buttonId={env}
                                     isSelected={env === envSelected}
                                     onChange={(event, selected) => setEnvSelected(env)}
                    />
                ))}
            </ToggleGroup>
        )
    }

    return (
        <Modal
            title="Confirmation"
            variant={ModalVariant.small}
            isOpen={show}
            onClose={() => closeModal()}
            onEscapePress={e => closeModal()}>
            <div style={{display: 'flex', flexDirection: 'row', gap: '6px', alignItems: 'center'}}>
                
                    <Content component={ContentVariants.h3}>Copy <b>{file?.name}</b> for</Content>
                
                {getEnvs()}
                
                    <Content component={ContentVariants.h3}> environment?</Content>
                
            </div>
            <ModalFooter>
                <Button key="confirm" variant="primary" isDisabled={envSelected === undefined} onClick={e => confirmAndCloseModal()}>Copy</Button>,
                <Button key="cancel" variant="link"
                        onClick={e => closeModal()}>Cancel</Button>
            </ModalFooter>
        </Modal>
    )
}