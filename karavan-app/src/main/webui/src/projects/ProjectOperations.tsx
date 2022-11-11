import React from 'react';
import {
    Card,
    CardBody, Flex, FlexItem,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {KaravanApi} from "../api/KaravanApi";
import {DeploymentStatus, Project, ProjectFileTypes} from "./ProjectModels";

interface Props {
    project: Project,
    config: any,
    environments: string [],
}

interface State {
    project?: Project,
    status?: DeploymentStatus,
    key?: string,
}

export class ProjectOperations extends React.Component<Props, State> {

    public state: State = {
        project: this.props.project,
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
            // KaravanApi.getProjectStatus(this.props.project.projectId, (status: ProjectStatus) => {
            //     this.setState({
            //         key: Math.random().toString(),
            //         status: status
            //     });
            //     // console.log(status);
            // });
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

    // isUp(env: string): boolean {
    //     if (this.state.status) {
    //         return this.state.status.statuses.find(s => s.environment === env)?.status === 'UP';
    //     } else {
    //         return false;
    //     }
    // }

    getEnvironmentData(env: string) {
        // const pes  = this.state.status?.statuses.find(s => s.environment == env);
        // if (pes){
        //     const replicas = pes.deploymentStatus.replicas;
        //     const data = Array.from({length: replicas}, (v, k) => {
        //         return { x: k, y: 100/replicas }
        //     });
        //     const unavailableReplicas = pes.deploymentStatus.unavailableReplicas;
        //     const dataU = Array.from({length: unavailableReplicas}, (v, k) => {
        //         return { x: k, y: 100/unavailableReplicas }
        //     });
        //     const readyReplicas = pes.deploymentStatus.readyReplicas;
        //     const colorScale = Array.from({length: replicas}, (v, k) => {
        //         if (k < readyReplicas) return "rgb(56, 129, 47)"
        //         else return "#8bc1f7"
        //     })
        //     return (
        //         <div style={{ height: '185px', width: '185px' }}>
        //             <ChartDonutThreshold
        //                 constrainToVisibleArea
        //                 data={data}
        //                 colorScale={colorScale}
        //                 height={185}
        //                 width={185}
        //             >
        //                 <ChartDonutThreshold
        //                     data={dataU}
        //                     title="Pods"
        //                 />
        //             </ChartDonutThreshold>
        //         </div>
        //     );
        // }
    }

    render() {
        const { environments } = this.props;
        return (
            <Flex direction={{default: "column"}}>
                {environments.filter(e => e !== undefined)
                    .map(e =>
                        <FlexItem key={e}>
                            <Card>
                                <CardBody>
                                    <Flex direction={{default: "row"}} alignItems={{default:"alignItemsCenter"}}>
                                        <FlexItem>
                                            {/*<Badge className={this.isUp(e) ? "badge-env-up" : ""} isRead>{e}</Badge>*/}
                                        </FlexItem>
                                        <FlexItem>
                                            {/*{this.getEnvironmentData(e)}*/}
                                        </FlexItem>
                                    </Flex>
                                </CardBody>
                            </Card>
                        </FlexItem>)}
            </Flex>
        )
    }
}
