import React, {useEffect, useState} from 'react';
import {Skeleton} from '@patternfly/react-core';
import './CommandPalettePanel.css';
import {useCommandPaletteStore} from "./useCommandPaletteStore";
import {CommandPaletteEditor} from "./CommandPaletteEditor";
import {useCommandHook} from "./useCommandHook";
import {CommandPaletteCamelStepsGallery} from "./CommandPaletteCamelStepsGallery";
import {CommandPaletteDslSelected} from "./CommandPaletteDslSelected";

export function CommandPalettePanel() {

    const {afterSelect, setAllElements, close, selectedDsl, showCamelSteps} = useCommandHook()
    const showProperties = useCommandPaletteStore((s) => s.showProperties);
    const setShowProperties = useCommandPaletteStore((s) => s.setShowProperties);
    const setSelectedDsl = useCommandPaletteStore((s) => s.setSelectedDsl);
    const [ready, setReady] = useState<boolean>(true);

    useEffect(() => {
        setAllElements();
        setReady(true);
        setShowProperties(false);
        setSelectedDsl(undefined);
        return () => {
            setShowProperties(false);
            setSelectedDsl(undefined);
        }
    }, []);

    function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
        if (event.key === 'Enter' && showProperties && selectedDsl) {
            afterSelect(selectedDsl)
        } else if (event.key === 'Escape') {
            close();
        }
    }

    function getNotReady() {
        return !ready && [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i =>
            <React.Fragment key={i}>
                <Skeleton key={i} width={i * 10 + '%'} screenreaderText="Loading..."/>
                <br/>
            </React.Fragment>
        )
    }

    return (
        <div onKeyDown={onKeyDown} className={"command-palette"} style={{display: 'flex', flexDirection: 'column', height: "100%", width: "100%"}}>
            <div className="command-palette-header">
                {ready && <CommandPaletteEditor/>}
            </div>
            <div className={"command-palette-body"}>
                {getNotReady()}
                {ready && showCamelSteps && <CommandPaletteCamelStepsGallery/>}
                {ready && showProperties && selectedDsl && <CommandPaletteDslSelected/>}
            </div>
        </div>
    )
}