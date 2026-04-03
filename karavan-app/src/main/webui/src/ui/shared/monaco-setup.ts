import {loader} from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import {type IRange, Position, Range} from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import YamlWorker from 'monaco-yaml/yaml.worker.js?worker';

self.MonacoEnvironment = {
    getWorker(_, label) {
        if (label === 'json') {
            return new jsonWorker();
        }
        if (label === 'yaml' ) {
            return new YamlWorker()
        }
        return new editorWorker();
    },
};

loader.config({ monaco });

export { Range, Position };
export type { IRange };
