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
import '../../designer/karavan.css';
import Editor from "@monaco-editor/react";
import {shallow} from "zustand/shallow";
import {useDesignerStore, useIntegrationStore} from "../DesignerStore";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";

export function CodeEditor () {

    const [integration, setIntegration] = useIntegrationStore((s) => [s.integration, s.setIntegration], shallow);
    const [setNotification, badge] = useDesignerStore((s) => [s.setNotification, s.notificationBadge], shallow)
    const [code, setCode] = useState<string>('');

    useEffect(() => {
        try {
            const c = CamelDefinitionYaml.integrationToYaml(integration);
            setCode(c);
        } catch (e: any) {
            const message: string = e?.message ? e.message : e.reason;
            setNotification(true, ['Error in YAML, Integration can not be saved!', message]);
        }
        return () => {
            setNotification(false, ['', '']);
        }
    }, []);

    function onChange(value: string | undefined) {
        if (value) {
            try {
                const i = CamelDefinitionYaml.yamlToIntegration(integration.metadata.name, value);
                setIntegration(i, false);
                setNotification(false, ['', '']);
            } catch (e: any) {
                const message: string = e?.message ? e.message : e.reason;
                setNotification(true, ['Error in YAML, Integration can not be saved!' ,message]);
            }
        }
    }

    return (
        <Editor
            height="100vh"
            defaultLanguage={'yaml'}
            theme={'light'}
            value={code}
            className={'code-editor'}
            defaultValue={code}
            onChange={(value, ev) => onChange(value)}
        />
    )
}
