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
import {
    Button, Modal, Title, TitleSizes
} from '@patternfly/react-core';
import Editor from "@monaco-editor/react";
import {ExpressionBottomPanel} from "./ExpressionBottomPanel";
import './ExpressionModalEditor.css'
import {Context, ExpressionFunctions, ExpressionVariables} from "./ExpressionContextModel";

interface Props {
    name: string,
    customCode: any,
    onSave: (fieldId: string, value: string | number | boolean | any) => void,
    onClose: () => void,
    title: string,
    dslLanguage?: [string, string, string],
    dark: boolean
    showEditor: boolean
}

export function ExpressionModalEditor(props: Props) {

    const [customCode, setCustomCode] = useState<string | undefined>();

    useEffect(() => {
        console.log(title, dslLanguage)
        setCustomCode(props.customCode)
    },[]);

    function close(){
        props.onClose();
    }

    function closeAndSave(){
        props.onSave(props.name, customCode);
    }

    const {dark, dslLanguage, title, showEditor} = props;
    const language = dslLanguage?.[0];
    const showVars = ExpressionVariables.findIndex(e => e.name === language) > - 1;
    const showFuncs = ExpressionFunctions.findIndex(e => e.name === language) > - 1;
    const show = showVars || showFuncs;

    return (
        <Modal
            aria-label="Expression"
            className='expression-modal'
            width={"80%"}
            header={<React.Fragment>
                <Title id="modal-custom-header-label" headingLevel="h1" size={TitleSizes['2xl']}>
                    {title}
                </Title>
                <p className="pf-v5-u-pt-sm">{dslLanguage?.[2]}</p>
            </React.Fragment>}
            isOpen={showEditor}
            onClose={() => close()}
            actions={[
                <Button key="save" variant="primary" size="sm"
                        onClick={e => closeAndSave()}>Save</Button>,
                <Button key="cancel" variant="secondary" size="sm"
                        onClick={e => close()}>Close</Button>
            ]}
            onEscapePress={e => close()}>
            <div className='container'>
                <div className='panel-top'>
                    <Editor
                        height="50%"
                        width="100%"
                        defaultLanguage={'java'}
                        language={'java'}
                        theme={dark ? 'vs-dark' : 'light'}
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
                {show && <div className='panel-bottom'>
                    {dslLanguage && <ExpressionBottomPanel dslLanguage={dslLanguage}/>}
                </div>}
            </div>
        </Modal>
    )
}
