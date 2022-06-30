import React from 'react';
import {
    Flex,
    FlexItem,
    Tabs,
    Tab,
    PageSection,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {Project, ProjectStatus} from "../models/ProjectModels";
import {ProjectDashboard} from "./ProjectDashboard";
import {ProjectInfo} from "./ProjectInfo";

interface Props {
    project: Project,
    config: any,
}

interface State {
    project?: Project,
    status?: ProjectStatus,
    tab: string | number;
}

export class ProjectHeader extends React.Component<Props, State> {

    public state: State = {
        project: this.props.project,
        tab: "details"
    };

    render() {
        const {tab} = this.state;
        return (
            <Flex direction={{default: "column"}} spaceItems={{default: "spaceItemsNone"}}>
                <FlexItem>
                    <Tabs activeKey={tab} onSelect={(event, tabIndex) => this.setState({tab: tabIndex})}>
                        <Tab eventKey="details" title="Details"/>
                        <Tab eventKey="dashboard" title="Dashboard"/>
                    </Tabs>
                </FlexItem>
                <FlexItem>
                    <PageSection padding={{default: "padding"}}>
                        {tab === 'details' && <ProjectInfo project={this.props.project} config={this.props.config}/>}
                        {tab === 'dashboard' && <ProjectDashboard project={this.props.project} config={this.props.config}/>}
                    </PageSection>
                </FlexItem>
            </Flex>
        )
    }
}
