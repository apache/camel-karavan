import {type IRange, Position, Range} from 'monaco-editor';
// monaco-editor 0.56 added an "exports" map: deep `monaco-editor/esm/vs/...` specifiers no longer
// resolve, and `monaco-editor/<path>` is the supported form.
import editorWorker from 'monaco-editor/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/language/json/json.worker?worker';
import YamlWorker from 'monaco-yaml/yaml.worker.js?worker';

// Monaco checks MonacoEnvironment.getWorker before a language's own worker factory, so this hook
// has to answer for every label, not just the ones we care about.
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

export { Range, Position };
export type { IRange };
