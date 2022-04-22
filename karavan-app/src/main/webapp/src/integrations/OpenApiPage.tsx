import React from 'react';
import {
    Button, CodeBlock, CodeBlockCode,
    PageSection, Text, TextContent, ToggleGroup, ToggleGroupItem, Toolbar, ToolbarContent, ToolbarItem
} from '@patternfly/react-core';
import PublishIcon from '@patternfly/react-icons/dist/esm/icons/openshift-icon';
import DownloadIcon from '@patternfly/react-icons/dist/esm/icons/download-icon';
import SaveIcon from '@patternfly/react-icons/dist/esm/icons/upload-icon';
import CopyIcon from '@patternfly/react-icons/dist/esm/icons/copy-icon';
import '../designer/karavan.css';
import {MainToolbar} from "../MainToolbar";
import {Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {KaravanApi} from "../api/KaravanApi";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {KaravanDesigner} from "../designer/KaravanDesigner";
import FileSaver from "file-saver";
import Editor from '@monaco-editor/react';

interface Props {
    openapi: string,
    filename: string,
    dark: boolean
}

interface State {
}

export class OpenApiPage extends React.Component<Props, State> {

    public state: State = {
    };

    copy = () => {
        this.copyToClipboard(this.props.openapi);
    }

    copyToClipboard = (data: string) => {
        navigator.clipboard.writeText(data);
    }

    changeView = (view: "design" | "code") => {
        this.setState({view: view});
    }

    save = (name: string, yaml: string) => {
        this.setState({name: name, yaml: yaml})
    }

    download = () => {
        const file = new File([this.props.openapi], this.props.filename, {type: "application/json;charset=utf-8"});
        FileSaver.saveAs(file);
    }

    tools = () => (
        <Toolbar id="toolbar-group-types">
            <ToolbarContent>
                <ToolbarItem>
                    <Button variant="secondary" icon={<CopyIcon/>} onClick={e => this.copy()}>Copy</Button>
                </ToolbarItem>
                <ToolbarItem>
                    <Button variant="secondary" icon={<DownloadIcon/>} onClick={e => this.download()}>Download</Button>
                </ToolbarItem>
            </ToolbarContent>
        </Toolbar>);

    title = () => (
        <div className="dsl-title">
            <TextContent className="title">
                <Text component="h1">OpenAPI</Text>
            </TextContent>
        </div>
    );

    render() {
        return (<>
                <MainToolbar title={this.title()}
                             tools={this.tools()}/>
                <Editor
                    height="100vh"
                    defaultLanguage={'json'}
                    theme={'light'}
                    value={this.props.openapi}
                    className={'code-editor'}
                    onChange={(value, ev) => {if (value) this.setState({yaml: value})}}
                />
            </>
        );
    }
}
