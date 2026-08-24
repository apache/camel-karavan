import React from "react";
import {Bullseye, Spinner} from "@patternfly/react-core";

/**
 * Shown while a lazily loaded page chunk is being fetched.
 */
export function PageFallback() {
    return (
        <Bullseye>
            <Spinner aria-label="Loading page"/>
        </Bullseye>
    );
}
