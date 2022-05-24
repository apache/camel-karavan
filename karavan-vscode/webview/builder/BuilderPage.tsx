import React from 'react';
import {
    Badge,
    Button,
    Card,
    CardActions,
    CardBody,
    CardHeader,
    CardHeaderMain,
    CardTitle,
    Flex,
    FlexItem,
    Form,
    FormGroup,
    HelperText,
    HelperTextItem,
    InputGroup,
    PageSection,
    PageSectionVariants,
    Popover,
    PopoverPosition,
    ProgressStep,
    ProgressStepper,
    Spinner,
    Switch, Tab, Tabs,
    Text,
    TextContent,
    TextInput,
    ToggleGroup,
    ToggleGroupItem,
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
import JarIcon from '@patternfly/react-icons/dist/esm/icons/hotjar-icon';
import ImageIcon from '@patternfly/react-icons/dist/esm/icons/docker-icon';
import DeployIcon from '@patternfly/react-icons/dist/esm/icons/cloud-upload-alt-icon';
import CleanupIcon from '@patternfly/react-icons/dist/esm/icons/remove2-icon';
import ProjectIcon from '@patternfly/react-icons/dist/esm/icons/cubes-icon';
import ClipboardIcon from '@patternfly/react-icons/dist/esm/icons/clipboard-icon';
import RunIcon from '@patternfly/react-icons/dist/esm/icons/play-circle-icon';
import {FileSelector} from "./FileSelector";
import {Profile, ProjectModel, StepStatus} from "karavan-core/lib/model/ProjectModel";
import {ProfileSelector} from "./ProfileSelector";
import {PropertiesTable} from "./PropertiesTable";

interface Props {
    dark: boolean
    profiles: Profile[]
    profile?: Profile
    files: string
    onChange?: (profiles: Profile[]) => void
    onAction?: (action: "start" | "stop" | "undeploy" | "run", profile: Profile) => void
}

interface State {
    profiles: Profile[],
    profile: Profile,
    key?: string,
    isOpen?: boolean
    tab: string
}

export class BuilderPage extends React.Component<Props, State> {

    public state: State = {
        profiles: this.props.profiles,
        profile: this.props.profile ? this.props.profile : (this.props.profiles.at(0) || Profile.createNew("application")),
        tab: 'project'
    };
    interval: any;

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        const profiles = this.state.profiles;
        if (profiles) this.props.onChange?.call(this, profiles);
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

    getBuildConfigField() {
        const {buildConfig} = this.state.profile.project;
        return <FormGroup label="Use BuildConfig" fieldId="buildConfig" isRequired={true}>
            <InputGroup style={{display: "flex", flexDirection: "row", justifyContent: "end", alignItems: "center"}}>
                <Switch isChecked={buildConfig} onChange={checked => this.setState(state => {state.profile.project.buildConfig = checked; return state})} id="buildConfig"/>
                {this.getHelp("Use BuildConfig for build in OpenShift ")}
            </InputGroup>
        </FormGroup>
    }

    getCardHeader(title: string, icon: any, optional: boolean = true, checked: boolean = false, onCheck?: (check: boolean) => void) {
        return <CardHeader>
            <CardHeaderMain>
                <CardTitle className="card-header">
                    {icon}{title}
                </CardTitle>
            </CardHeaderMain>
            <CardActions hasNoOffset={true}>
                {optional && <Switch isChecked={checked} onChange={checked => onCheck?.call(this, checked)} id={title} name={title} aria-label={"xxx"}/>}
            </CardActions>
        </CardHeader>
    }

    getProjectForm() {
        return (
            <Card className="builder-card" isCompact style={{width: "100%"}}>
                {this.getCardHeader("Artifact", <ProjectIcon/>, false)}
                <CardBody>
                    <Form isHorizontal>
                        {this.getField("name", "Name", "text", this.state.profile.project.name, "Project name",
                            val => this.setState(state => {state.profile.project.name= val; return state}), true)}
                        {this.getField("version", "Version", "text", this.state.profile.project.version, "Project version",
                            val => this.setState(state => {state.profile.project.version= val; return state}), true)}
                    </Form>
                </CardBody>
            </Card>
        )
    }

    getPackageForm() {
        const {uberJar, classpathFiles, routesIncludePattern, filename} = this.state.profile.project;
        return <Card className="builder-card" isCompact style={{width: "100%"}}>
            {this.getCardHeader("Package", <JarIcon/>, true, uberJar,
                check => this.setState(state => {state.profile.project.uberJar= check; return state}))}
            <CardBody className={uberJar ? "" : "card-disabled"}>
                <Form isHorizontal>
                    {this.getField("filename", "Jar", "text", filename, "Jar file name",
                        val => this.setState(state => {state.profile.project.filename= val; return state}), true, uberJar)}
                    {this.props.files.length > 0 &&
                        <FileSelector source={true} label="Route/source files" help="Routes and source to build and package" files={this.props.files}
                                      filesSelected={routesIncludePattern}
                                      onChange={filesSelected => this.setState(state => {state.profile.project.routesIncludePattern= filesSelected; return state})}/>}
                    {this.props.files.length > 0 &&
                        <FileSelector source={false} label="Resources" help="Files to package as resources" files={this.props.files} filesSelected={classpathFiles}
                                      onChange={filesSelected => this.setState(state => {state.profile.project.classpathFiles= filesSelected; return state})}/>}
                </Form>
            </CardBody>
        </Card>
    }

    getBuildForm() {
        const {target, namespace, build, image, sourceImage, server, token, from, buildConfig, username, password} = this.state.profile.project;
        return <Card className="builder-card" isCompact style={{width: "100%"}}>
            {this.getCardHeader("Build", <ImageIcon/>, true, this.state.profile.project.build,
                check => this.setState(state => {state.profile.project.build= check; return state}))}
            <CardBody className={build ? "" : "card-disabled"}>
                <Form isHorizontal>
                    <FormGroup label="Target" fieldId="target" isRequired disabled={true}>
                        <ToggleGroup aria-label="Select target">
                            <ToggleGroupItem isDisabled={!build} text="Minikube" buttonId="minikube" isSelected={target === 'minikube'}
                                             onChange={selected => selected ? this.setState(state => {state.profile.project.target= 'minikube'; return state}) : {}}/>
                            <ToggleGroupItem isDisabled={!build} text="Kubernetes" buttonId="kubernetes" isSelected={target === 'kubernetes'}
                                             onChange={selected => selected ? this.setState(state => {state.profile.project.target= 'kubernetes'; return state}) : {}}/>
                            <ToggleGroupItem isDisabled={!build} text="Openshift" buttonId="openshift" isSelected={target === 'openshift'}
                                             onChange={selected => selected ? this.setState(state => {state.profile.project.target= 'openshift'; return state}) : {}}/>
                        </ToggleGroup>
                    </FormGroup>
                    {this.getField("image", "Image name", "text", image, "Image name",
                        val => this.setState(state => {state.profile.project.image= val; return state}), true, build)}
                    {target === 'openshift' && this.getBuildConfigField()}
                    {!buildConfig && this.getField("from", "Base Image", "text", from, "Base Image",
                        val => this.setState(state => {state.profile.project.from= val; return state}), true, build)}
                    {target === 'openshift' && buildConfig && this.getField("sourceImage", "Source Image", "text", sourceImage, "Source image name (for OpenShift BuildConfig)",
                        val => this.setState(state => {state.profile.project.sourceImage= val; return state}), true, build)}
                    {target !== 'minikube' && this.getField("namespace", "Namespace", "text", namespace, "Namespace to build and/or deploy",
                        val => this.setState(state => {state.profile.project.namespace= val; return state}), true, build)}
                    {target !== 'minikube' && this.getField("server", "Server", "text", server, "Master URL",
                        val => this.setState(state => {state.profile.project.server= val; return state}), true, build)}
                    {target !== 'minikube' && this.getField("username", "Username", "text", username, "Username",
                        val => this.setState(state => {state.profile.project.username= val; return state}), false, build)}
                    {target !== 'minikube' && this.getField("password", "Password", "password", password, "Password (will not be saved)",
                        val => this.setState(state => {state.profile.project.password= val; return state}), false, build)}
                    {target !== 'minikube' && this.getField("token", "Token", "password", token, "Authentication Token (will not be saved)",
                        val => this.setState(state => {state.profile.project.token= val; return state}), false, build)}
                </Form>
            </CardBody>
        </Card>
    }

    getDeployForm() {
        const {target, deploy, build, replicas, nodePort} = this.state.profile.project;
        return <Card className="builder-card" isCompact style={{width: "100%"}}>
            {this.getCardHeader("Deploy", <DeployIcon/>, true, deploy,
                check => this.setState(state => {state.profile.project.deploy= check; return state}))}
            <CardBody className={deploy ? "" : "card-disabled"}>
                <Form isHorizontal>
                    {this.getField("replicas", "Replicas", "number", replicas, "Number of replicas of the application",
                        val => this.setState(state => {state.profile.project.replicas= val; return state}), true, build)}
                    {target === 'minikube' && this.getField("nodePort", "Node port", "number", nodePort, "Node port (minikube)",
                        val => this.setState(state => {state.profile.project.nodePort= val; return state}), true, build)}
                </Form>
            </CardBody>
        </Card>
    }

    getCleanupForm() {
        const {cleanup} = this.state.profile.project;
        return <Card className="builder-card" isCompact style={{width: "100%"}}>
            {this.getCardHeader("Cleanup", <CleanupIcon/>, true, cleanup,
                check => this.setState(state => {state.profile.project.cleanup= check; return state}))}
            <CardBody className={cleanup ? "" : "card-disabled"}>
                <HelperText>
                    <HelperTextItem variant="indeterminate">Remove created jar and .camel-jbang after build and/or deploy.</HelperTextItem>
                </HelperText>
            </CardBody>
        </Card>
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
        const {status, uberJar, build, deploy} = this.state.profile.project;
        const undeploying = status.active && status.undeploy?.status === "progress";
        return (
            <ProgressStepper isCenterAligned style={{visibility: "visible"}}>
                {!undeploying && uberJar &&
                    <ProgressStep variant="pending" id="package" titleId="package" aria-label="package"
                                  description={this.getDescription(status.uberJar)}
                                  icon={this.getProgressIcon(status.uberJar?.status)}>Package
                    </ProgressStep>}
                {!undeploying && build &&
                    <ProgressStep variant="pending" isCurrent id="build" titleId="build" aria-label="build"
                                  description={this.getDescription(status.build)}
                                  icon={this.getProgressIcon(status.build?.status)}>Build
                    </ProgressStep>}
                {!undeploying && deploy &&
                    <ProgressStep variant="pending" id="deploy" titleId="deploy" aria-label="deploy"
                                  description={this.getDescription(status.deploy)}
                                  icon={this.getProgressIcon(status.deploy?.status)}>Deploy
                    </ProgressStep>}
                {undeploying &&
                    <ProgressStep variant="pending" id="undeploy" titleId="undeploy" aria-label="undeploy"
                                  description={this.getDescription(status.undeploy)}
                                  icon={this.getProgressIcon(status.undeploy?.status)}>Undeploy
                    </ProgressStep>}
            </ProgressStepper>
        )
    }

    getHeader() {
        const {profiles, profile} = this.state;
        return (
            <PageSection className="tools-section" variant={this.props.dark ? PageSectionVariants.darker : PageSectionVariants.light}>
                <Flex className="tools" direction={{default: 'row'}} justifyContent={{default: 'justifyContentSpaceBetween'}} spaceItems={{default: 'spaceItemsLg'}}>
                    <FlexItem>
                        <TextContent className="header">
                            <Text component="h2">Build Runner</Text>
                            <Badge isRead className="labels">Powered by Camel JBang</Badge>
                        </TextContent>
                    </FlexItem>
                    <FlexItem>
                        <Toolbar id="toolbar-group-types">
                            <ToolbarContent>
                                <ToolbarItem>
                                    <ProfileSelector profiles={profiles.map(p => p.name)}
                                                     profile={profile.name}
                                                     onDelete={profile => {
                                                         this.setState(state => {
                                                             state.profiles.splice(state.profiles.findIndex(p => p.name === profile), 1);
                                                             return {profiles: state.profiles, profile: this.props.profiles.at(0) || Profile.createNew("application"), tab: state.tab};
                                                         })}}
                                                     onChange={profileName => {
                                                         const prof = profiles.find(p => p.name === profileName);
                                                         if (prof) {
                                                             this.setState({profile: prof, key: Math.random().toString()});
                                                         } else {
                                                             this.setState(state => {
                                                                 const newProfile = Profile.createNew(profileName);
                                                                 newProfile.project = new ProjectModel(this.state.profile.project);
                                                                 state.profiles.push(newProfile);
                                                                 return {profiles: state.profiles, profile: newProfile, tab: state.tab};
                                                             })
                                                         }
                                                     }}/>
                                </ToolbarItem>
                            </ToolbarContent>
                        </Toolbar>
                    </FlexItem>
                </Flex>
                <Tabs className="main-tabs" activeKey={this.state.tab}
                      onSelect={(event, tabIndex) => {this.setState({tab: tabIndex.toString()})}}
                      style={{width: "100%"}}>
                    <Tab eventKey='project' title="Project"></Tab>
                    <Tab eventKey='properties' title="Properties"></Tab>
                </Tabs>
            </PageSection>
        )
    }

    onButtonClick(action: "start" | "stop" | "undeploy" | "run") {
        this.props.onAction?.call(this, action, this.state.profile);
    }

    getFooter() {
        const active = this.state.profile.project.status.active;
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
                            <Button variant="primary" isSmall icon={<RunIcon/>} onClick={event => this.onButtonClick( "run")}>Run</Button>
                        </ToolbarItem>
                    </ToolbarContent>
                </Toolbar>
            </div>
        </div>
    }

    getPropertiesForm() {
        return (
            <div className="center" key={this.state.profile.name}>
                <div className="center-column">
                    <Card className="builder-card" isCompact style={{width: "100%"}}>
                        {this.getCardHeader("Properties", <ClipboardIcon/>, false)}
                        <CardBody>
                            <PropertiesTable properties={this.state.profile.project.properties}
                                             onChange={properties => this.setState(state => {state.profile.project.properties = properties; return state})}/>
                        </CardBody>
                    </Card>
                </div>
            </div>
        )
    }

    getCenter() {
        return (
            <div className="center">
                <div className="center-column">
                    {this.getProjectForm()}
                    {this.getPackageForm()}
                </div>
                <div className="center-column">
                    {this.getBuildForm()}
                    {this.getDeployForm()}
                    {this.getCleanupForm()}
                </div>
            </div>
        )
    }

    render() {
        const tab = this.state.tab;
        return (
            <PageSection className="project-builder" variant={this.props.dark ? PageSectionVariants.darker : PageSectionVariants.light}
                         padding={{default: 'noPadding'}}>
                <div style={{height: "100%", display: "flex", flexDirection: "column"}}>
                    <div style={{flexShrink: "0"}}>
                        {this.getHeader()}
                    </div>
                    <div style={{overflow: "auto", flexGrow: 1}}>
                        {tab === 'project' && this.getCenter()}
                        {tab === 'properties' && this.getPropertiesForm()}
                    </div>
                    <div style={{flexShrink: "0"}}>
                        {this.getFooter()}
                    </div>
                </div>
            </PageSection>
        )
    }
};