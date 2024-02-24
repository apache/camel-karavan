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
    Button,
    Modal,
    ModalVariant, Title, TitleSizes
} from '@patternfly/react-core';
import '../../karavan.css';
import "@patternfly/patternfly/patternfly.css";
import Editor from "@monaco-editor/react";

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

export function ModalEditor(props: Props) {

    const [customCode, setCustomCode] = useState<string | undefined>();

    useEffect(() => {
        setCustomCode(props.customCode)
    },[]);

    function close(){
        props.onClose();
    }

    function closeAndSave(){
        props.onSave(props.name, customCode);
    }

    const {dark, dslLanguage, title, showEditor} = props;
    return (
        <Modal
            aria-label={"expression"}
            variant={ModalVariant.large}
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
            <Editor
                height="400px"
                width="100%"
                defaultLanguage={'java'}
                language={'java'}
                theme={dark ? 'vs-dark' : 'light'}
                options={{lineNumbers: "off", folding: false, lineNumbersMinChars: 10, showUnused: false, fontSize: 12, minimap: {enabled: false}}}
                value={customCode?.toString()}
                className={'code-editor'}
                onChange={(value,_) => setCustomCode(value)}
            />
        </Modal>
    )
}
