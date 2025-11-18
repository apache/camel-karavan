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
// import '@/monaco-setup';
import Editor from "@monaco-editor/react";
import {ExpressionBottomPanel} from "./ExpressionBottomPanel";
import './ExpressionEditor.css'
import {ExpressionFunctions, ExpressionVariables} from "./ExpressionContextModel";
import {useTheme} from "@/main/ThemeContext";

interface Props {
    customCode: any,
    onChange: (value: string |undefined) => void,
    title: string,
    dslLanguage?: [string, string, string],
}

export function ExpressionEditor(props: Props) {

    const {isDark} = useTheme();
    const [customCode, setCustomCode] = useState<string | undefined>();
    const [showVariables, setShowVariables] = useState<boolean>(false);
    const [key, setKey] = useState<string>('');

    const {dslLanguage, onChange} = props;

    useEffect(() => {
        setCustomCode(props.customCode)
    },[]);
    
    const language = dslLanguage?.[0];
    const showVars = ExpressionVariables.findIndex(e => e.name === language) > - 1;
    const showFuncs = ExpressionFunctions.findIndex(e => e.name === language) > - 1;
    const show = showVars || showFuncs;

    return (
        <div className='container'>
            <div className='panel-top'>
                <Editor
                    key={key}
                    height={"100%"}
                    width="100%"
                    defaultLanguage={'java'}
                    language={'java'}
                    theme={isDark ? 'vs-dark' : 'light'}
                    options={{
                        lineNumbers: "off",
                        folding: false,
                        lineNumbersMinChars: 10,
                        showUnused: false,
                        fontSize: 12,
                        minimap: {enabled: false}
                    }}
                    value={customCode?.toString()}
                    className={'code-editor'}
                    onChange={(value, _) => setCustomCode(value)}
                />
            </div>

        </div>
    )
}
