import React from 'react';
import {
    Button,
    Flex,
    FlexItem, Form, FormGroup,
    InputGroup, Modal, ModalVariant,
    OptionsMenu,
    OptionsMenuItem,
    OptionsMenuPosition,
    OptionsMenuToggle,
    Text, TextInput,
    TextVariants,
    Tooltip,
    TooltipPosition
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {ProjectModel} from "karavan-core/lib/model/ProjectModel";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import AddIcon from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";

interface Props {
    project: ProjectModel
    onChange?: (profile: string) => void
    onDelete?: (profile: string) => void
}

interface State {
    isSelectorOpen?: boolean
    showDeleteConfirmation?: boolean
    showCreate?: boolean
    profile?: string
}

export class ProfileSelector extends React.Component<Props, State> {

    public state: State = {
        isSelectorOpen: false
    };

    onSelect(profile?: string){
        if (profile) this.props.onChange?.call(this, profile);
        this.setState({isSelectorOpen: false});
    }

    deleteProfile(){
        if (this.props.project.profile) this.props.onDelete?.call(this, this.props.project.profile);
        this.setState({showDeleteConfirmation: false});
    }

    saveAndCloseCreateModal = () => {
        if (this.state.profile && this.state.profile.length > 0) this.props.onChange?.call(this, this.state.profile);
        this.closeModal();
    }

    closeModal = () => {
        this.setState({showCreate: false, profile: undefined});
    }

    onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
        if (event.key === 'Enter' && this.state.profile !== undefined) {
            this.saveAndCloseCreateModal();
        }
    }

    createModalForm() {
        return (
            <Modal
                title="Create new profile"
                variant={ModalVariant.small}
                isOpen={this.state.showCreate}
                onClose={this.closeModal}
                onKeyDown={this.onKeyDown}
                actions={[
                    <Button key="confirm" variant="primary" onClick={this.saveAndCloseCreateModal}>Save</Button>,
                    <Button key="cancel" variant="secondary" onClick={this.closeModal}>Cancel</Button>
                ]}
            >
                <Form isHorizontal>
                    <FormGroup label="Profile" fieldId="profile" isRequired>
                        <TextInput className="text-field" type="text" id="profile" name="profile"
                                   value={this.state.profile}
                                   onChange={e => this.setState({profile: e})}/>
                    </FormGroup>
                </Form>
            </Modal>
        )
    }

    getDeleteConfirmation() {
        return (<Modal
            className="modal-delete"
            title="Confirmation"
            isOpen={this.state.showDeleteConfirmation}
            onClose={() => this.setState({showDeleteConfirmation: false})}
            actions={[
                <Button key="confirm" variant="primary" onClick={e => this.deleteProfile()}>Delete</Button>,
                <Button key="cancel" variant="link"
                        onClick={e => this.setState({showDeleteConfirmation: false})}>Cancel</Button>
            ]}
            onEscapePress={e => this.setState({showDeleteConfirmation: false})}>
            <div>Delete current profile</div>
        </Modal>)
    }

    render() {
        const profile = this.props.project.profile;
        const menuItems = this.props.project.profiles.map(p =>
            <OptionsMenuItem onSelect={event => this.onSelect(event?.currentTarget.id)}
                             isSelected={profile === p} id={p} key={p}>{p}</OptionsMenuItem>
        );
        return (
            <Flex>
                <FlexItem>
                    <Text component={TextVariants.h1}>Profile:</Text>
                </FlexItem>
                <FlexItem>
                    <InputGroup>
                        <Tooltip
                            aria-label="Add profile"
                            position={TooltipPosition.bottom}
                            content="Create new profile">
                            <Button variant={"plain"} icon={<AddIcon/>} onClick={event => this.setState({showCreate: true})}/>
                        </Tooltip>
                        <OptionsMenu
                            id="profile-selector"
                            menuItems={menuItems}
                            position={OptionsMenuPosition.right}
                            isOpen={this.state.isSelectorOpen}
                            toggle={<OptionsMenuToggle onToggle={open => this.setState({isSelectorOpen: open})} toggleTemplate={profile} />}/>
                        <Tooltip
                            aria-label="Delete profile"
                            position={TooltipPosition.bottomEnd}
                            content="Delete selected profile">
                            <Button variant={"plain"} icon={<DeleteIcon/>} onClick={event => this.setState({showDeleteConfirmation: true})}/>
                        </Tooltip>
                    </InputGroup>
                </FlexItem>
                {this.createModalForm()}
                {this.getDeleteConfirmation()}
            </Flex>
        )
    }
}