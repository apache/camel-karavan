/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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