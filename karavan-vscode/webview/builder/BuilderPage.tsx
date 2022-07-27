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
    Badge,
    Button,
    Card,
    CardBody,
    CardHeader,
    CardHeaderMain,
    CardTitle,
    Flex,
    FlexItem,
    Form,
    FormGroup,
    InputGroup,
    PageSection,
    PageSectionVariants,
    Popover,
    PopoverPosition,
    ProgressStep,
    ProgressStepper,
    Spinner,
    Text,
    TextContent,
    TextInput,
    Toolbar,
    ToolbarContent,
    ToolbarItem,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";
import InProgressIcon from '@patternfly/react-icons/dist/esm/icons/in-progress-icon';
import AutomationIcon from '@patternfly/react-icons/dist/esm/icons/bundle-icon';
import PendingIcon from '@patternfly/react-icons/dist/esm/icons/pending-icon';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import CheckCircleIcon from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import ProjectIcon from '@patternfly/react-icons/dist/esm/icons/cubes-icon';
import ClipboardIcon from '@patternfly/react-icons/dist/esm/icons/clipboard-icon';
import RunIcon from '@patternfly/react-icons/dist/esm/icons/play-circle-icon';
import {ProjectModel, StepStatus} from "karavan-core/lib/model/ProjectModel";
import {PropertiesTable} from "./PropertiesTable";

interface Props {
    project: ProjectModel,
    dark: boolean
    files: string
    onChange?: (project: ProjectModel) => void
    onAction?: (action: "start" | "stop" | "undeploy" | "run", project: ProjectModel) => void
}

interface State {
    project: ProjectModel,
    key?: string,
    isOpen?: boolean
}

export class BuilderPage extends React.Component<Props, State> {

    public state: State = {
        project: this.props.project,
    };
    interval: any;

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        const project = this.state.project;
        if (project) this.props.onChange?.call(this, project);
    }

    componentDidMount() {
        this.interval = setInterval(() => this.setState(state => ({key: Math.random().toString()})), 1000);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    getHelp(text: string) {
        return <Popover
            aria-label={text}
            position={PopoverPosition.left}
            bodyContent={text}>
            <Button variant="plain" onClick={e => {
            }}>
                <HelpIcon/>
            </Button>
        </Popover>
    }

    getField(name: string, label: string, type: 'text' | 'date' | 'datetime-local' | 'email' | 'month' | 'number' | 'password' | 'search' | 'tel' | 'time' | 'url',
             value: any, help: string, onChange: (val: any) => void, isRequired: boolean = false, enabled: boolean = true) {
        return <FormGroup label={label} fieldId={name} isRequired={isRequired}>
            <InputGroup>
                <TextInput isRequired={isRequired} isDisabled={!enabled} className="text-field" type={type} id={name} name={name} value={value}
                           onChange={val => onChange?.call(this, val)}/>
                {this.getHelp(help)}
            </InputGroup>
        </FormGroup>
    }

    getCardHeader(title: string, icon: any) {
        return <CardHeader>
            <CardHeaderMain>
                <CardTitle className="card-header">
                    {icon}{title}
                </CardTitle>
            </CardHeaderMain>
        </CardHeader>
    }

    getProjectForm() {
        return (
            <Card className="builder-card" isCompact style={{width: "100%"}}>
                {this.getCardHeader("Artifact", <ProjectIcon/>)}
                <CardBody>
                    <Form isHorizontal>
                        {/*{this.getField("name", "Name", "text", this.state.profile.project.name, "Project name",*/}
                        {/*    val => this.setState(state => {state.profile.project.name= val; return state}), true)}*/}
                        {/*{this.getField("version", "Version", "text", this.state.profile.project.version, "Project version",*/}
                        {/*    val => this.setState(state => {state.profile.project.version= val; return state}), true)}*/}
                    </Form>
                </CardBody>
            </Card>
        )
    }

    getProgressIcon(status?: 'pending' | 'progress' | 'done' | 'error') {
        switch (status) {
            case "pending":
                return <PendingIcon/>;
            case "progress":
                return <Spinner isSVG size="md"/>
            case "done":
                return <CheckCircleIcon/>;
            case "error":
                return <ExclamationCircleIcon/>;
            default:
                return undefined;
        }
    }

    getDescription(stepStatus?: StepStatus) {
        const now = Date.now();
        let time = 0;
        if (stepStatus?.status === 'progress') {
            time = stepStatus?.startTime ? (now - stepStatus.startTime) / 1000 : 0;
        } else if (stepStatus?.status === 'done' && stepStatus?.endTime) {
            time = (stepStatus?.endTime - stepStatus.startTime) / 1000
        }
        return time === 0 ? "" : Math.round(time) + "s";
    }

    getProgress() {
        const {status} = this.state.project;
        return (
            <ProgressStepper isCenterAligned style={{visibility: "visible"}}>
                <ProgressStep variant="pending" id="export" titleId="export" aria-label="export"
                              description={this.getDescription(status.export)}
                              icon={this.getProgressIcon(status.export?.status)}>Export
                </ProgressStep>
                <ProgressStep variant="pending" isCurrent id="package" titleId="package" aria-label="package"
                              description={this.getDescription(status.package)}
                              icon={this.getProgressIcon(status.package?.status)}>Package
                </ProgressStep>
            </ProgressStepper>
        )
    }

    getHeader() {
        return (
            <PageSection className="tools-section" variant={this.props.dark ? PageSectionVariants.darker : PageSectionVariants.light}>
                <Flex className="tools" direction={{default: 'row'}} justifyContent={{default: 'justifyContentSpaceBetween'}} spaceItems={{default: 'spaceItemsLg'}}>
                    <FlexItem>
                        <TextContent className="header">
                            <Text component="h2">Build Runner</Text>
                            <Badge isRead className="labels">Powered by Camel JBang & Maven</Badge>
                        </TextContent>
                    </FlexItem>
                    <FlexItem>
                        <Toolbar id="toolbar-group-types">
                            <ToolbarContent>
                                <ToolbarItem>
                                    {/*<ProfileSelector profiles={profiles.map(p => p.name)}*/}
                                    {/*                 profile={profile.name}*/}
                                    {/*                 onDelete={profile => {*/}
                                    {/*                     this.setState(state => {*/}
                                    {/*                         state.profiles.splice(state.profiles.findIndex(p => p.name === profile), 1);*/}
                                    {/*                         return {*/}
                                    {/*                             profiles: state.profiles,*/}
                                    {/*                             profile: this.props.profiles.at(0) || Profile.createNew("application"),*/}
                                    {/*                             tab: state.tab*/}
                                    {/*                         };*/}
                                    {/*                     })*/}
                                    {/*                 }}*/}
                                    {/*                 onChange={profileName => {*/}
                                    {/*                     const prof = profiles.find(p => p.name === profileName);*/}
                                    {/*                     if (prof) {*/}
                                    {/*                         this.setState({profile: prof, key: Math.random().toString()});*/}
                                    {/*                     } else {*/}
                                    {/*                         this.setState(state => {*/}
                                    {/*                             const newProfile = Profile.createNew(profileName);*/}
                                    {/*                             newProfile.project = new ProjectModel(this.state.profile.project);*/}
                                    {/*                             state.profiles.push(newProfile);*/}
                                    {/*                             return {profiles: state.profiles, profile: newProfile, tab: state.tab};*/}
                                    {/*                         })*/}
                                    {/*                     }*/}
                                    {/*                 }}/>*/}
                                </ToolbarItem>
                            </ToolbarContent>
                        </Toolbar>
                    </FlexItem>
                </Flex>
            </PageSection>
        )
    }

    onButtonClick(action: "start" | "stop" | "undeploy" | "run") {
        this.props.onAction?.call(this, action, this.state.project);
    }

    getFooter() {
        const active = false;
        const label = active ? "Stop" : "Package";
        const icon = active ? <InProgressIcon/> : <AutomationIcon/>;
        return <div key={this.state.key} className="footer">
            <div className="progress">
                {active && this.getProgress()}
            </div>
            <div className="buttons">
                <Toolbar id="toolbar-items">
                    <ToolbarContent>
                        {!active && <ToolbarItem>
                            <Button variant="secondary" isSmall onClick={event => this.onButtonClick("undeploy")}>Undeploy</Button>
                        </ToolbarItem>}
                        <ToolbarItem>
                            <Button variant="primary" isSmall icon={icon} onClick={event => this.onButtonClick(active ? "stop" : "start")}>{label}</Button>
                        </ToolbarItem>
                        <ToolbarItem>
                            <Button variant="primary" isSmall icon={<RunIcon/>} onClick={event => this.onButtonClick("run")}>Run</Button>
                        </ToolbarItem>
                    </ToolbarContent>
                </Toolbar>
            </div>
        </div>
    }

    getPropertiesForm() {
        return (
            <div className="center">
                <div className="center-column">
                    <Card className="builder-card" isCompact style={{width: "100%"}}>
                        {this.getCardHeader("Properties", <ClipboardIcon/>)}
                        <CardBody>
                            <PropertiesTable properties={this.state.project.properties}
                                             onChange={properties => this.setState(state => {
                                                 state.project.properties = properties;
                                                 return state
                                             })}/>
                        </CardBody>
                    </Card>
                </div>
            </div>
        )
    }

    render() {
        return (
            <PageSection className="project-builder" variant={this.props.dark ? PageSectionVariants.darker : PageSectionVariants.light}
                         padding={{default: 'noPadding'}}>
                <div style={{height: "100%", display: "flex", flexDirection: "column"}}>
                    <div>
                        {this.getHeader()}
                    </div>
                    <div style={{overflow: "auto", flexGrow: 1}}>
                        {this.getPropertiesForm()}
                    </div>
                    <div>
                        {this.getFooter()}
                    </div>
                </div>
            </PageSection>
        )
    }
}