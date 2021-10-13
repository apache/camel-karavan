import React from 'react';
import {
    Button, CodeBlock, CodeBlockCode,
    PageSection, Text, TextContent, ToggleGroup, ToggleGroupItem, Toolbar, ToolbarContent, ToolbarItem
} from '@patternfly/react-core';
import PublishIcon from '@patternfly/react-icons/dist/esm/icons/openshift-icon';
import SaveIcon from '@patternfly/react-icons/dist/esm/icons/upload-icon';
import CopyIcon from '@patternfly/react-icons/dist/esm/icons/copy-icon';
import '../designer/karavan.css';
import {MainToolbar} from "../MainToolbar";
import {CamelElement, Integration} from "../designer/model/CamelModel";
import {KaravanApi} from "../api/KaravanApi";
import {CamelYaml} from "../designer/api/CamelYaml";
import {KaravanDesigner} from "../designer/ui/KaravanDesigner";

interface Props {
    integration: Integration,
    mode: 'local' | 'cloud',
}

interface State {
    integration: Integration
    view: "design" | "code"
    name: string
    yaml: string
    key: string
}

export class DesignerPage extends React.Component<Props, State> {

    public state: State = {
        integration: this.props.integration, // CamelYaml.demo(),
        view: "design",
        key: "",
        name: this.props.integration.metadata.name,
        yaml: CamelYaml.integrationToYaml(this.props.integration)
    };

    componentDidMount() {
    }

    post = () => {
        KaravanApi.postIntegrations(this.state.integration.metadata.name + ".yaml", this.state.yaml, res => {
            if (res.status === 200) {
                console.log(res) //TODO show notification
            } else {
                console.log(res) //TODO show notification
            }
        })
    }

    publish = () => {
        KaravanApi.publishIntegration(this.state.integration.metadata.name + ".yaml", this.state.yaml, res => {
            if (res.status === 200) {
                console.log(res) //TODO show notification
            } else {
                console.log(res) //TODO show notification
            }
        })
    }

    copy = () => {
        this.copyToClipboard(this.state.yaml);
    }

    copyToClipboard = (data: string) => {
        const listener = (e: ClipboardEvent) => {
            e.clipboardData?.setData('text/plain', data);
            e.preventDefault();
            document.removeEventListener('copy', listener);
        };
        document.addEventListener('copy', listener);
        document.execCommand('copy');
    }

    changeView = (view: "design" | "code") => {
        this.setState({view: view});
    }

    save = (name: string, yaml: string) => {
        this.setState({name: name, yaml:yaml})
    }

    tools = (view: "design" | "code") => (
        <Toolbar id="toolbar-group-types">
            <ToolbarContent>
                {this.props.mode === 'cloud' &&
                <ToolbarItem>
                    <Button variant="secondary" icon={<PublishIcon/>} onClick={e => this.publish()}>Publish</Button>
                </ToolbarItem>
                }
                {this.props.mode === 'local' &&
                <ToolbarItem>
                    <Button variant="secondary" icon={<CopyIcon/>} onClick={e => this.copy()}>Copy</Button>
                </ToolbarItem>
                }
                <ToolbarItem>
                    <Button variant="secondary" icon={<SaveIcon/>} onClick={e => this.post()}>Save</Button>
                </ToolbarItem>
            </ToolbarContent>
        </Toolbar>);

    title = (view: "design" | "code") => (
        <div className="dsl-title">
            <TextContent className="title">
                <Text component="h1">Designer</Text>
            </TextContent>
            <ToggleGroup aria-label="Switch view" className="toggle">
                <ToggleGroupItem text="Design" buttonId="design" isSelected={view === 'design'}
                                 onChange={e => this.changeView('design')}/>
                <ToggleGroupItem text="YAML" buttonId="yaml" isSelected={view === 'code'}
                                 onChange={e => this.changeView('code')}/>
            </ToggleGroup>
        </div>
    );

    render() {
        return (
            <PageSection className="dsl-page" isFilled padding={{default: 'noPadding'}}>
                <MainToolbar title={this.title(this.state.view)}
                             tools={this.tools(this.state.view)}/>
                <div className="dsl-page-columns">
                    {this.state.view === 'code' &&
                    <div className="yaml-code">
                        <CodeBlock className="route-code">
                            <CodeBlockCode id="code-content">{this.state.yaml}</CodeBlockCode>
                        </CodeBlock>
                    </div>
                    }
                    {this.state.view === 'design' &&
                    <KaravanDesigner
                        key={this.state.key}
                        name={this.state.name}
                        yaml={this.state.yaml}
                        onSave={(name, yaml) => this.save(name, yaml)}
                        borderColor="#fb8824"
                        borderColorSelected="black"
                    />
                    }
                </div>
            </PageSection>
        );
    }
};
