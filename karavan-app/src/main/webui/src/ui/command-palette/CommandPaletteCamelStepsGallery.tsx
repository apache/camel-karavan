import React from 'react';
import './CommandPalettePanel.css';
import {CamelUi} from "@designer/utils/CamelUi";
import {DslMetaModel} from "@designer/utils/DslMetaModel";
import {useCommandPaletteStore} from "./useCommandPaletteStore";
import {CommandPaletteDslElement} from "./CommandPaletteDslElement";
import {Gallery} from "@patternfly/react-core";

export function CommandPaletteCamelStepsGallery() {
    const selectedDsl = useCommandPaletteStore((s) => s.selectedDsl);
    const elements = useCommandPaletteStore((s) => s.elements);
    const filter = useCommandPaletteStore((s) => s.filter);

    // 1. Filter elements using the existing logic
    const filteredElements: DslMetaModel[] = selectedDsl
        ? [selectedDsl]
        : elements.filter(d => CamelUi.checkFilter(d, filter));


    // 2. Sort the filtered elements based on keyword order in the filter
    if (!selectedDsl && filter && filter.trim().length > 0) {
        // Extract individual keywords in the exact order they were typed
        const keywords = filter.toLowerCase().split(/\s+/).filter(Boolean);

        // Helper function to assign a rank based on the earliest keyword match
        const getRank = (dsl: DslMetaModel) => {
            // Combine searchable fields into a single lowercase string
            const searchText = `${dsl.name || ''} ${dsl.title || ''} ${dsl.description || ''}`.toLowerCase();

            // Find the index of the FIRST keyword in the filter string that matches this element
            const matchIndex = keywords.findIndex(kw => searchText.includes(kw));

            // If matched, return its index (0 is best rank). If no match (unlikely since it passed filter), put it at the end.
            return matchIndex === -1 ? keywords.length : matchIndex;
        };

        // Sort elements: lower rank (earlier keyword match) comes first
        filteredElements.sort((a, b) => getRank(a) - getRank(b));
    }

    return (
            <Gallery key={"gallery"} hasGutter className="dsl-gallery" minWidths={{default: '170px'}}>
                {filteredElements.map((dsl: DslMetaModel, index: number) =>
                    <CommandPaletteDslElement key={dsl.name + ":" + index} dsl={dsl} index={index}/>
                )}
            </Gallery>

    );
}