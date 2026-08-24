import React, {lazy, Suspense} from "react";
import {Bullseye, Spinner} from "@patternfly/react-core";
// Type-only, so importing the props does not pull the implementation (and Monaco) in eagerly.
import type {MonacoEditorProps} from "./MonacoEditorWrapperImpl";

export type {MonacoEditorProps};

/**
 * Lazy boundary in front of the real editor.
 *
 * monaco-editor plus its language services is ~4 MB. Every page that embeds an editor used to
 * pay for it as soon as the page chunk loaded, even when the editor sat behind a tab or a panel
 * the user never opened. Keeping the public component a thin shell means Monaco is fetched the
 * first time an editor actually mounts, and call sites need no changes.
 */
const MonacoEditorWrapperImpl = lazy(() =>
    import("./MonacoEditorWrapperImpl").then(m => ({default: m.MonacoEditorWrapper})));

export const MonacoEditorWrapper: React.FC<MonacoEditorProps> = (props) => (
    <Suspense fallback={<Bullseye><Spinner aria-label="Loading editor"/></Bullseye>}>
        <MonacoEditorWrapperImpl {...props}/>
    </Suspense>
);
