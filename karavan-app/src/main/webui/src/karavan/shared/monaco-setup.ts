// Core API only (no full bundle)
import 'monaco-editor/esm/vs/editor/editor.api';

// Language services
import 'monaco-editor/esm/vs/language/json/monaco.contribution';

// Basic languages you need
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution';
import 'monaco-editor/esm/vs/basic-languages/java/java.contribution';
import 'monaco-editor/esm/vs/basic-languages/sql/sql.contribution';
import 'monaco-editor/esm/vs/basic-languages/ini/ini.contribution';
import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution';
import 'monaco-editor/esm/vs/basic-languages/xml/xml.contribution';

import {IRange, Position, Range} from "monaco-editor/esm/vs/editor/editor.api";
// (Optional) If you want YAML schema validation instead of just syntax:
export {Range, Position};
export type { IRange };
