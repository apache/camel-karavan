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
import React, {useEffect, useState} from 'react';
import '../designer/karavan.css';
import Editor from "@monaco-editor/react";
import {useFileStore} from "../api/ProjectStore";
import {ProjectService} from "../api/ProjectService";
import {shallow} from "zustand/shallow";

interface Props {
    projectId: string
}

const languages = new Map<string, string>([
    ['sh', 'shell'],
    ['md', 'markdown'],
    ['properties', 'ini']
])

export function CodeEditor(props: Props) {

    const [file, designerTab, setFile] = useFileStore((s) => [s.file, s.designerTab, s.setFile], shallow)
    const [code, setCode] = useState<string>();

    useEffect(() => setCode(file?.code), []);

    useEffect(() => {
        const interval = setInterval(() => {
            saveCode();
        }, 3000);
        return () => {
            clearInterval(interval);
            saveCode();
        }
    }, [code]);


    function saveCode() {
        if (file && code && file.code !== code) {
            file.code = code;
            ProjectService.updateFile(file, true);
        }
    }

    const extension = file?.name.split('.').pop();
    const language = extension && languages.has(extension) ? languages.get(extension) : extension;
    return (
        file !== undefined ?
            <Editor
                height="100vh"
                defaultLanguage={language}
                theme={'light'}
                value={code}
                className={'code-editor'}
                onChange={(value, ev) => {
                    if (value) {
                        setCode(value)
                    }
                }}
            />
            : <></>
    )
}
