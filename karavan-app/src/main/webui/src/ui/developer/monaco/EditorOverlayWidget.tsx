import ReactDOM from 'react-dom/client';
import "./EditorOverlayWidget.css"
import {Content} from "@patternfly/react-core";
import {editor} from "monaco-editor";
import OverlayWidgetPositionPreference = editor.OverlayWidgetPositionPreference;

export function createEditorOverlayWidget(title?: string, element?: React.JSX.Element): editor.IOverlayWidget {
    const domNode = document.createElement('div');
    domNode.className = 'my-overlay-widget';

    const root = ReactDOM.createRoot(domNode);
    root.render(
        <div style={{display: 'flex', alignItems: "center", gap: "6px"}}>
            <Content component='p'>{title}</Content>
            {element}
        </div>
    );

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