import React, {useEffect} from 'react';
import {Button, ModalFooter} from '@patternfly/react-core';
import './CommandPalettePanel.css';
import {useCommandPaletteStore} from "./useCommandPaletteStore";
import {useCommandHook} from "./useCommandHook";
import {CommandPaletteFilenameInput} from "./CommandPaletteFilenameInput";
import {DslMetaModel} from "@designer/utils/DslMetaModel";
import {CommandEventBus} from "./CommandEventBus";

interface Props {
    onClose?: () => void
    onBeforeSave?: (dsl: DslMetaModel) => void
}

export function CommandPaletteFooter(props: Props) {

    const {onClose, onBeforeSave} = props;
    const {afterSelect, validated, selectedDsl, isTopology} = useCommandHook();
    const showProperties = useCommandPaletteStore((s) => s.showProperties);
    const setSelectedDsl = useCommandPaletteStore((s) => s.setSelectedDsl);

    function getButtons() {
        return (
            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 6}}>
                {/*<Button variant='link' isDanger onClick={_ => {*/}
                {/*    close();*/}
                {/*    onClose?.();*/}
                {/*}}>Close</Button>*/}
                {showProperties && selectedDsl &&
                    <Button variant='secondary'
                            onClick={_ => setSelectedDsl(undefined)}
                    >
                        Back
                    </Button>
                }
                {showProperties && selectedDsl &&
                    <Button variant='primary'
                            isDisabled={!validated()}
                            onClick={_ => {
                                onBeforeSave?.(selectedDsl);
                                afterSelect(selectedDsl);
                            }}
                    >
                        Save
                    </Button>
                }
            </div>
        )
    }

    return (
        <ModalFooter className="dsl-footer">
            {isTopology && selectedDsl && <CommandPaletteFilenameInput/>}
            <div style={{flex: 1}}></div>
            {getButtons()}
        </ModalFooter>
    )
}