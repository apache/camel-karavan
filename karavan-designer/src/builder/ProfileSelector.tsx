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
    Button,
    Flex,
    FlexItem, Form, FormGroup, InputGroup, Modal, ModalVariant, Tab, Tabs, TextInput, ToggleGroup, ToggleGroupItem, Tooltip, TooltipPosition
} from '@patternfly/react-core';
import '../designer/karavan.css';
import AddIcon from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";

interface Props {
    profiles: string[]
    profile: string
    onChange?: (profile: string) => void
    onDelete?: (profile: string) => void
}

interface State {
    isSelectorOpen?: boolean
    showDeleteConfirmation?: boolean
    showCreate?: boolean
    newProfile?: string
}

export class ProfileSelector extends React.Component<Props, State> {

    public state: State = {
        isSelectorOpen: false,
    };

    onSelect(profile?: string){
        if (profile) this.props.onChange?.call(this, profile);
        this.setState({isSelectorOpen: false});
    }

    deleteProfile(){
        if (this.props.profile) this.props.onDelete?.call(this, this.props.profile);
        this.setState({showDeleteConfirmation: false});
    }

    saveAndCloseCreateModal = () => {
        if (this.state.newProfile && this.state.newProfile.length > 0) this.props.onChange?.call(this, this.state.newProfile);
        this.closeModal();
    }

    closeModal = () => {
        this.setState({showCreate: false, newProfile: undefined});
    }

    onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
        if (event.key === 'Enter' && this.state.newProfile !== undefined) {
            this.saveAndCloseCreateModal();
        }
    }

    createModalForm() {
        return (
            <Modal
                title="Create new profile"
                className='profile-modal'
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
                                   value={this.state.newProfile}
                                   onChange={e => this.setState({newProfile: e})}/>
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
            <div>Delete profile {this.props.profile}</div>
        </Modal>)
    }

    render() {
        const profile = this.props.profile;
        const tabs = this.props.profiles.map(p =>
            <ToggleGroupItem key={p} text={p} buttonId={p} isSelected={profile === p}
                             onChange={selected => selected ? this.onSelect(p) : {}}/>
        );
        return (
            <Flex>
                <FlexItem>
                    <p className="profile-caption">Profile:</p>
                </FlexItem>
                <FlexItem>
                    <InputGroup>
                        <Tooltip
                            aria-label="Add profile"
                            position={TooltipPosition.bottom}
                            content="Create new profile">
                            <Button variant={"plain"} icon={<AddIcon/>} onClick={event => this.setState({showCreate: true})}/>
                        </Tooltip>
                        <ToggleGroup aria-label="Select target">
                            {tabs}
                        </ToggleGroup>
                        {this.props.profiles.length > 1 &&  <Tooltip
                            aria-label="Delete profile"
                            position={TooltipPosition.bottomEnd}
                            content="Delete selected profile">
                            <Button variant={"plain"} icon={<DeleteIcon/>} onClick={event => this.setState({showDeleteConfirmation: true})}/>
                        </Tooltip>}
                    </InputGroup>
                </FlexItem>
                {this.createModalForm()}
                {this.getDeleteConfirmation()}
            </Flex>
        )
    }
}