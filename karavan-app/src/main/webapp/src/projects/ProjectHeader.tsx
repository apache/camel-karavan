import React from 'react';
import {
    Badge,
    Button,
    Text,
    DescriptionList,
    DescriptionListTerm,
    DescriptionListGroup,
    DescriptionListDescription,
    Card,
    CardBody, Tooltip, Flex, FlexItem, Tabs, Tab, PageSection, TextVariants, Spinner, Divider
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {KaravanApi} from "../api/KaravanApi";
import {Project, ProjectFileTypes, ProjectStatus} from "../models/ProjectModels";
import BuildIcon from "@patternfly/react-icons/dist/esm/icons/build-icon";
import PushIcon from "@patternfly/react-icons/dist/esm/icons/code-branch-icon";
import DeployIcon from "@patternfly/react-icons/dist/esm/icons/cluster-icon";
import {ProjectDashboard} from "./ProjectDashboard";
import {ChartDonut, ChartLabel} from "@patternfly/react-charts";
import {TableComposable, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";

interface Props {
    project: Project,
    config: any,
}

interface State {
    project?: Project,
    status?: ProjectStatus,
    isPushing: boolean,
    isBuilding: boolean,
    environments: string[],
    environment: string,
    key?: string,
    tab: string | number;
}

export class ProjectHeader extends React.Component<Props, State> {

    public state: State = {
        project: this.props.project,
        isPushing: false,
        isBuilding: false,
        environments: this.props.config.environments && Array.isArray(this.props.config.environments)
            ? Array.from(this.props.config.environments) : [],
        environment: this.props.config.environments && Array.isArray(this.props.config.environments)
            ? this.props.config.environments[0] : '',
        tab: "details"
    };
    interval: any;

    componentDidMount() {
        this.onRefresh();
        this.interval = setInterval(() => this.onRefreshStatus(), 700);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    onRefresh = () => {
        if (this.props.project) {
            KaravanApi.getProject(this.props.project.projectId, (project: Project) => {
                this.setState({
                    project: project
                })
            });
        }
    }

    onRefreshStatus = () => {
        if (this.props.project) {
            KaravanApi.getProjectStatus(this.props.project.projectId, (status: ProjectStatus) => {
                this.setState({
                    key: Math.random().toString(),
                    status: status
                });
                // console.log(status);
            });
        }
    }

    push = (after?: () => void) => {
        this.setState({isPushing: true});
        KaravanApi.push(this.props.project, res => {
            console.log(res)
            if (res.status === 200 || res.status === 201) {
                this.setState({isPushing: false});
                after?.call(this);
                this.onRefresh();
            } else {
                // Todo notification
            }
        });
    }

    build = () => {
        this.setState({isBuilding: true});
        KaravanApi.tekton(this.props.project, this.state.environment, res => {
            console.log(res)
            if (res.status === 200 || res.status === 201) {
                this.setState({isBuilding: false});
                this.onRefresh();
            } else {
                // Todo notification
            }
        });
    }

    getType = (name: string) => {
        const extension = name.substring(name.lastIndexOf('.') + 1);
        const type = ProjectFileTypes.filter(p => p.extension === extension).map(p => p.title)[0];
        if (type) {
            return type
        } else {
            return "Unknown"
        }
    }

    pushButton = () => {
        const isPushing = this.state.isPushing;
        return (<Tooltip content="Commit and push to git" position={"left"}>
            <Button isLoading={isPushing ? true : undefined} isSmall variant="secondary"
                    className="project-button"
                    icon={!isPushing ? <PushIcon/> : <div></div>}
                    onClick={e => this.push()}>
                {isPushing ? "..." : "Commit"}
            </Button>
        </Tooltip>)
    }

    buildButton = () => {
        const isDeploying = this.state.isBuilding;
        return (<Tooltip content="Commit, push, build and deploy" position={"left"}>
            <Button isLoading={isDeploying ? true : undefined} isSmall variant="secondary"
                    className="project-button"
                    icon={!isDeploying ? <BuildIcon/> : <div></div>}
                    onClick={e => {
                        this.push(() => this.build());
                    }}>
                {isDeploying ? "..." : "Build"}
            </Button>
        </Tooltip>)
    }

    deployButton = () => {
        const isDeploying = this.state.isBuilding;
        return (<Tooltip content="Deploy" position={"left"}>
            <Button isLoading={isDeploying ? true : undefined} isSmall variant="secondary"
                    className="project-button"
                    icon={!isDeploying ? <DeployIcon/> : <div></div>}
                    onClick={e => {
                        this.push(() => this.build());
                    }}>
                {isDeploying ? "..." : "Deploy"}
            </Button>
        </Tooltip>)
    }

    getCurrentStatus() {
        return (<Text>OK</Text>)
    }

    getCommitPanel() {
        const {project, environments, status} = this.state;
        return (<Flex justifyContent={{default:"justifyContentSpaceBetween"}}>
            <FlexItem>
                <Tooltip content={project?.lastCommit} position={"right"}>
                    <Badge>{project?.lastCommit ? project?.lastCommit?.substr(0, 7) : "-"}</Badge>
                </Tooltip>
            </FlexItem>
            <FlexItem>
                {this.pushButton()}
            </FlexItem>
        </Flex>)
    }


    getEnvDonut(env: string) {
        return (
            <div style={{height: '50px', width: '50px'}}>
                    <ChartDonut
                        constrainToVisibleArea={true}
                        data={[{x: "", y: 100}]}
                        colorScale={[this.isUp(env) ? "rgb(56, 129, 47)" : "#8bc1f7"]}
                        labels={({datum}) => datum.x ? datum.x : null}
                        title={env}
                        titleComponent={<ChartLabel style={{fontSize: "56px"}}/>}
                        radius={100}
                        innerRadius={80}
                        style={{border: {width: "20px"}}}
                    >
                    </ChartDonut>
                </div>)
    }

    getEnvChartPanel(env: string) {
        return (<div style={{height: '60px', width: '60px'}}>
            <ChartDonut
                constrainToVisibleArea={true}
                data={[{x: "", y: 100}]}
                colorScale={[this.isUp(env) ? "rgb(56, 129, 47)" : "#8bc1f7"]}
                labels={({datum}) => datum.x ? datum.x : null}
                title={env}
                titleComponent={<ChartLabel style={{fontSize: "56px"}}/>}
                radius={100}
                innerRadius={80}
                style={{border: {width: "20px"}}}
            >
            </ChartDonut>
        </div>)
    }

    getEnvPanel(env: string) {
        const {status} = this.state;
        const deploymentStatus = status?.statuses.find(s => s.environment === env)?.deploymentStatus;
        const ok = (deploymentStatus && deploymentStatus?.readyReplicas > 0 && deploymentStatus?.replicas === deploymentStatus?.readyReplicas);
        return (<DescriptionList isHorizontal>
            <Text style={{fontSize:"1.2em", fontWeight:"bold"}}>Deployment</Text>
            <DescriptionListGroup>
                <DescriptionListTerm>Pipeline</DescriptionListTerm>
                <DescriptionListDescription>{this.getPipelineState(env)}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Image</DescriptionListTerm>
                <DescriptionListDescription>
                    <Badge>{deploymentStatus ? deploymentStatus.image : "-"}</Badge>
                </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Replicas</DescriptionListTerm>
                <DescriptionListDescription><Badge isRead={!ok}>{deploymentStatus ? deploymentStatus.replicas : "-"}</Badge>
                </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Ready replicas</DescriptionListTerm>
                <DescriptionListDescription><Badge isRead={!ok}>{deploymentStatus ? deploymentStatus.readyReplicas : "-"}</Badge>
                </DescriptionListDescription>
            </DescriptionListGroup>
        </DescriptionList>)
    }

    getHealthPanel(env: string) {
        const {status} = this.state;
        const camelStatus: string = "UP";
        const routesStatus: string = "UP";
        const consumersStatus: string = "UP";
        const contextStatus: string = "UP";
        return (<DescriptionList isHorizontal>
            <Text style={{fontSize:"1.2em", fontWeight:"bold"}}>Health</Text>
            <DescriptionListGroup>
                <DescriptionListTerm>Status</DescriptionListTerm>
                <DescriptionListDescription><Badge isRead={camelStatus === "DOWN"}>{camelStatus}</Badge></DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Consumers</DescriptionListTerm>
                <DescriptionListDescription><Badge isRead={consumersStatus === "DOWN"}>{consumersStatus}</Badge></DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Routes</DescriptionListTerm>
                <DescriptionListDescription><Badge isRead={routesStatus === "DOWN"}>{routesStatus}</Badge></DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Context</DescriptionListTerm>
                <DescriptionListDescription><Badge isRead={contextStatus === "DOWN"}>{contextStatus}</Badge></DescriptionListDescription>
            </DescriptionListGroup>
        </DescriptionList>)
    }

    getPipelineState(env: string) {
        const {status} = this.state;
        const pipeline = status?.statuses.find(s => s.environment === env)?.lastPipelineRun;
        const pipelineResult = status?.statuses.find(s => s.environment === env)?.lastPipelineRunResult;
        const isRunning = pipelineResult === 'Running';
        const isFailed = pipelineResult === 'Failed';
        const isSucceeded = pipelineResult === 'Succeeded';
        let classname = "pipeline"
        if (isRunning) classname = classname + " pipeline-running";
        if (isFailed) classname = classname + " pipeline-failed";
        if (isSucceeded) classname = classname + " pipeline-succeeded";
        return (
            <Flex justifyContent={{default:"justifyContentSpaceBetween"}}>
                <FlexItem>
                    <Tooltip content={pipelineResult} position={"right"}>
                        <Flex spaceItems={{default: 'spaceItemsNone'}} className={classname} direction={{default: "row"}}
                              alignItems={{default: "alignItemsCenter"}}>
                            <FlexItem style={{height: "18px"}}>
                                {isRunning && <Spinner isSVG diameter="16px"/>}
                            </FlexItem>
                            <FlexItem style={{height: "18px"}}>
                                <Text>{pipeline ? pipeline : "-"}</Text>
                            </FlexItem>
                        </Flex>
                    </Tooltip>
                </FlexItem>
                <FlexItem>{env === "dev" && this.buildButton()}</FlexItem>
            </Flex>
        )
    }

    isUp(env: string): boolean {
        if (this.state.status) {
            return this.state.status.statuses.find(s => s.environment === env)?.status === 'UP';
        } else {
            return false;
        }
    }

    getProjectDescription() {
        const {project} = this.state;
        return (<DescriptionList isHorizontal>
            <Text style={{fontSize:"1.2em", fontWeight:"bold"}}>Details</Text>
            <DescriptionListGroup>
                <DescriptionListTerm>Project ID</DescriptionListTerm>
                <DescriptionListDescription>{project?.projectId}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Name</DescriptionListTerm>
                <DescriptionListDescription>{project?.name}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Description</DescriptionListTerm>
                <DescriptionListDescription>{project?.description}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Last commit</DescriptionListTerm>
                <DescriptionListDescription>
                    {this.getCommitPanel()}
                </DescriptionListDescription>
            </DescriptionListGroup>
        </DescriptionList>)
    }

    getProjectInfo() {
        return (
            <Card>
                <CardBody>
                    <Flex direction={{default: "row"}}
                          justifyContent={{default: "justifyContentSpaceBetween"}}
                          alignItems={{default: "alignItemsFlexStart"}}
                          className="project-details">
                        <FlexItem flex={{default: "flex_1"}}>
                                {this.getProjectDescription()}
                        </FlexItem>
                        <Divider orientation={{default:"vertical"}}/>
                        <FlexItem flex={{default: "flex_1"}}>
                            {this.getHealthPanel("dev")}
                        </FlexItem>
                        <Divider orientation={{default:"vertical"}}/>
                        <FlexItem flex={{default: "flex_1"}}>
                            {this.getEnvPanel("dev")}
                        </FlexItem>
                    </Flex>
                </CardBody>
            </Card>)
    }

    render() {
        const {tab} = this.state;
        return (
            <Flex direction={{default: "column"}} spaceItems={{default:"spaceItemsNone"}}>
                <FlexItem>
                    <Tabs activeKey={tab} onSelect={(event, tabIndex) => this.setState({tab: tabIndex})}>
                        <Tab eventKey="details" title="Details"/>
                        <Tab eventKey="dashboard" title="Dashboard"/>
                    </Tabs>
                </FlexItem>
                <FlexItem>
                    <PageSection padding={{default: "padding"}}>
                        {tab === 'details' && this.getProjectInfo()}
                        {tab === 'dashboard' &&
                            <ProjectDashboard project={this.props.project} config={this.props.config}/>}
                    </PageSection>
                </FlexItem>
            </Flex>
        )
    }
}
