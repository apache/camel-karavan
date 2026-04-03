import React, {useEffect, useRef} from 'react';
import {defaultEditorOptions} from "@features/project/developer/EditorConfig";
import {MonacoEditorWrapper} from "@features/project/developer/MonacoEditorWrapper";
import {Group, Panel} from "react-resizable-panels";
import type * as monaco from "monaco-editor";
import {configureMonacoYaml} from 'monaco-yaml';
import {useDeveloperStore} from "@stores/DeveloperStore";
import camelYaml from "./schemas/camelYamlDslSimplified.json";
import dockerYaml from "./schemas/compose-spec.json";
import {DOCKER_COMPOSE} from "@models/ProjectModels";
import {KARAVAN_DOT_EXTENSION} from "@core/contants";

export interface CodeEditorProps {
    projectId?: string;
    filename: string;
    initialCode?: string;
    onChange?: (value: (string | undefined)) => void;
    onLinkOpen?: (uri: monaco.Uri) => void;
}

export function YamlEditor(props: CodeEditorProps) {

    const {projectId, filename, initialCode, onChange, onLinkOpen} = props;
    const {setValidation} = useDeveloperStore();
    const markerListenerRef = useRef<monaco.IDisposable | null>(null);

    // Cleanup the marker listener on unmount
    useEffect(() => {
        return () => {
            markerListenerRef.current?.dispose();
        };
    }, []);

    function handleBeforeMount(monacoInstance: typeof monaco) {
        let schema = undefined;
        if (filename.endsWith(DOCKER_COMPOSE)) schema = dockerYaml;
        if (filename.endsWith(KARAVAN_DOT_EXTENSION.CAMEL_YAML)) schema = camelYaml;
        const name = filename.endsWith(DOCKER_COMPOSE) ? "DockerCompose" : "CamelYamlDsl"
        if (schema) {
            configureMonacoYaml(monacoInstance, {
                enableSchemaRequest: false,
                hover: true,
                completion: true,
                validate: true,
                format: true,
                schemas: [
                    {
                        uri: `http://internal/schema/${name}.json`,
                        fileMatch: ["*"],
                        schema: schema,
                    }
                ]
            });
        }
    }

    function handleEditorDidMount(editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) {

        const model = editor.getModel();
        if (model) {
            // Listen to any changes in validation markers (from both monaco-yaml AND your backend)
            markerListenerRef.current = monacoInstance.editor.onDidChangeMarkers((uris) => {
                // Ensure the markers changed for this specific file/model
                if (uris.some(uri => uri.toString() === model.uri.toString())) {

                    // Get all markers currently applied to this file
                    const currentMarkers = monacoInstance.editor.getModelMarkers({ resource: model.uri });
                    setValidation(currentMarkers?.length === 0, currentMarkers);
                }
            });
        }
    }

    return (
        <Group orientation="horizontal" className='editor-with-preview' style={{paddingTop: 6}}>
            <Panel minSize={100} className='editor-panel'>
                <MonacoEditorWrapper key={`${projectId}/${filename}`}
                                     language={'yaml'}
                                     editorOptions={{...defaultEditorOptions, minimap: {enabled: true}}}
                                     onBeforeMount={handleBeforeMount}
                                     onEditorDidMount={handleEditorDidMount}
                                     initialCode={initialCode}
                                     onLinkOpen={onLinkOpen}
                                     onChange={onChange}
                />
            </Panel>
        </Group>
    )
}