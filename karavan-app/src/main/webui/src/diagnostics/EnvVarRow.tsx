import {Buffer} from "buffer";
import React, {useState} from 'react';
import {Button, TextInput} from '@patternfly/react-core';
import {Td, Tr} from '@patternfly/react-table';
import ShowIcon from "@patternfly/react-icons/dist/esm/icons/eye-icon";
import HideIcon from "@patternfly/react-icons/dist/esm/icons/eye-slash-icon";
import {DiagnosticsApi} from "@/diagnostics/DiagnosticsApi";

const DEFAULT_VALUE = "**********************"

export interface Props {
    name: string
}

export function EnvVarRow(props: Props) {

    const [value, setValue] = useState<string>(DEFAULT_VALUE);
    const [showValue, setShowValue] = useState<boolean>(false);

    function showValueData() {
        if (showValue) {
            setShowValue(false)
        } else {
            DiagnosticsApi.getEnvVarValue(props.name, (val: string) => {
                setValue(Buffer.from(val, 'base64').toString('binary'));
                setShowValue(true);
            });
        }
    }

    return (
        <Tr className='fields-data'>
            <Td modifier='fitContent'>{props.name}</Td>
            <Td>
                <TextInput id={props.name}
                           autoComplete={'off'}
                           type={showValue ? 'text' : 'password'}
                           value={value}
                           isDisabled
                />
            </Td>
            <Td modifier='fitContent' className='buttons'>
                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'end'}}>
                    <Button variant="plain" onClick={event => showValueData()} aria-label="Show">
                        {!showValue ? <ShowIcon/> : <HideIcon/>}
                    </Button>
                </div>
            </Td>
        </Tr>
    )
}
