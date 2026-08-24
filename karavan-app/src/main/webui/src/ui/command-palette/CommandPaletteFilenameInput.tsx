import React, {useEffect} from 'react';
import {Content, TextInputGroup, TextInputGroupMain, TextInputGroupUtilities} from '@patternfly/react-core';
import './CommandPalettePanel.css';
import {useCommandPaletteStore} from "./useCommandPaletteStore";
import {useCommandHook} from "./useCommandHook";
import {ExclamationCircleIcon} from "@patternfly/react-icons";

export function CommandPaletteFilenameInput() {

    const {validated, generateRouteFileName} = useCommandHook()

    const selectedDsl = useCommandPaletteStore((s) => s.selectedDsl);
    const fileName = useCommandPaletteStore((s) => s.fileName);
    const setFileName = useCommandPaletteStore((s) => s.setFileName);

    useEffect(() => {
        if (selectedDsl && !fileName) {
            const f = generateRouteFileName(selectedDsl)
            setFileName(f)
        } else if (!selectedDsl && !fileName) {
            const f = generateRouteFileName(undefined)
            setFileName(f)
        }
    }, [selectedDsl]);

    return (
        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '8px'}}>
            <Content style={{textWrap: 'nowrap', margin: 0, fontWeight: 'bold'}} component='p'>File name: </Content>
            <TextInputGroup className="search">
                <TextInputGroupMain
                    style={{textAlign: 'right'}}
                    value={fileName ?? ''}
                    onChange={(_event, value) => setFileName(value)}
                    type="text"
                    aria-label="invalid text input example"
                />
                <TextInputGroupUtilities>
                    <Content style={{textWrap: 'nowrap', padding: '3px'}} component='p'>.camel.yaml</Content>
                </TextInputGroupUtilities>
                <TextInputGroupUtilities>
                    {!validated() &&
                        <ExclamationCircleIcon color='var(--pf-t--global--icon--color--status--danger--default)' style={{textWrap: 'nowrap', marginRight: '3px'}}/>}
                </TextInputGroupUtilities>
            </TextInputGroup>
        </div>
    )
}