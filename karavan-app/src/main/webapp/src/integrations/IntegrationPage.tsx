import React from 'react';
import {
    Toolbar,
    ToolbarContent,
    Gallery,
    ToolbarItem,
    TextInput,
    PageSection,
    TextContent,
    Text,
    Button, Modal, FormGroup, ModalVariant, Switch, Form, FormSelect, FormSelectOption, FileUpload
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {IntegrationCard} from "./IntegrationCard";
import {MainToolbar} from "../MainToolbar";
import RefreshIcon from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';
import PlusIcon from '@patternfly/react-icons/dist/esm/icons/plus-icon';
import UploadIcon from '@patternfly/react-icons/dist/esm/icons/upload-icon';
import {Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelUi} from "../designer/utils/CamelUi";
import {UploadModal} from "./UploadModal";

interface Props {
    integrations: Map<string, string>
    openapis: Map<string, string>
    onSelect: (filename: string, type: 'integration' | 'openapi') => void
    onCreate: any
    onDelete: (name: string, type: 'integration' | 'openapi') => void
    onRefresh: any
}

interface State {
    repository: string,
    path: string,
    integrations: Map<string, string>,
    openapis: Map<string, string>,
    isCreateModalOpen: boolean,
    isUploadModalOpen: boolean,
    newName: string
    crd: boolean
    data: string
    filename: string
    isLoading: boolean
    isRejected: boolean
    generateRest: boolean
    generateRoutes: boolean
}

export class IntegrationPage extends React.Component<Props, State> {

    public state: State = {
        repository: '',
        path: '',
        integrations: this.props.integrations,
        openapis: this.props.openapis,
        isCreateModalOpen: false,
        isUploadModalOpen: false,
        newName: '',
        crd: true,
        data: '',
        filename: '',
        isLoading: false,
        isRejected: false,
        generateRest: true,
        generateRoutes: true
    };

    tools = () => (<Toolbar id="toolbar-group-types">
        <ToolbarContent>
            <ToolbarItem>
                <TextInput className="text-field" type="search" id="search" name="search"
                           autoComplete="off" placeholder="Search by name"/>
            </ToolbarItem>
            <ToolbarItem>
                <Button variant="secondary" icon={<RefreshIcon/>}
                        onClick={e => this.props.onRefresh.call(this)}>Refresh</Button>
            </ToolbarItem>
            <ToolbarItem>
                <Button variant="secondary" icon={<UploadIcon/>}
                        onClick={e => this.setState({isUploadModalOpen: true})}>Upload</Button>
            </ToolbarItem>
            <ToolbarItem>
                <Button icon={<PlusIcon/>} onClick={e => this.setState({isCreateModalOpen: true})}>Create</Button>
            </ToolbarItem>
        </ToolbarContent>
    </Toolbar>);

    title = () => (<TextContent>
        <Text component="h1">Integrations</Text>
    </TextContent>);

    closeModal = () => {
        this.setState({isCreateModalOpen: false, newName: "", isUploadModalOpen: false});
        this.props.onRefresh.call(this);
    }

    saveAndCloseCreateModal = () => {
        const name = CamelUi.nameFromTitle(this.state.newName) + ".yaml";
        const i = Integration.createNew(name);
        i.crd = this.state.crd;
        this.props.onCreate.call(this, i);
        this.setState({isCreateModalOpen: false, newName: ""});
    }

    onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
        if (event.key === 'Enter' && this.state.newName !== undefined) {
            this.saveAndCloseCreateModal();
        }
    }

    createModalForm() {
        return (
            <Modal
                title="Create new Integration"
                variant={ModalVariant.small}
                isOpen={this.state.isCreateModalOpen}
                onClose={this.closeModal}
                onKeyDown={this.onKeyDown}
                actions={[
                    <Button key="confirm" variant="primary" onClick={this.saveAndCloseCreateModal}>Save</Button>,
                    <Button key="cancel" variant="secondary" onClick={this.closeModal}>Cancel</Button>
                ]}
            >
                <Form isHorizontal={true}>
                    <FormGroup label="Title" fieldId="title" isRequired>
                        <TextInput className="text-field" type="text" id="title" name="title"
                                   value={this.state.newName}
                                   onChange={e => this.setState({newName: e})}/>
                    </FormGroup>
                    <FormGroup label="Type" fieldId="crd" isRequired>
                        <FormSelect value={this.state.crd}
                                    onChange={value => this.setState({crd: Boolean(JSON.parse(value))})}
                                    aria-label="FormSelect Input">
                            <FormSelectOption key="crd" value="true" label="Camel-K CRD"/>
                            <FormSelectOption key="plain" value="false" label="Plain YAML"/>
                        </FormSelect>
                    </FormGroup>
                </Form>
            </Modal>
        )
    }

    render() {
        return (
            <PageSection padding={{default: 'noPadding'}}>
                <MainToolbar title={this.title()} tools={this.tools()}/>
                <PageSection isFilled className="integration-page">
                    <Gallery hasGutter>
                        {Array.from(this.state.integrations.keys()).map(key => (
                            <IntegrationCard key={key}
                                             name={key}
                                             type={"integration"}
                                             status={this.state.integrations.get(key)}
                                             onDelete={this.props.onDelete}
                                             onClick={this.props.onSelect}/>
                        ))}
                        {Array.from(this.state.openapis.keys()).map(key => (
                            <IntegrationCard key={key}
                                             name={key}
                                             type={"openapi"}
                                             status={this.state.openapis.get(key)}
                                             onDelete={this.props.onDelete}
                                             onClick={this.props.onSelect}/>
                        ))}
                    </Gallery>
                </PageSection>
                {this.createModalForm()}
                <UploadModal isOpen={this.state.isUploadModalOpen} onClose={this.closeModal}/>
            </PageSection>
        );
    }
};