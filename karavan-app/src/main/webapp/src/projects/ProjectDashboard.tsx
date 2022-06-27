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
    CardBody, Spinner, Tooltip, Flex, FlexItem, Tabs, Tab, PageSection
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {KaravanApi} from "../api/KaravanApi";
import {Project, ProjectFileTypes, ProjectStatus} from "../models/ProjectModels";
import BuildIcon from "@patternfly/react-icons/dist/esm/icons/build-icon";
import PushIcon from "@patternfly/react-icons/dist/esm/icons/code-branch-icon";
import {ChartDonut, ChartDonutThreshold, ChartDonutUtilization} from "@patternfly/react-charts";

interface Props {
    project: Project,
    config: any,
}

interface State {
    project?: Project,
    status?: ProjectStatus,
    environments: string[],
    environment: string,
    key?: string,
}

export class ProjectDashboard extends React.Component<Props, State> {

    public state: State = {
        project: this.props.project,
        environments: this.props.config.environments && Array.isArray(this.props.config.environments)
            ? Array.from(this.props.config.environments) : [],
        environment: this.props.config.environments && Array.isArray(this.props.config.environments)
            ? this.props.config.environments[0] : ''
    };
    interval: any;

    componentDidMount() {
        this.onRefresh();
        this.interval = setInterval(() => this.onRefreshStatus(), 3000);
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

    getType = (name: string) => {
        const extension = name.substring(name.lastIndexOf('.') + 1);
        const type = ProjectFileTypes.filter(p => p.extension === extension).map(p => p.title)[0];
        if (type) {
            return type
        } else {
            return "Unknown"
        }
    }

    getCurrentStatus() {
        return (<Text>OK</Text>)
    }

    getPipelineState() {
        const {project, status} = this.state;
        const isRunning = status?.pipeline === 'Running';
        const isFailed = status?.pipeline === 'Failed';
        const isSucceeded = status?.pipeline === 'Succeeded';
        let classname = "pipeline"
        if (isRunning) classname = classname + " pipeline-running";
        if (isFailed) classname = classname + " pipeline-running";
        if (isSucceeded) classname = classname + " pipeline-succeeded";
        return (
            <Flex spaceItems={{default: 'spaceItemsNone'}} className={classname} direction={{default: "row"}}
                  alignItems={{default: "alignItemsCenter"}}>
                <FlexItem style={{height: "18px"}}>
                    {isRunning && <Spinner isSVG diameter="16px"/>}
                </FlexItem>
                <FlexItem style={{height: "18px"}}>
                    {project?.lastPipelineRun ? project?.lastPipelineRun : "-"}
                </FlexItem>
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

    getEnvironmentData() {
        const used  = true;
        const specReplicas = 3;
        const data = Array.from({length: specReplicas}, (v, k) => {
            return { x: k, y: 100/specReplicas }
        });
        const statusReplicas = 2;
        const colorScale = Array.from({length: specReplicas}, (v, k) => {
            console.log(" " + k)
            if (k < statusReplicas) return "rgb(56, 129, 47)"
            else return "#8bc1f7"
        })
        return (
            <div style={{ height: '130px', width: '130px' }}>
                <ChartDonut
                    constrainToVisibleArea={true}
                    data={data}
                    colorScale={colorScale}
                    labels={({ datum }) => datum.x ? datum.x : null}
                    title="Pods"
                >
                </ChartDonut>
            </div>
        );
    }

    render() {
        const {project, environments, status} = this.state;
        return (
            <Flex direction={{default: "column"}}>
                {environments.filter(e => e !== undefined)
                    .map(e =>
                        <FlexItem key={e}>
                            <Card>
                                <CardBody>
                                    <Flex direction={{default: "row"}} alignItems={{default:"alignItemsCenter"}}>
                                        <FlexItem>
                                            <Badge className={this.isUp(e) ? "badge-env-up" : ""} isRead>{e}</Badge>
                                        </FlexItem>
                                        <FlexItem>
                                            {this.getEnvironmentData()}
                                        </FlexItem>
                                    </Flex>
                                </CardBody>
                            </Card>
                        </FlexItem>)}
            </Flex>
        )
    }
}
