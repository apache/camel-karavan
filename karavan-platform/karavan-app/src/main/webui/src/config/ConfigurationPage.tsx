import React from 'react';
import {Button, PageSection, Tab, Tabs, TabTitleText, Text, TextContent, Toolbar, ToolbarContent, ToolbarItem
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {MainToolbar} from "../designer/MainToolbar";
import RefreshIcon from "@patternfly/react-icons/dist/esm/icons/sync-alt-icon";

interface Props {
}

interface State {
    templates: [],
}

export class ConfigurationPage extends React.Component<Props, State> {

    public state: State = {
        templates: []
    };

    componentDidMount() {
        this.onGetTemplates();
    }

    onGetTemplates = () => {
        // KaravanApi.getTemplates((templates: []) => {
        //     console.log(templates)
        //     this.setState({templates: templates})
        // });
    }

    tools = () => (<Toolbar id="toolbar-group-types">
        <ToolbarContent>
            <ToolbarItem>
                <Button variant="link" icon={<RefreshIcon/>} onClick={e => this.onGetTemplates()}/>
            </ToolbarItem>
        </ToolbarContent>
    </Toolbar>);

    title = () => (<TextContent>
        <Text component="h2">Configuration</Text>
    </TextContent>);

    render() {
        return (
            <PageSection className="kamelet-section projects-page" padding={{default: 'noPadding'}}>
                <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                    <MainToolbar title={this.title()} tools={this.tools()}/>
                </PageSection>
                <PageSection isFilled className="kamelets-page">
                    <Tabs
                        // activeKey={activeTabKey}
                        // onSelect={handleTabClick}
                        aria-label="Configurations"
                        role="tabs"
                    >
                        <Tab eventKey={0} title={<TabTitleText>Templates</TabTitleText>} aria-label="Templates">
                            Templates
                        </Tab>
                        <Tab eventKey={11} title={<TabTitleText>Environments</TabTitleText>}>
                            Environments
                        </Tab>
                    </Tabs>
                </PageSection>
            </PageSection>
        );
    }
};