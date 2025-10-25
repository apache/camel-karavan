import {Buffer} from "buffer";
import React, {useState} from 'react';
import {Button, Label, TextArea, TextInput} from '@patternfly/react-core';
import {Td, Tr} from '@patternfly/react-table';
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import ShowIcon from "@patternfly/react-icons/dist/esm/icons/eye-icon";
import HideIcon from "@patternfly/react-icons/dist/esm/icons/eye-slash-icon";
import EditIcon from "@patternfly/react-icons/dist/esm/icons/edit-icon";
import SaveIcon from "@patternfly/react-icons/dist/esm/icons/save-icon";
import {SystemApi} from "./SystemApi";
import {SystemService} from "./SystemService";
import {ModalConfirmation} from "@/components/ModalConfirmation";
import {useAppConfigStore} from "@/api/ProjectStore";
import {shallow} from "zustand/shallow";

const DEFAULT_VALUE = "**********************"

export interface Props {
    secretName: string
    secretKey: string
    isExpanded: boolean
}

export function SecretRowKey(props: Props) {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [value, setValue] = useState<string>(DEFAULT_VALUE);
    const [showValue, setShowValue] = useState<boolean>(false);
    const [edit, setEdit] = useState<boolean>(false);
    const [deleteOpen, setDeleteOpen] = useState<boolean>(false);

    function saveSecretValue() {
        SystemApi.setSecretValue(secretName, secretKey, value, (val: string) => {
            setEdit(false);
        });
    }

    function deleteSecretValue() {
        SystemApi.deleteSecretValue(secretName, secretKey, (val: string) => {
            setDeleteOpen(false);
            SystemService.refresh();
        });
    }

    function showValueData() {
        if (showValue) {
            setShowValue(false)
        } else {
            SystemApi.getSecretValue(secretName, secretKey, (val: string) => {
                setValue(Buffer.from(val, 'base64').toString('binary'));
                setShowValue(true);
            });
        }
    }

    const {secretKey, secretName, isExpanded} = props;
    const canDelete = secretName !== config.platformSecretName;
    return (
        <Tr isExpanded={isExpanded} className='fields-data'>
            <Td />
            <Td />
            <Td />
            <Td modifier='fitContent'>{secretKey}</Td>
            <Td>
                {!edit &&
                    <TextInput id={secretName + ":" + secretKey}
                               isDisabled={!edit}
                               autoComplete={'off'}
                               type='text'
                               value={showValue ? value : DEFAULT_VALUE} onChange={(_event, value) => setValue(value)}
                    />
                }
                {edit &&
                    <TextArea id={secretName + ":" + secretKey}
                              isDisabled={!edit}
                              autoComplete={'off'}
                              type='text'
                              value={showValue ? value : DEFAULT_VALUE} onChange={(_event, value) => setValue(value)}
                    />
                }
            </Td>
            <Td modifier='fitContent' className='buttons'>
                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'end'}}>
                    <Button variant="plain" onClick={event => showValueData()} aria-label="Show">
                        {!showValue ? <ShowIcon/> : <HideIcon/>}
                    </Button>
                    {!edit &&
                        <Button variant="plain" onClick={event => setEdit(true)} aria-label="Edit">
                            <EditIcon />
                        </Button>
                    }
                    {edit &&
                        <Button variant="plain" onClick={event => saveSecretValue()} aria-label="Save">
                            <SaveIcon/>
                        </Button>
                    }
                    <Button variant="plain" className={canDelete ? 'danger' : ''}
                            isDisabled={!canDelete}
                            onClick={event => setDeleteOpen(true)} aria-label="Delete">
                        <TimesIcon />
                    </Button>
                </div>
                <ModalConfirmation
                    message={<div>
                        {"Delete key "}
                        <Label color='red'>{secretKey}</Label>
                        {" from secret "}
                        {<Label color='red'>{secretName}</Label>}
                        {" ?"}
                    </div>}
                    isOpen={deleteOpen}
                    onCancel={() => setDeleteOpen(false)}
                    onConfirm={() => deleteSecretValue()}
                    btnConfirmVariant='danger'
                    btnConfirm='Delete'
                />
            </Td>
        </Tr>
    )
}
