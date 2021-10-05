import React from 'react';
import {
    Button, CodeBlock, CodeBlockCode,
    PageSection, Text, TextContent, ToggleGroup, ToggleGroupItem, Toolbar, ToolbarContent, ToolbarItem
} from '@patternfly/react-core';
import PublishIcon from '@patternfly/react-icons/dist/esm/icons/openshift-icon';
import SaveIcon from '@patternfly/react-icons/dist/esm/icons/upload-icon';
import PlusIcon from '@patternfly/react-icons/dist/esm/icons/plus-icon';
import CopyIcon from '@patternfly/react-icons/dist/esm/icons/copy-icon';
import '../karavan.css';
import {DslElement} from "./ui/DslElement";
import {MainToolbar} from "../MainToolbar";
import {DslSelector} from "./ui/DslSelector";
import {DslMetaModel} from "./model/DslMetaModel";
import {DslProperties} from "./ui/DslProperties";
import {CamelElement, Integration} from "./model/CamelModel";
import {KaravanApi} from "../api/KaravanApi";
import {CamelYaml} from "./api/CamelYaml";
import {CamelApiExt} from "./api/CamelApiExt";
import {CamelApi} from "./api/CamelApi";
import {DslConnections} from "./ui/DslConnections";

interface Props {
    integration: Integration,
    mode: 'local' | 'cloud',
}

interface State {
    integration: Integration
    selectedStep?: CamelElement
    view: "design" | "code"
    showSelector: boolean
    parentId: string
    parentType: string
    selectedUuid: string
    key: string
}

export class DesignerPage extends React.Component<Props, State> {

    public state: State = {
        integration: this.props.integration, // CamelYaml.demo(),
        view: "design",
        showSelector: false,
        parentId: '',
        parentType: '',
        selectedUuid: '',
        key: "",
    };

    componentDidMount() {
    }

    save = () => {
        KaravanApi.postIntegrations(this.state.integration.metadata.name + ".yaml", this.getCode(), res => {
            if (res.status === 200) {
                console.log(res) //TODO show notification
            } else {
                console.log(res) //TODO show notification
            }
        })
    }

    publish = () => {
        KaravanApi.publishIntegration(this.state.integration.metadata.name + ".yaml", this.getCode(), res => {
            if (res.status === 200) {
                console.log(res) //TODO show notification
            } else {
                console.log(res) //TODO show notification
            }
        })
    }

    copy = () => {
        this.copyToClipboard(this.getCode());
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

    unselectElement = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        this.setState({selectedStep: undefined, selectedUuid: '', showSelector: false})
    };

    getCode = (): string => {
        const clone = CamelYaml.cloneIntegration(this.state.integration);
        return CamelYaml.integrationToYaml(clone);
    }

    changeView = (view: "design" | "code") => {
        this.setState({view: view, selectedStep: undefined, selectedUuid: '', showSelector: false});
    }

    onPropertyUpdate = (element: CamelElement, updatedUuid: string) => {
        const clone = CamelYaml.cloneIntegration(this.state.integration);
        const i = CamelApiExt.updateIntegration(clone, element, updatedUuid);
        this.setState({integration: i, key: Math.random().toString()})
    }

    deleteElement = (id: string) => {
        const i = CamelApiExt.deleteStepFromIntegration(this.state.integration, id);
        this.setState({integration: i, showSelector: false})
    }

    selectElement = (element: CamelElement) => {
        this.setState({selectedStep: element, selectedUuid: element.uuid, showSelector: false})
    }

    openSelector = (parentId: string | undefined, parentType: string | undefined) => {
        this.setState({showSelector: true, parentId: parentId || '', parentType: parentType || ''})
    }

    closeDslSelector = () => {
        this.setState({showSelector: false})
    }

    onDslSelect = (dsl: DslMetaModel, parentId: string) => {
        switch (dsl.name){
            case 'from' :
                const from = CamelApi.createStep(dsl.name, {from:{uri:dsl.uri}});
                this.addStep(from, parentId)
                break;
            case 'to' :
                const to = CamelApi.createStep(dsl.name, {to:{uri:dsl.uri}});
                this.addStep(to, parentId)
                break;
            default:
                const step = CamelApi.createStep(dsl.name, {});
                this.addStep(step, parentId)
                break;
        }
    }

    addStep = (step: CamelElement, parentId: string) =>{
        const i = CamelApiExt.addStepToIntegration(this.state.integration, step, parentId);
        const clone = CamelYaml.cloneIntegration(i);
        this.setState({integration: clone, key: Math.random().toString(), showSelector: false})
    }

    onIntegrationUpdate = (i: Integration) => {
        this.setState({integration: i, showSelector: false});
    };

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
                    <Button variant="secondary" icon={<SaveIcon/>} onClick={e => this.save()}>Save</Button>
                </ToolbarItem>
                {view === 'design' &&
                <ToolbarItem>
                    <Button icon={<PlusIcon/>} onClick={e => this.openSelector(undefined, undefined)}>Add
                        flow</Button>
                </ToolbarItem>
                }
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
                    {this.state.view === 'design' &&
                    <div className="flows" onClick={event => this.unselectElement(event)}>
                        <DslConnections key={this.state.key + "-connections"}
                            integration={this.state.integration}
                        />
                        {this.state.integration.spec.flows.map((flow, index) => (
                                <DslElement key={flow.uuid + this.state.key}
                                        openSelector={this.openSelector}
                                        deleteElement={this.deleteElement}
                                        selectElement={this.selectElement}
                                        selectedUuid={this.state.selectedUuid}
                                        step={flow}/>
                        ))}
                    </div>
                    }
                    {this.state.view === 'code' &&
                    <div className="yaml-code">
                        <CodeBlock className="route-code">
                            <CodeBlockCode id="code-content">{this.getCode()}</CodeBlockCode>
                        </CodeBlock>
                    </div>
                    }
                    {this.state.view === 'design' &&
                    <DslProperties
                        integration={this.state.integration}
                        step={this.state.selectedStep}
                        onIntegrationUpdate={this.onIntegrationUpdate}
                        onPropertyUpdate={this.onPropertyUpdate}
                        onChangeView={this.changeView}
                    />
                    }
                </div>
                <DslSelector
                    parentId={this.state.parentId}
                    parentType={this.state.parentType}
                    show={this.state.showSelector}
                    onDslSelect={this.onDslSelect}
                    onClose={this.closeDslSelector}/>
            </PageSection>
        );
    }
};
