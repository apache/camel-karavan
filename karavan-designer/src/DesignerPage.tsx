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
import React from 'react';
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
import {EventBus} from "./designer/utils/EventBus";

interface Props {
    name: string,
    yaml: string,
    dark: boolean,
    onSave: (filename: string, yaml: string, propertyOnly: boolean) => void
}

interface State {
    mode: "design" | "code",
}

export class DesignerPage extends React.Component<Props, State> {

    public state: State = {
        mode: 'design',
    };

    componentDidMount() {
    }

    save(filename: string, yaml: string, propertyOnly: boolean) {
        this.props.onSave?.call(this, filename, yaml, propertyOnly);
    }

    download = () => {
        const {name, yaml} = this.props;
        if (name && yaml) {
            const a = document.createElement('a');
            a.setAttribute('download', 'example.yaml');
            a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(yaml));
            a.click();
        }
    }

    downloadImage = () => {
        EventBus.sendCommand("downloadImage");
    }

    getDesigner = () => {
        const {name, yaml} = this.props;
        return (
            <KaravanDesigner
                dark={this.props.dark}
                filename={name}
                yaml={yaml}
                onSave={(filename, yaml, propertyOnly) => this.save(filename, yaml, propertyOnly)}
                onGetCustomCode={name => {
                    return new Promise<string | undefined>(resolve => resolve(undefined))
                }}
                onSaveCustomCode={(name1, code) => {
                    console.log(name1, code)
                }}
            />
        )
    }

    getEditor = () => {
        const {name, yaml} = this.props;
        return (
            <Editor
                height="100vh"
                defaultLanguage="yaml"
                theme={'light'}
                value={yaml}
                className={'code-editor'}
                onChange={(value, ev) => {
                    if (value) {
                        this.save(name, value, false)
                    }
                }}
            />
        )
    }

    render() {
        const {mode} = this.state;
        return (
            <PageSection className="kamelet-section designer-page" padding={{default: 'noPadding'}}>
                <PageSection className="tools-section" padding={{default: 'noPadding'}}
                             style={{backgroundColor:"transparent", paddingLeft: "var(--pf-c-page__main-section--PaddingLeft)"}}>
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
                                                             onChange={s => this.setState({mode: "design"})} />
                                            <ToggleGroupItem text="Code" buttonId="code" isSelected={mode === "code"}
                                                             onChange={s => this.setState({mode: "code"})} />
                                        </ToggleGroup>
                                    </ToolbarItem>
                                    <ToolbarItem>
                                        <Tooltip content="Download YAML" position={"bottom"}>
                                            <Button variant="primary" icon={<DownloadIcon/>} onClick={e => this.download()}>
                                                YAML
                                            </Button>
                                        </Tooltip>
                                    </ToolbarItem>
                                    <ToolbarItem>
                                        <Tooltip content="Download image" position={"bottom"}>
                                            <Button variant="secondary" icon={<DownloadImageIcon/>} onClick={e => this.downloadImage()}>
                                                Image
                                            </Button>
                                        </Tooltip>
                                    </ToolbarItem>
                                </ToolbarContent>
                            </Toolbar>
                        </FlexItem>
                    </Flex>
                </PageSection>
                {mode === 'design' && this.getDesigner()}
                {mode === 'code'  && this.getEditor()}
            </PageSection>
        );
    }
};