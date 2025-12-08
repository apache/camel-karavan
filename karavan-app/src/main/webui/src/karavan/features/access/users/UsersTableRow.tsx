import React, {useState} from 'react';
import {Button, capitalize, Label, Switch} from '@patternfly/react-core';
import {Tbody, Td, Tr} from "@patternfly/react-table";
import {AccessUser} from "../../../models/AccessModels";
import {useAccessStore} from "../../../stores/AccessStore";
import {shallow} from "zustand/shallow";
import {AccessApi} from "../../../api/AccessApi";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import {AccessService} from "@services/AccessService";
import {ModalConfirmation} from "@shared/ui/ModalConfirmation";
import {PauseIcon, PlayIcon, UserSecretIcon} from "@patternfly/react-icons";

interface Props {
    index: number
    user: AccessUser
}

export function UsersTableRow(props: Props) {

    const [setShowUserModal, setCurrentUser, roles, setShowPasswordModal] = useAccessStore((s) => [s.setShowUserModal, s.setCurrentUser, s.roles, s.setShowPasswordModal], shallow);
    const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
    const [command, setCommand] = useState<'activate' | 'inactivate' | 'delete' | 'add' | 'remove'>();
    const [role, setRole] = useState<string>();

    const user = props.user;

    function executeAction() {
        if (command === 'delete') {
            AccessApi.deleteUser(user.username, result => {
                AccessService.refreshAccess();
            });
        } else if (command && ['activate', 'inactivate'].includes(command)) {
            var status = command === 'inactivate' ? 'INACTIVE' : 'ACTIVE';
            AccessApi.setUserStatus(user, status, result => {
                AccessService.refreshAccess();
            });
        } else if (command && ['add', 'remove'].includes(command)) {
            AccessApi.setUserRole(user, role, command, result => {
                AccessService.refreshAccess();
            });
        }

        setShowConfirmation(false);
    }

    function getConfirmationText() {
        if (command === 'delete') {
            return (
                <div style={{ display: 'flex', flexDirection: 'row', gap: '4px', alignItems: 'center' }}>
                    <Label color='red'>{capitalize('' + command)}</Label>
                    {" user "}
                    {<Label color='blue'>{user.username}</Label>}
                    {" ?"}
                </div>
            )
        } else if (command === 'inactivate') {
            return (
                <div style={{ display: 'flex', flexDirection: 'row', gap: '4px', alignItems: 'center' }}>
                    <Label color='red'>{capitalize('' + command)}</Label>
                    {" user "}
                    {<Label color='blue'>{user.username}</Label>}
                    {" ?"}
                </div>
            )
        } else if (command === 'activate') {
            return (
                <div style={{ display: 'flex', flexDirection: 'row', gap: '4px', alignItems: 'center' }}>
                    <Label color='green'>{capitalize('' + command)}</Label>
                    {" user "}
                    {<Label color='blue'>{user.username}</Label>}
                    {" ?"}
                </div>
            )
        } else if (command === 'remove') {
            return (
                <div style={{ display: 'flex', flexDirection: 'row', gap: '4px', alignItems: 'center' }}>
                    <Label color='red'>{capitalize('' + command)}</Label>
                    {" user "}
                    {<Label color='blue'>{user.username}</Label>}
                    {" from role "}
                    {<Label color='blue'>{role}</Label>}
                    {" ?"}
                </div>
            )
        } else if (command === 'add') {
            return (
                <div style={{ display: 'flex', flexDirection: 'row', gap: '4px', alignItems: 'center' }}>
                    <Label color='green'>{capitalize('' + command)}</Label>
                    {" user "}
                    {<Label color='blue'>{user.username}</Label>}
                    {" to role "}
                    {<Label color='blue'>{role}</Label>}
                    {" ?"}
                </div>
            )
        }
    }

    const deactivatable = !['admin', 'platform'].includes(user?.username) && user.status !== 'DELETED';
    const notDeletable = ['admin', 'platform'].includes(user?.username) || user.status === 'DELETED';
    const notEditable = ['admin', 'platform'].includes(user?.username) || user.status !== 'ACTIVE'
    return (
        <Tbody>
            <Tr key={user.username} style={{verticalAlign: 'middle'}}>
                <Td>
                    <Button variant='link' style={{padding: '6px'}} onClick={() => {
                        setCurrentUser(user)
                        setShowUserModal(true)
                    }}>
                        {user.username}
                    </Button>
                </Td>
                <Td>{user.firstName}</Td>
                <Td>{user.lastName}</Td>
                <Td>{user.email}</Td>
                <Td modifier='fitContent'>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        {roles.map(role => {
                            const isChecked = user.roles.includes(role.name)
                            return (
                                <Switch
                                    key={`${user.username}-${role.name}`}
                                    id={`${user.username}-${role.name}`}
                                    label={role.name}
                                    className='switch-role'
                                    isChecked={isChecked}
                                    ouiaId={'admin'}
                                    isDisabled={notEditable}
                                    onClick={(_) => {
                                        setRole(role.name);
                                        setCommand(isChecked ? 'remove' : 'add')
                                        setShowConfirmation(true);
                                    }}
                                />
                            )
                        })}
                    </div>
                </Td>
                <Td modifier='fitContent'>
                    <Label color={user.status === 'ACTIVE' ? 'green' : (user.status === 'DELETED' ? "red" : 'grey')}>{user.status}</Label>
                </Td>
                <Td isActionCell>
                    <div style={{display: 'flex', flexDirection: 'row', gap: '4px', justifyContent: 'flex-end'}}>
                        {deactivatable && <Button className="dev-action-button"
                                 variant={"link"}
                                 icon={user.status === 'INACTIVE' ? <PlayIcon/> : <PauseIcon/>}
                                 style={{padding: '6px', marginLeft: '6px'}}
                                 onClick={() => {
                                     setCommand(user.status === 'INACTIVE' ? 'activate' : 'inactivate')
                                     setShowConfirmation(true);
                                 }}/>}
                        <Button className="dev-action-button"
                                isDisabled={notDeletable}
                                variant={"plain"}
                                icon={<DeleteIcon/>}
                                style={{padding: '6px', marginLeft: '6px'}}
                                onClick={() => {
                                    setCommand('delete')
                                    setShowConfirmation(true);
                                }}/>
                        <Button className="dev-action-button"
                                isDisabled={notDeletable}
                                variant={"plain"}
                                icon={<UserSecretIcon color={notDeletable ? 'var(--pf-t--global--icon--color--disabled)' : 'var(--pf-t--global--icon--color--status--danger--default)'}/>}
                                style={{padding: '6px', marginLeft: '6px'}}
                                onClick={() => {
                                    setCurrentUser(user)
                                    setShowPasswordModal(true);
                                }}/>
                    </div>
                </Td>
            </Tr>
            {showConfirmation &&
                <ModalConfirmation
                    isOpen={showConfirmation}
                    message={getConfirmationText()}
                    btnConfirm='Confirm'
                    btnConfirmVariant='danger'
                    onConfirm={() => {
                        setCommand(undefined);
                        setRole(undefined);
                        setShowConfirmation(false);
                        executeAction();
                    }}
                    onCancel={() => setShowConfirmation(false)}
                />
            }
        </Tbody>
    )
}