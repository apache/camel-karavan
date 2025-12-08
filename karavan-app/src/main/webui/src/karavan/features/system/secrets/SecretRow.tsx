import React, {useState} from 'react';
import {Badge, Button, Label} from '@patternfly/react-core';
import {Tbody, Td, Tr} from '@patternfly/react-table';
import {useSystemStore} from "../../../stores/SystemStore";
import {shallow} from "zustand/shallow";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import AddIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {SecretRowKey} from "./SecretRowKey";
import {SecretKeyModal} from "./SecretKeyModal";
import {ModalConfirmation} from "@shared/ui/ModalConfirmation";
import {SystemApi} from "../../../api/SystemApi";
import {SystemService} from "@services/SystemService";
import {useAppConfigStore} from "@stores/ProjectStore";

export interface Props {
    index: number
    secretName: string
}

export function SecretRow(props: Props) {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [secrets] = useSystemStore((s) => [s.secrets], shallow);
    const [filter] = useSystemStore((s) => [s.filter], shallow);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [isNewKeyOpen, setIsNewKeyOpen] = useState<boolean>(false);
    const [deleteOpen, setDeleteOpen] = useState<boolean>(false);

    function getSecretDataKeys(secretName: string): string[] {
        if (secrets && secrets.length > 0) {
            return Object.getOwnPropertyNames(secrets.filter(s => s.name === secretName).at(0)?.data)
                .sort((a, b) => a.localeCompare(b));
        } else {
            return [];
        }

    }

    function deleteSecret() {
        SystemApi.deleteSecret(secretName, (val: string) => {
            setDeleteOpen(false);
            SystemService.refresh();
        });
    }

    const {index, secretName} = props;
    const canDelete = secretName !== config.platformSecretName;
    return (
        <Tbody >
            <Tr key={secretName} className='secrets-data'>
                <Td noPadding modifier={"fitContent"}>
                    <Badge>Secret</Badge>
                </Td>
                <Td noPadding isActionCell expand={{
                    rowIndex: props.index,
                    isExpanded: isExpanded,
                    onToggle: () => setIsExpanded(!isExpanded),
                    expandId: 'composable-expandable-example'
                }} modifier={"fitContent"}/>
                <Td modifier='fitContent'>
                    {secretName}
                </Td>
                <Td>
                </Td>
                <Td>
                </Td>
                <Td modifier='fitContent' className='buttons'>
                    <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'end'}}>
                        <Button variant="link" onClick={event => setIsNewKeyOpen(true)} aria-label="Add">
                            <AddIcon/>
                        </Button>
                        <Button variant="plain" className={canDelete ? 'danger' : ''}
                                isDisabled={!canDelete}
                                onClick={event => setDeleteOpen(true)} aria-label="Delete"
                        >
                            <TimesIcon/>
                        </Button>
                    </div>
                </Td>
            </Tr>
            {getSecretDataKeys(secretName)
                .filter(key => key.toLowerCase().includes(filter.toLowerCase()))
                .map(key => (
                <SecretRowKey secretName={secretName} secretKey={key} key={secretName + ':' + key} isExpanded={isExpanded} />
            ))}
            <SecretKeyModal secretName={secretName}
                            isOpen={isNewKeyOpen}
                            onAfterCreate={secretKey => setIsNewKeyOpen(false)}
                            onCancel={() => setIsNewKeyOpen(false)}
            />
            <ModalConfirmation
                message={<div>
                    {"Delete secret "}
                    {<Label color='red'>{secretName}</Label>}
                    {" ?"}
                </div>}
                isOpen={deleteOpen}
                onCancel={() => setDeleteOpen(false)}
                onConfirm={() => deleteSecret()}
                btnConfirmVariant='danger'
                btnConfirm='Delete'
            />
        </Tbody>
    )
}
