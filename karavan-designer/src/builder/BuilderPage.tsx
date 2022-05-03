import React from 'react';
import {
    Toolbar,
    ToolbarContent,
    ToolbarItem,
    TextInput,
    PageSection,
    TextContent,
    Text,
    PageSectionVariants,
    Flex,
    FlexItem,
    Badge,
    Button,
    FormGroup,
    Form,
    Card,
    CardTitle,
    CardBody,
    CardFooter,
    CardHeader, CardHeaderMain, CardActions, Checkbox, Switch, ToggleGroup, ToggleGroupItem, PopoverPosition, Popover, InputGroup, ProgressStep, ProgressStepper
} from '@patternfly/react-core';
import '../designer/karavan.css';
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";
import InProgressIcon from '@patternfly/react-icons/dist/esm/icons/in-progress-icon';
import PendingIcon from '@patternfly/react-icons/dist/esm/icons/pending-icon';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import CheckCircleIcon from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import RunIcon from '@patternfly/react-icons/dist/esm/icons/forward-icon';
import StopIcon from '@patternfly/react-icons/dist/esm/icons/stop-icon';
import JarIcon from '@patternfly/react-icons/dist/esm/icons/hotjar-icon';
import ImageIcon from '@patternfly/react-icons/dist/esm/icons/docker-icon';
import DeployIcon from '@patternfly/react-icons/dist/esm/icons/cloud-upload-alt-icon';
import ProjectIcon from '@patternfly/react-icons/dist/esm/icons/cubes-icon';
import {FileSelector} from "./FileSelector";
import {ProjectModel, ProjectStatus} from "karavan-core/lib/model/ProjectModel";

interface Props {
    dark: boolean
    project: ProjectModel
    files: string
    onChange?: (project: ProjectModel) => void
    onAction?: (action: "start" | "stop") => void
}

interface State {
    name: string,
    version: string,
    filename: string,
    namespace: string,
    tag?: string,
    sourceImage: string,
    replicas: number,
    nodePort: number,
    server?: string,
    token?: string,
    target: 'openshift' | 'minikube' | 'kubernetes',
    deploy: boolean,
    build: boolean,
    uberJar: boolean,
    filesSelected: string,
    status: ProjectStatus,
}

export class BuilderPage extends React.Component<Props, State> {

    public state: State = this.props.project;

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        console.log(this.state);
        this.props.onChange?.call(this, this.state);
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

    getCardHeader(title: string, icon: any, optional: boolean = true, checked: boolean = false, onCheck?: (check: boolean) => void) {
        return <CardHeader>
            <CardHeaderMain>
                <CardTitle className="card-header">
                    {icon}{title}
                </CardTitle>
            </CardHeaderMain>
            <CardActions hasNoOffset={true}>
                {optional && <Checkbox isChecked={checked} onChange={checked => onCheck?.call(this, checked)} aria-label="card checkbox example" id="check-1" name="check1"/>}
            </CardActions>
        </CardHeader>
    }

    getProjectForm() {
        return (
            <Card className="builder-card" isCompact style={{width: "100%"}}>
                {this.getCardHeader("Project", <ProjectIcon/>, false)}
                <CardBody>
                    <Form isHorizontal>
                        {this.getField("name", "Name", "text", this.state.name, "Project name", val => this.setState({name: val}), true)}
                        {this.getField("version", "Version", "text", this.state.version, "Project version", val => this.setState({version: val}), true)}
                    </Form>
                </CardBody>
            </Card>
        )
    }

    getPackageForm() {
        const {uberJar, filesSelected} = this.state;
        return <Card className="builder-card" isCompact style={{width: "100%"}}>
            {this.getCardHeader("Package", <JarIcon/>, true, this.state.uberJar, check => this.setState({uberJar: check}))}
            <CardBody className={uberJar ? "" : "card-disabled"}>
                <Form isHorizontal>
                    {this.getField("filename", "Jar", "text", this.state.filename, "Jar file name", val => this.setState({filename: val}), true, uberJar)}
                    {this.props.files.length >0 && <FileSelector files={this.props.files} filesSelected={filesSelected} onChange={filesSelected => this.setState({filesSelected: filesSelected})}/>}
                </Form>
            </CardBody>
        </Card>
    }

    getBuildForm() {
        const {target, deploy, build} = this.state;
        return <Card className="builder-card" isCompact style={{width: "100%"}}>
            {this.getCardHeader("Build", <ImageIcon/>, true, this.state.build, check => this.setState({build: check}))}
            <CardBody className={build ? "" : "card-disabled"}>
                <Form isHorizontal>
                    <FormGroup label="Target" fieldId="tag" isRequired disabled={true}>
                        <ToggleGroup aria-label="Select target">
                            <ToggleGroupItem isDisabled={!build} text="Minikube" buttonId="minikube" isSelected={target === 'minikube'}
                                             onChange={selected => selected ? this.setState({target: 'minikube'}) : {}}/>
                            <ToggleGroupItem isDisabled={!build} text="Kubernetes" buttonId="kubernetes" isSelected={target === 'kubernetes'}
                                             onChange={selected => selected ? this.setState({target: 'kubernetes'}) : {}}/>
                            <ToggleGroupItem isDisabled={!build} text="Openshift" buttonId="openshift" isSelected={target === 'openshift'}
                                             onChange={selected => selected ? this.setState({target: 'openshift'}) : {}}/>
                        </ToggleGroup>
                    </FormGroup>
                    {this.getField("namespace", "Namespace", "text", this.state.namespace, "Namespace to build and/or deploy", val => this.setState({namespace: val}), true, build)}
                    {this.getField("tag", "Image tag", "text", this.state.tag, "Image tag", val => this.setState({tag: val}), true, build)}
                    {target === 'openshift' && this.getField("sourceImage", "Source tag", "text", this.state.sourceImage, "Source image name (for OpenShift BuildConfig)", val => this.setState({sourceImage: val}), true, build)}
                    {target === 'openshift' && this.getField("server", "Server", "text", this.state.server, "Master URL", val => this.setState({server: val}), true, build)}
                    {target === 'openshift' && this.getField("token", "Token", "text", this.state.token, "Authentication Token", val => this.setState({token: val}), true, build)}
                </Form>
            </CardBody>
        </Card>
    }

    getDeployForm() {
        const {target, deploy, build} = this.state;
        return <Card className="builder-card" isCompact style={{width: "100%"}}>
            {this.getCardHeader("Deploy", <DeployIcon/>, true, this.state.deploy, check => this.setState({deploy: check}))}
            <CardBody className={build ? "" : "card-disabled"}>
                <Form isHorizontal>
                    {deploy && target === 'openshift' && this.getField("replicas", "Replicas", "number", this.state.replicas, "Number of replicas of the application", val => this.setState({replicas: val}), true, build)}
                    {deploy && target === 'minikube' && this.getField("nodePort", "Node port", "number", this.state.nodePort, "Node port (minikube)", val => this.setState({nodePort: val}), true, build)}
                </Form>
            </CardBody>
        </Card>
    }

    getProgressIcon(status: 'pending' | 'progress' | 'done' | 'error') {
        switch (status) {
            case "pending":
                return <PendingIcon/>;
            case "progress":
                return <InProgressIcon/>;
            case "done":
                return <CheckCircleIcon/>;
            case "error":
                return <ExclamationCircleIcon/>;
            default:
                return undefined;
        }
    }

    getProgress() {
        const {status, uberJar, build, deploy} = this.state;
        return (
            <ProgressStepper isCenterAligned style={{visibility: "visible"}}>
                {uberJar && <ProgressStep variant="pending" id="package" titleId="package" aria-label="package" icon={this.getProgressIcon(status.uberJar)}>Package</ProgressStep>}
                {build && <ProgressStep variant="pending" isCurrent id="build" titleId="build" aria-label="build" icon={this.getProgressIcon(status.build)}>Build</ProgressStep>}
                {deploy && <ProgressStep variant="pending" id="deploy" titleId="deploy" aria-label="deploy" icon={this.getProgressIcon(status.deploy)}>Deploy</ProgressStep>}
            </ProgressStepper>
        )
    }

    getHeader() {
        return (
            <PageSection className="tools-section" variant={this.props.dark ? PageSectionVariants.darker : PageSectionVariants.light}>
                <Flex className="tools" direction={{default: 'row'}} justifyContent={{default: 'justifyContentSpaceBetween'}} spaceItems={{default: 'spaceItemsLg'}}>
                    <FlexItem>
                        <TextContent className="header">
                            <Text component="h2">Project Builder</Text>
                            <Badge isRead className="labels">Powered by Camel JBang</Badge>
                        </TextContent>
                    </FlexItem>
                    <FlexItem>
                        <Toolbar id="toolbar-group-types">
                            <ToolbarContent>
                                <ToolbarItem>
                                    <Button variant="plain" onClick={e => {
                                    }}><HelpIcon/></Button>
                                </ToolbarItem>
                            </ToolbarContent>
                        </Toolbar>
                    </FlexItem>
                </Flex>
            </PageSection>
        )
    }

    onButtonClick() {
        this.props.onAction?.call(this, this.state.status.active ? "stop" : "start");
    }

    getFooter() {
        const active = this.state.status.active;
        const label = active ? "Stop" : "Start";
        return <div className="footer">
                    <div className="progress">
                        {active && this.getProgress()}
                    </div>
                    <div style={{margin: "auto", height: "60px"}}>
                        <Button variant="primary" isLarge onClick={event => this.onButtonClick()}>
                            {label}
                        </Button>
                    </div>
                </div>
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
                </div>
            </div>
        )
    }

    render() {
        return (
            <PageSection className="project-builder" variant={this.props.dark ? PageSectionVariants.darker : PageSectionVariants.light}
                         padding={{default: 'noPadding'}}>
                <div style={{height: "100%", display: "flex", flexDirection: "column"}}>
                    <div style={{flexShrink: "0"}}>
                        {this.getHeader()}
                    </div>
                    <div style={{overflow: "auto", flexGrow: 1}}>
                        {this.getCenter()}
                    </div>
                    <div style={{flexShrink: "0"}}>
                        {this.getFooter()}
                    </div>
                </div>
            </PageSection>
        )
    }
};