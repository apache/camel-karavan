import React from 'react';
import {
    Brand,
    Page,
    PageHeader,
    PageSidebar,
    NavItem,
    NavList,
    Nav,
    ModalVariant,
    Button,
    Modal,
    Alert,
    AlertActionCloseButton,
    Text,
    Flex,
    FlexItem,
    TextVariants,
    TextContent,
    Avatar,
    PageHeaderTools,
    PageHeaderToolsGroup,
    PageHeaderToolsItem, Dropdown, DropdownToggle
} from '@patternfly/react-core';
import {KaravanApi} from "./api/KaravanApi";
import {IntegrationPage} from "./integrations/IntegrationPage";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import logo from './logo.svg';
import './designer/karavan.css';
import {ConfigurationPage} from "./config/ConfigurationPage";
import {KameletsPage} from "./kamelets/KameletsPage";
import {Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {v4 as uuidv4} from "uuid";
import {DesignerPage} from "./integrations/DesignerPage";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import avatarImg from './avatarImg.svg';
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";

class ToastMessage {
    id: string = ''
    text: string = ''
    title: string = ''
    variant?: 'success' | 'danger' | 'warning' | 'info' | 'default';

    constructor(title: string, text: string, variant: 'success' | 'danger' | 'warning' | 'info' | 'default') {
        this.id = uuidv4();
        this.title = title;
        this.text = text;
        this.variant = variant;
    }
}

interface Props {
}

interface State {
    version: string,
    mode: 'local' | 'gitops' | 'serverless',
    isNavOpen: boolean,
    pageId: 'integrations' | 'configuration' | 'kamelets' | 'designer'
    integrations: Map<string,string>,
    integration: Integration,
    isModalOpen: boolean,
    nameToDelete: string,
    alerts: ToastMessage[],
    request: string
}

export class Main extends React.Component<Props, State> {

    public state: State = {
        version: '',
        mode: 'local',
        isNavOpen: true,
        pageId: "integrations",
        integrations: new Map<string,string>(),
        integration: Integration.createNew(),
        isModalOpen: false,
        nameToDelete: '',
        alerts: [],
        request: uuidv4()
    };

    designer = React.createRef();

    componentDidMount() {
        KaravanApi.getConfiguration((config: any) => {
            this.setState({
                version: config?.['karavan.version'],
                mode: config?.['karavan.mode'],
            })
        });
        KaravanApi.getKameletNames(names => names.forEach(name => {
            KaravanApi.getKamelet(name, yaml => KameletApi.saveKamelet(yaml))
        }));
        KaravanApi.getComponentNames(names => names.forEach(name => {
            KaravanApi.getComponent(name, json => ComponentApi.saveComponent(json))
        }));
        this.onGetIntegrations();
    }

    onNavToggle = () => {
        this.setState({
            isNavOpen: !this.state.isNavOpen
        });
    };

    onNavSelect = (result: any) => {
        if (result.itemId === 'integrations') {
            this.onGetIntegrations();
        }
        this.setState({
            pageId: result.itemId,
        });
    };

    toolBar = (version: string) => (
        <div className="top-toolbar">
            <Flex direction={{default: "row"}} justifyContent={{default: "justifyContentSpaceBetween"}}
                  style={{width: "100%"}}>
                <FlexItem style={{marginTop: "auto", marginBottom: "auto"}}>
                    <Flex direction={{default: "row"}}>
                        <FlexItem>
                            <TextContent>
                                <Text component={TextVariants.h1}>Karavan</Text>
                            </TextContent>
                        </FlexItem>
                        <FlexItem>
                            <TextContent>
                                <Text component={TextVariants.h5}>{"v. " + version}</Text>
                            </TextContent>
                        </FlexItem>
                    </Flex>
                </FlexItem>
                <FlexItem style={{marginTop: "auto", marginBottom: "auto"}}>
                    <PageHeaderTools>
                        <PageHeaderToolsGroup>
                            <PageHeaderToolsItem>
                                <Avatar src={avatarImg} alt="avatar" border="dark"/>
                            </PageHeaderToolsItem>
                            <PageHeaderToolsItem>
                                <Dropdown
                                    isPlain
                                    position="right"
                                    onSelect={event => {
                                    }}
                                    isOpen={false}
                                    toggle={<DropdownToggle onToggle={isOpen => {
                                    }}>cameleer</DropdownToggle>}
                                    // dropdownItems={userDropdownItems}
                                />
                            </PageHeaderToolsItem>
                        </PageHeaderToolsGroup>
                    </PageHeaderTools>
                </FlexItem>
            </Flex>
        </div>
    );

    header = (version: string) => (
        <PageHeader className="page-header"
                    onNavToggle={this.onNavToggle}
                    showNavToggle
                    logo={<Brand className="brand" src={logo} alt="Karavan"/>}
                    headerTools={this.toolBar(version)}
        />
    );

    pageNav = () => (<Nav onSelect={this.onNavSelect}>
        <NavList>
            <NavItem id="integrations" to="#" itemId={'integrations'}
                     isActive={this.state.pageId === 'integrations'}>
                Integrations
            </NavItem>
            <NavItem id="kamelets" to="#" itemId={"kamelets"}
                     isActive={this.state.pageId === 'kamelets'}>
                Kamelets
            </NavItem>
            <NavItem id="configuration" to="#" itemId={"configuration"}
                     isActive={this.state.pageId === 'configuration'}>
                Configuration
            </NavItem>
        </NavList>
    </Nav>);

    sidebar = () => (<PageSidebar nav={this.pageNav()} isNavOpen={this.state.isNavOpen}/>);

    onIntegrationDelete = (name: string) => {
        this.setState({isModalOpen: true, nameToDelete: name})
    };

    deleteErrorMessage = (id: string) => {
        this.setState({alerts: this.state.alerts.filter(a => a.id !== id)})
    }
    delete = () => {
        KaravanApi.deleteIntegration(this.state.nameToDelete, res => {
            if (res.status === 204) {
                this.toast("Success", "Integration deleted", "success");
                this.onGetIntegrations();
            } else {
                this.toast("Error", res.statusText, "danger");
            }
        });
        this.setState({isModalOpen: false})
    }

    toast = (title: string, text: string, variant: 'success' | 'danger' | 'warning' | 'info' | 'default') => {
        const mess = [];
        mess.push(...this.state.alerts, new ToastMessage(title, text, variant));
        this.setState({alerts: mess})
    }

    onIntegrationSelect = (filename: string) => {
        KaravanApi.getIntegration(filename, res => {
            if (res.status === 200) {
                const code: string = res.data;
                const i = CamelDefinitionYaml.yamlToIntegration(filename, code);
                this.setState({isNavOpen: false, pageId: 'designer', integration: i});
            } else {
                this.toast("Error", res.status + ", " + res.statusText, "danger");
            }
        });
    };

    onIntegrationCreate = (i: Integration) => {
        this.setState({isNavOpen: false, pageId: 'designer', integration: i});
    };

    onGetIntegrations() {
        KaravanApi.getIntegrations((integrations: {}) => {
            const map:Map<string, string> = new Map(Object.entries(integrations));
            this.setState({
                integrations: map, request: uuidv4()
            })});
    };

    render() {
        return (
            <Page className="karavan" header={this.header(this.state.version)} sidebar={this.sidebar()}>
                {this.state.pageId === 'integrations' &&
                <IntegrationPage key={this.state.request} integrations={this.state.integrations}
                                 onRefresh={this.onGetIntegrations}
                                 onDelete={this.onIntegrationDelete} onSelect={this.onIntegrationSelect}
                                 onCreate={this.onIntegrationCreate}/>}
                {this.state.pageId === 'configuration' && <ConfigurationPage/>}
                {this.state.pageId === 'kamelets' && <KameletsPage/>}
                {this.state.pageId === 'designer' &&
                <DesignerPage mode={this.state.mode} integration={this.state.integration}/>}
                <Modal
                    title="Confirmation"
                    variant={ModalVariant.small}
                    isOpen={this.state.isModalOpen}
                    onClose={() => this.setState({isModalOpen: false})}
                    actions={[
                        <Button key="confirm" variant="primary" onClick={e => this.delete()}>Delete</Button>,
                        <Button key="cancel" variant="link"
                                onClick={e => this.setState({isModalOpen: false})}>Cancel</Button>
                    ]}
                    onEscapePress={e => this.setState({isModalOpen: false})}>
                    <div>
                        Are you sure you want to delete integration?
                    </div>
                </Modal>
                {this.state.alerts.map((e: ToastMessage) => (
                    <Alert key={e.id} className="main-alert" variant={e.variant} title={e.title} timeout={2000}
                           actionClose={<AlertActionCloseButton onClose={() => this.deleteErrorMessage(e.id)}/>}>
                        {e.text}
                    </Alert>
                ))}
            </Page>
        );
    }
};