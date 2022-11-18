import React from 'react';
import {
    Badge, Bullseye,
    Button, EmptyState, EmptyStateIcon, EmptyStateVariant,
    Flex,
    FlexItem, HelperText, HelperTextItem, Label, LabelGroup,
    PageSection, Spinner,
    Text,
    TextContent,
    TextInput, Title, ToggleGroup, ToggleGroupItem,
    Toolbar,
    ToolbarContent,
    ToolbarItem, Tooltip
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {MainToolbar} from "../MainToolbar";
import {CamelStatus, DeploymentStatus, Project, ServiceStatus} from "../projects/ProjectModels";
import {TableComposable, TableVariant, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import {camelIcon, CamelUi} from "../designer/utils/CamelUi";
import {KaravanApi} from "../api/KaravanApi";
import Icon from "../Logo";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import RefreshIcon from "@patternfly/react-icons/dist/esm/icons/sync-alt-icon";
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";

interface Props {
    config: any,
    onSelect: (project: Project) => void
    toast: (title: string, text: string, variant: 'success' | 'danger' | 'warning' | 'info' | 'default') => void
}

interface State {
    projects: Project[],
    deploymentStatuses: DeploymentStatus[],
    serviceStatuses: ServiceStatus[],
    camelStatuses: CamelStatus[],
    isCreateModalOpen: boolean,
    isDeleteModalOpen: boolean,
    isCopy: boolean,
    loading: boolean,
    projectToCopy?: Project,
    projectToDelete?: Project,
    filter: string,
    name: string,
    description: string,
    projectId: string,
    selectedEnv: string[]
}

export class DashboardPage extends React.Component<Props, State> {

    public state: State = {
        projects: [],
        deploymentStatuses: [],
        serviceStatuses: [],
        camelStatuses: [],
        isCreateModalOpen: false,
        isDeleteModalOpen: false,
        isCopy: false,
        loading: true,
        filter: '',
        name: '',
        description: '',
        projectId: '',
        selectedEnv: this.getEnvironments()
    };
    interval: any;

    componentDidMount() {
        this.interval = setInterval(() => this.onGetProjects(), 1300);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    onGetProjects = () => {
        KaravanApi.getConfiguration((config: any) => {
            KaravanApi.getProjects((projects: Project[]) => {
                this.setState({projects: projects, loading: false})
            });
            KaravanApi.getAllDeploymentStatuses((statuses: DeploymentStatus[]) => {
                this.setState({deploymentStatuses: statuses});
            });
            KaravanApi.getAllServiceStatuses((statuses: ServiceStatus[]) => {
                this.setState({serviceStatuses: statuses});
            });
            this.getSelectedEnvironments().forEach(env => {
                KaravanApi.getAllCamelStatuses(env,(statuses: CamelStatus[]) => {
                    this.setState((state) => {
                        statuses.forEach(newStatus => {
                            const index = state.camelStatuses.findIndex(s => s.projectId === newStatus.projectId && s.env === newStatus.env);
                            if (index !== -1) {
                                state.camelStatuses.splice(index, 1);
                            }
                            state.camelStatuses.push(newStatus);
                        })
                        return state;
                    })
                });
            })
        });
    }

    selectEnvironment(name: string, selected: boolean) {
        if (selected && !this.state.selectedEnv.includes(name)) {
            this.setState((state) => {
                state.selectedEnv.push(name);
                return state;
            })
        } else if (!selected && this.state.selectedEnv.includes(name)) {
            this.setState((prevState) => ({
                selectedEnv: prevState.selectedEnv.filter(e => e !== name)
            }));
        }
    }

    tools = () => (<Toolbar id="toolbar-group-types">
        <ToolbarContent>
            <ToolbarItem>
                <Button variant="link" icon={<RefreshIcon/>} onClick={e => this.onGetProjects()}/>
            </ToolbarItem>
            <ToolbarItem>
                <ToggleGroup aria-label="Default with single selectable">
                    {this.getEnvironments().map(env => (
                        <ToggleGroupItem text={env} buttonId={env} isSelected={this.state.selectedEnv.includes(env)} onChange={selected => this.selectEnvironment(env, selected)}/>
                    ))}
                </ToggleGroup>
            </ToolbarItem>
            <ToolbarItem>
                <TextInput className="text-field" type="search" id="search" name="search"
                           autoComplete="off" placeholder="Search deployment by name"
                           value={this.state.filter}
                           onChange={e => this.setState({filter: e})}/>
            </ToolbarItem>
        </ToolbarContent>
    </Toolbar>);

    title = () => (<TextContent>
        <Text component="h2">Dashboard</Text>
    </TextContent>);

    getEnvironments(): string [] {
        return this.props.config.environments && Array.isArray(this.props.config.environments) ? Array.from(this.props.config.environments) : [];
    }

    getSelectedEnvironments(): string [] {
        return this.getEnvironments().filter(e => this.state.selectedEnv.includes(e));
    }

    getDeploymentEnvironments(name: string): [string, boolean] [] {
        const deps = this.state.deploymentStatuses;
        return this.getSelectedEnvironments().map(e => {
            const env: string = e as string;
            const dep = deps.find(d => d.name === name && d.env === env);
            const deployed: boolean = dep !== undefined && dep.replicas > 0 && dep.replicas === dep.readyReplicas;
            return [env, deployed];
        });
    }

    getDeploymentByEnvironments(name: string): [string, DeploymentStatus | undefined] [] {
        const deps = this.state.deploymentStatuses;
        return this.getSelectedEnvironments().map(e => {
            const env: string = e as string;
            const dep = deps.find(d => d.name === name && d.env === env);
            return [env, dep];
        });
    }

    getServiceByEnvironments(name: string): [string, ServiceStatus | undefined] [] {
        const services = this.state.serviceStatuses;
        return this.getSelectedEnvironments().map(e => {
            const env: string = e as string;
            const service = services.find(d => d.name === name && d.env === env);
            return [env, service];
        });
    }

    getCamelStatusByEnvironments(name: string): [string, CamelStatus | undefined] [] {
        const camelStatuses = this.state.camelStatuses;
        return this.getSelectedEnvironments().map(e => {
            const env: string = e as string;
            const status = camelStatuses.find(d => d.projectId === name && d.env === env);
            return [env, status];
        });
    }

    getProject(name: string): Project | undefined {
        return this.state.projects.filter(p => p.projectId === name)?.at(0);
    }

    isKaravan(name: string): boolean {
        return this.state.projects.findIndex(p => p.projectId === name) > -1;
    }

    getReplicasPanel(deploymentStatus?: DeploymentStatus) {
        if (deploymentStatus) {
            const readyReplicas = deploymentStatus.readyReplicas ? deploymentStatus.readyReplicas : 0;
            const ok = (deploymentStatus && readyReplicas > 0
                && (deploymentStatus.unavailableReplicas === 0 || deploymentStatus.unavailableReplicas === undefined || deploymentStatus.unavailableReplicas === null)
                && deploymentStatus?.replicas === readyReplicas);
            return (
                <Flex justifyContent={{default: "justifyContentSpaceBetween"}} alignItems={{default: "alignItemsCenter"}}>
                    <FlexItem>
                        <LabelGroup numLabels={3}>
                            <Tooltip content={"Ready Replicas / Replicas"} position={"left"}>
                                <Label className="table-label" icon={ok ? <UpIcon/> : <DownIcon/>}
                                       color={ok ? "green" : "grey"}>{"Replicas: " + readyReplicas + " / " + deploymentStatus.replicas}</Label>
                            </Tooltip>
                            {deploymentStatus.unavailableReplicas > 0 &&
                                <Tooltip content={"Unavailable replicas"} position={"right"}>
                                    <Label icon={<DownIcon/>} color={"red"}>{deploymentStatus.unavailableReplicas}</Label>
                                </Tooltip>
                            }
                        </LabelGroup>
                    </FlexItem>
                </Flex>
            )
        } else {
            return (
                <Tooltip content={"No information"} position={"right"}>
                    <Label color={"grey"}>???</Label>
                </Tooltip>
            );
        }
    }

    getEmptyState() {
        const {loading} = this.state;
        return (
            <Tr>
                <Td colSpan={8}>
                    <Bullseye>
                        {loading && <Spinner className="progress-stepper" isSVG diameter="80px" aria-label="Loading..."/>}
                        {!loading &&
                            <EmptyState variant={EmptyStateVariant.small}>
                                <EmptyStateIcon icon={SearchIcon}/>
                                <Title headingLevel="h2" size="lg">
                                    No results found
                                </Title>
                            </EmptyState>
                        }
                    </Bullseye>
                </Td>
            </Tr>
        )
    }

    render() {
        const deployments = Array.from(new Set(this.state.deploymentStatuses.filter(d => d.name.toLowerCase().includes(this.state.filter)).map(d => d.name)));
        return (
            <PageSection className="kamelet-section dashboard-page" padding={{default: 'noPadding'}}>
                <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                    <MainToolbar title={this.title()} tools={this.tools()}/>
                </PageSection>
                <PageSection isFilled className="kamelets-page">
                    <TableComposable aria-label="Projects" variant={TableVariant.compact}>
                        <Thead>
                            <Tr>
                                <Th key='type'>Type</Th>
                                <Th key='name'>Deployment</Th>
                                <Th key='description'>Project/Description</Th>
                                <Th key='environment'>Environment</Th>
                                <Th key='namespace'>Namespace</Th>
                                <Th key='replicas'>Replicas</Th>
                                <Th key='services'>Services</Th>
                                <Th key='camel'>Camel Health</Th>
                                {/*<Th key='action'></Th>*/}
                            </Tr>
                        </Thead>
                        <Tbody>
                            {deployments.map(deployment => (
                                <Tr key={deployment}>
                                    <Td style={{verticalAlign: "middle"}}>
                                        {this.isKaravan(deployment) ? Icon("icon") : CamelUi.getIconFromSource(camelIcon)}
                                    </Td>
                                    <Td style={{verticalAlign: "middle"}}>
                                        <Button style={{padding: '6px'}} variant={"link"}>{deployment}</Button>
                                    </Td>
                                    <Td style={{verticalAlign: "middle"}}>
                                        <HelperText>
                                            <HelperTextItem>{this.getProject(deployment)?.name || ""}</HelperTextItem>
                                            <HelperTextItem>{this.getProject(deployment)?.description || "Camel project"}</HelperTextItem>
                                        </HelperText>
                                    </Td>
                                    <Td>
                                        <Flex direction={{default: "column"}}>
                                            {this.getDeploymentEnvironments(deployment).map(value => (
                                                <FlexItem className="badge-flex-item" key={value[0]}><Badge className="badge"
                                                                                                            isRead={!value[1]}>{value[0]}</Badge></FlexItem>
                                            ))}
                                        </Flex>
                                    </Td>
                                    <Td>
                                        <Flex direction={{default: "column"}}>
                                            {this.getDeploymentByEnvironments(deployment).map(value => (
                                                <FlexItem className="badge-flex-item" key={value[0]}>
                                                    <Label variant={"outline"}>
                                                        {value[1]?.namespace || "???"}
                                                    </Label>
                                                </FlexItem>
                                            ))}
                                        </Flex>
                                    </Td>
                                    <Td>
                                        <Flex direction={{default: "column"}}>
                                            {this.getDeploymentByEnvironments(deployment).map(value => (
                                                <FlexItem className="badge-flex-item" key={value[0]}>{this.getReplicasPanel(value[1])}</FlexItem>
                                            ))}
                                        </Flex>
                                    </Td>
                                    <Td>
                                        <Flex direction={{default: "column"}}>
                                            {this.getServiceByEnvironments(deployment).map(value => (
                                                <FlexItem className="badge-flex-item" key={value[0]}>
                                                    <Label variant={"outline"}>
                                                        {value[1] ? (value[1]?.port + " -> " + value[1]?.targetPort) : "???"}
                                                    </Label>
                                                </FlexItem>
                                            ))}
                                        </Flex>
                                    </Td>
                                    <Td modifier={"fitContent"}>
                                        <Flex direction={{default: "column"}}>
                                            {this.getCamelStatusByEnvironments(deployment).map(value => {
                                                const color = value[1] ? (value[1].consumerStatus === "UP" ? "green" : "red") : "grey";
                                                let icon = undefined;
                                                if (value[1]?.consumerStatus === "UP") icon = <UpIcon/>
                                                if (value[1]?.consumerStatus === "DOWN") icon = <DownIcon/>
                                                const text = value[1] && value[1]?.contextVersion ? value[1]?.contextVersion : "???";
                                                return <FlexItem key={value[0]}>
                                                    <LabelGroup numLabels={4} className="camel-label-group">
                                                        <Label color={color} className="table-label" icon={icon}>{text}</Label>
                                                    </LabelGroup>
                                                </FlexItem>
                                            })}
                                        </Flex>
                                    </Td>
                                </Tr>
                            ))}
                            {deployments.length === 0 && this.getEmptyState()}
                        </Tbody>
                    </TableComposable>
                </PageSection>
            </PageSection>
        )
    }
}