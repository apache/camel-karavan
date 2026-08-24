import React, {lazy, Suspense} from 'react';
import {Bullseye, Spinner} from "@patternfly/react-core";

/**
 * Lazy boundary in front of the file editor.
 *
 * All eight pages render this as `{showFilePanel && <DeveloperManager/>}`, so nothing here is
 * needed until the user actually opens a file. The implementation statically pulls in every
 * editor variant (Monaco + language services, the Camel designer, the OpenAPI designer and
 * @apitomy/data-models) — roughly 9 MB — which used to be linked into all eight page chunks.
 * Keeping the public component a thin shell defers that to the first file open and leaves the
 * call sites unchanged.
 */
const DeveloperManagerImpl = lazy(() =>
    import("./DeveloperManagerImpl").then(m => ({default: m.DeveloperManager})));

export function DeveloperManager() {
    return (
        <Suspense fallback={<Bullseye><Spinner aria-label="Loading editor"/></Bullseye>}>
            <DeveloperManagerImpl/>
        </Suspense>
    );
}
