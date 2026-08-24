import React from 'react';
import {Button, ClipboardCopy, Content, Divider, Modal, ModalBody, ModalHeader} from '@patternfly/react-core';
import {useCommandPaletteStore} from "./useCommandPaletteStore";
import {useCommandHook} from "./useCommandHook";
import {CommandPalettePanel} from "./CommandPalettePanel";
import {CommandPaletteFooter} from "./CommandPaletteFooter";
import "./CommandPalettePanel.css"
import {TimesIcon} from "@patternfly/react-icons";

export function CommandPaletteModal() {

    const {afterSelect, close, isFileSelected, file, project} = useCommandHook()
    const showPalette = useCommandPaletteStore((s) => s.showPalette);
    const showProperties = useCommandPaletteStore((s) => s.showProperties);
    const selectedDsl = useCommandPaletteStore((s) => s.selectedDsl);
    const filter = useCommandPaletteStore((s) => s.filter);

    function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
        if (event.key === 'Enter' && showProperties && selectedDsl) {
            afterSelect(selectedDsl)
        } else if (event.key === 'Escape') {
            close();
        }
    }

    const currentContext = <ClipboardCopy
        className="filename-text-clipboard"
        hoverTip="Copy"
        clickTip="Copied"
        variant="inline-compact"
        isCode
    >
        {file?.name || project?.projectId}
    </ClipboardCopy>

    return (
        <Modal
            width={'70%'}
            className='command-palette command-palette-modal'
            position="top"
            isOpen={showPalette}
            onKeyDown={onKeyDown}
        >
            <ModalHeader className={"command-palette-modal-header"}>
                <Content style={{margin: 0}} component={"h6"}>Select for</Content>
                {(isFileSelected || project?.projectId)  && currentContext}
                <div style={{display:"flex", justifyContent: "flex-end", alignItems: "center", flex: 1}}>
                <Button variant='link' isDanger className={"close-button"} onClick={_ => close()}>
                    <TimesIcon/>
                </Button>
                </div>
            </ModalHeader>
            <ModalBody style={{padding: 0}}>
                <CommandPalettePanel/>
            </ModalBody>
            <Divider/>
            <CommandPaletteFooter onClose={() => close()}/>
        </Modal>
    )
}