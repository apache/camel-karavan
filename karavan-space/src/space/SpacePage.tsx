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
import '../designer/karavan.css';
import CopyIcon from "@patternfly/react-icons/dist/esm/icons/copy-icon";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import DownloadImageIcon from "@patternfly/react-icons/dist/esm/icons/image-icon";
import GithubImageIcon from "@patternfly/react-icons/dist/esm/icons/github-icon";
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import {KaravanDesigner} from "../designer/KaravanDesigner";
import Editor from "@monaco-editor/react";
import {UploadModal} from "./UploadModal";
import {EventBus} from "../designer/utils/EventBus";

interface Props {
    name: string,
    yaml: string,
    dark: boolean,
    onSave: (filename: string, yaml: string, propertyOnly: boolean) => void
    onPush: (type: string) => void
}

interface State {
    key: string,
    karavanDesignerRef: any,
    showUploadModal: boolean,
}

export class SpacePage extends React.Component<Props, State> {

    public state: State = {
        key: Math.random().toString(),
        karavanDesignerRef: React.createRef(),
        showUploadModal: false
    }

    save(filename: string, yaml: string, propertyOnly: boolean) {
        this.props.onSave?.call(this, filename, yaml, propertyOnly);
    }

    copyToClipboard = () => {
        navigator.clipboard.writeText(this.props.yaml);
    }

    download = () => {
        const {name, yaml} = this.props;
        if (name && yaml) {
            const a = document.createElement('a');
            a.setAttribute('download', 'example.camel.yaml');
            a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(yaml));
            a.click();
        }
    }

    downloadImage = () => {
        EventBus.sendCommand("downloadImage");
    }

    pushToGithub = () => {
        this.props.onPush?.call(this, 'github');
    }

    openUploadModal = () => {
        this.setState({showUploadModal: true})
    }

    addYaml = (yaml: string | undefined) => {
        if (yaml) {
            this.save(this.props.name, this.props.yaml + "\n" + yaml, false);
        }
        this.setState({showUploadModal: false, key: Math.random().toString()})
    }

    getDesigner = () => {
        const {name, yaml} = this.props;
        return (
            <KaravanDesigner
                showCodeTab={true}
                key={this.state.key}
                dark={this.props.dark}
                // ref={this.state.karavanDesignerRef}
                filename={name}
                yaml={yaml}
                onSave={(filename, yaml, propertyOnly) => this.save(filename, yaml, propertyOnly)}
                onGetCustomCode={name => {
                    return new Promise<string | undefined>(resolve => resolve(undefined))
                }}
                onSaveCustomCode={(name1, code) => {
                    console.log(name1, code)
                }}
                propertyPlaceholders={[]}
                beans={[]}
                onSavePropertyPlaceholder={(key, value) => {}}
            />
        )
    }

    render() {
        const {showUploadModal} = this.state;
        return (
            <PageSection className="kamelet-section designer-page" padding={{default: 'noPadding'}}>
                <PageSection className="tools-section" padding={{default: 'noPadding'}}
                             style={{ paddingLeft: "var(--pf-v5-c-page__main-section--PaddingLeft)"}}>
                    <Flex className="tools" justifyContent={{default: 'justifyContentSpaceBetween'}}>
                        <FlexItem>
                            <Flex>
                                <FlexItem>
                                    <TextContent className="header">
                                        <Text component="h2">Integration</Text>
                                    </TextContent>
                                </FlexItem>
                            </Flex>
                        </FlexItem>
                        <FlexItem>
                            <Toolbar id="toolbar-group-types">
                                <ToolbarContent>
                                    <ToolbarItem>
                                        <Tooltip content="Copy to Clipboard" position={"bottom"}>
                                            <Button variant="primary" icon={<CopyIcon/>} onClick={e => this.copyToClipboard()}>
                                                Copy
                                            </Button>
                                        </Tooltip>
                                    </ToolbarItem>
                                    <ToolbarItem>
                                        <Tooltip content="Download YAML" position={"bottom"}>
                                            <Button variant="secondary" icon={<DownloadIcon/>} onClick={e => this.download()}>
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
                                    <ToolbarItem>
                                        <Tooltip content="Push to Github" position={"bottom-end"}>
                                            <Button variant="secondary" icon={<GithubImageIcon/>} onClick={e => this.pushToGithub()}>
                                                Push
                                            </Button>
                                        </Tooltip>
                                    </ToolbarItem>
                                    <ToolbarItem>
                                        <Tooltip content="Upload OpenAPI" position={"bottom"}>
                                            <Button variant="secondary" icon={<UploadIcon/>} onClick={e => this.openUploadModal()}>
                                                OpenAPI
                                            </Button>
                                        </Tooltip>
                                    </ToolbarItem>
                                </ToolbarContent>
                            </Toolbar>
                        </FlexItem>
                    </Flex>
                </PageSection>
                {this.getDesigner()}
                <UploadModal isOpen={showUploadModal} onClose={yaml => this.addYaml(yaml)}/>
            </PageSection>
        );
    }
};