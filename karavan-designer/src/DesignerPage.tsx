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
    Toolbar,
    ToolbarContent,
    ToolbarItem,
    PageSection, TextContent, Text, Flex, FlexItem, Button, Tooltip, ToggleGroup, ToggleGroupItem
} from '@patternfly/react-core';
import './designer/karavan.css';
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import DownloadImageIcon from "@patternfly/react-icons/dist/esm/icons/image-icon";
import {KaravanDesigner} from "./designer/KaravanDesigner";
import Editor from "@monaco-editor/react";
import {EventBus, IntegrationUpdate} from "./designer/utils/EventBus";
import {InfrastructureAPI} from "./designer/utils/InfrastructureAPI";

interface Props {
    name: string,
    yaml: string,
    dark: boolean,
    onSave: (filename: string, yaml: string, propertyOnly: boolean) => void
}

export const DesignerPage = (props: Props) => {

    const [mode, setMode] = useState<"design" | "code">('design');
    const [yaml, setYaml] = useState<string>(props.yaml);

    useEffect(() => {
        console.log("DesignerPage")
        // setYaml();
    }, []);

    function save(filename: string, yaml: string, propertyOnly: boolean) {
        setYaml(yaml);
        props.onSave(filename, yaml, propertyOnly);
    }

    function download () {
        const {name, yaml} = props;
        if (name && yaml) {
            const a = document.createElement('a');
            a.setAttribute('download', 'example.yaml');
            a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(yaml));
            a.click();
        }
    }

    function downloadImage () {
        EventBus.sendCommand("downloadImage");
    }

    function getDesigner () {
        return (
            <KaravanDesigner
                dark={props.dark}
                filename={props.name}
                yaml={yaml}
                onSave={(filename, yaml, propertyOnly) => save(filename, yaml, propertyOnly)}
                onGetCustomCode={name => {
                    return new Promise<string | undefined>(resolve => resolve(undefined))
                }}
                onSaveCustomCode={(name1, code) => {
                    console.log(name1, code)
                }}
            />
        )
    }

    function getEditor () {
        return (
            <Editor
                height="100vh"
                defaultLanguage="yaml"
                theme={'light'}
                value={yaml}
                className={'code-editor'}
                onChange={(value, ev) => {
                    if (value) {
                        save(props.name, value, false)
                    }
                }}
            />
        )
    }

    return (
        <PageSection className="designer-page" padding={{default: 'noPadding'}}>
            <div className="tools-section" //padding={{default: 'noPadding'}}
                 style={{backgroundColor:"transparent", paddingLeft: "var(--pf-v5-c-page__main-section--PaddingLeft)"}}>
                <Flex className="tools" justifyContent={{default: 'justifyContentSpaceBetween'}}>
                    <FlexItem>
                        <TextContent className="header">
                            <Text component="h2">Designer</Text>
                        </TextContent>
                    </FlexItem>
                    <FlexItem>
                        <Toolbar id="toolbar-group-types">
                            <ToolbarContent>
                                <ToolbarItem>
                                    <ToggleGroup>
                                        <ToggleGroupItem text="Design" buttonId="design" isSelected={mode === "design"}
                                                         onChange={(_event, s) => setMode("design")} />
                                        <ToggleGroupItem text="Code" buttonId="code" isSelected={mode === "code"}
                                                         onChange={(_event, s) => setMode("code")} />
                                    </ToggleGroup>
                                </ToolbarItem>
                                <ToolbarItem>
                                    <Tooltip content="Download YAML" position={"bottom"}>
                                        <Button variant="primary" icon={<DownloadIcon/>} onClick={e => download()}>
                                            YAML
                                        </Button>
                                    </Tooltip>
                                </ToolbarItem>
                                <ToolbarItem>
                                    <Tooltip content="Download image" position={"bottom"}>
                                        <Button variant="secondary" icon={<DownloadImageIcon/>} onClick={e => downloadImage()}>
                                            Image
                                        </Button>
                                    </Tooltip>
                                </ToolbarItem>
                            </ToolbarContent>
                        </Toolbar>
                    </FlexItem>
                </Flex>
            </div>
            {mode === 'design' && getDesigner()}
            {mode === 'code'  && getEditor()}
        </PageSection>
    )
};