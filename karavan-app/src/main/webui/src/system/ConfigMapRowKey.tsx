import React, {useState} from 'react';
import {Button, Label, TextArea, TextInput} from '@patternfly/react-core';
import {Td, Tr} from '@patternfly/react-table';
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import EditIcon from "@patternfly/react-icons/dist/esm/icons/edit-icon";
import SaveIcon from "@patternfly/react-icons/dist/esm/icons/save-icon";
import UndoIcon from "@patternfly/react-icons/dist/esm/icons/undo-icon";
import {SystemApi} from "./SystemApi";
import {SystemService} from "./SystemService";
import {ModalConfirmation} from "@/components/ModalConfirmation";
import {useAppConfigStore} from "@/api/ProjectStore";
import {shallow} from "zustand/shallow";

export interface Props {
    configmapName: string
    configmapKey: string
    configmapValue: string
    isExpanded: boolean
}

export function ConfigMapRowKey(props: Props) {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [value, setValue] = useState<string>(props.configmapValue);
    const [edit, setEdit] = useState<boolean>(false);
    const [deleteOpen, setDeleteOpen] = useState<boolean>(false);

    function saveConfigMapValue() {
        SystemApi.setConfigMapValue(configmapName, configmapKey, value, (val: string) => {
            setEdit(false);
        });
    }

    function deleteConfigMapValue() {
        SystemApi.deleteConfigMapValue(configmapName, configmapKey, (val: string) => {
            setDeleteOpen(false);
            SystemService.refresh();
        });
    }


    const {configmapKey, configmapName, isExpanded} = props;
    const canDelete = configmapName !== config.platformConfigName;
    return (
        <Tr isExpanded={isExpanded} className='fields-data'>
            <Td />
            <Td />
            <Td />
            <Td modifier='fitContent'>{configmapKey}</Td>
            <Td>
                {!edit && <TextInput id={configmapName + ":" + configmapKey}  isDisabled={!edit} type={'text'} value={value} onChange={(_event, value) => setValue(value)} />}
                {edit && <TextArea id={configmapName + ":" + configmapKey}  isDisabled={!edit} type={'text'} value={value} onChange={(_event, value) => setValue(value)} />}
            </Td>
            <Td modifier='fitContent' className='buttons'>
                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'end'}}>
                    {!edit &&
                        <Button variant="plain" onClick={event => setEdit(true)} aria-label="Edit">
                            <EditIcon />
                        </Button>
                    }
                    {edit &&
                        <Button variant="plain" onClick={event => {
                            setValue(props.configmapValue);
                            setEdit(false);
                        }} aria-label="Cancel">
                            <UndoIcon/>
                        </Button>
                    }
                    {edit &&
                        <Button variant="plain" onClick={event => saveConfigMapValue()} aria-label="Save">
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
                        <Label color='red'>{configmapKey}</Label>
                        {" from ConfigMap "}
                        {<Label color='red'>{configmapName}</Label>}
                        {" ?"}
                    </div>}
                    isOpen={deleteOpen}
                    onCancel={() => setDeleteOpen(false)}
                    onConfirm={() => deleteConfigMapValue()}
                    btnConfirmVariant='danger'
                    btnConfirm='Delete'
                />
            </Td>
        </Tr>
    )
}
