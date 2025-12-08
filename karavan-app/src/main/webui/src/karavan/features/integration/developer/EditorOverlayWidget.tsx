import ReactDOM from 'react-dom/client';
import "./EditorOverlayWidget.css"
import {Content} from "@patternfly/react-core";
import type * as monaco from "monaco-editor";
import {editor} from "monaco-editor";
import OverlayWidgetPositionPreference = editor.OverlayWidgetPositionPreference;

export function createEditorOverlayWidget(title?: string): monaco.editor.IOverlayWidget {
    const domNode = document.createElement('div');
    domNode.className = 'my-overlay-widget';

    const root = ReactDOM.createRoot(domNode);
    root.render(<Content component='p'>{title}</Content>);

    return {
        getId() {
            return 'my.react.overlay.widget';
        },
        getDomNode() {
            return domNode;
        },
        getPosition() {
            return {
                preference:
                OverlayWidgetPositionPreference.TOP_RIGHT_CORNER,
            };
        },
    };
}