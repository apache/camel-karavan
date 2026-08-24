import React from 'react';
import {Bullseye} from '@patternfly/react-core';
import './CommandPalettePanel.css';
import {useCommandPaletteStore} from "./useCommandPaletteStore";
import {CommandPaletteDslSelectedCard} from "./CommandPaletteDslSelectedCard";


export function CommandPaletteDslSelected() {

    const selectedDsl = useCommandPaletteStore((s) => s.selectedDsl);

    return (
        <Bullseye>
            <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px', minWidth: "400px"}}>
                <CommandPaletteDslSelectedCard key={selectedDsl.name} dsl={selectedDsl} index={0}/>
            </div>
        </Bullseye>
    )
}