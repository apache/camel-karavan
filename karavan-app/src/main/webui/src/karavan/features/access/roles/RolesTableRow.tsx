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
import React, {useState} from 'react';
import {Button, capitalize, Content, Label} from '@patternfly/react-core';
import {Tbody, Td, Tr} from "@patternfly/react-table";
import {AccessRole, PLATFORM_ADMIN, PLATFORM_DEVELOPER, PLATFORM_USER} from "../../../models/AccessModels";
import {useAccessStore} from "../../../stores/AccessStore";
import {shallow} from "zustand/shallow";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import {ShieldAltIcon, UsersIcon} from "@patternfly/react-icons";
import {ModalConfirmation} from "@shared/ui/ModalConfirmation";
import {AccessApi} from "@api/AccessApi";
import {AccessService} from "@services/AccessService";

interface Props {
    index: number
    role: AccessRole
}

export function RolesTableRow(props: Props) {

    const [users] = useAccessStore((s) => [s.users], shallow);
    const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
    const [command, setCommand] = useState<'create' | 'delete' >();

    const {role} = props;

    function executeAction() {
        if (command === 'delete') {
            AccessApi.deleteRole(role.name, result => {
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
                    {" role "}
                    {<Label color='blue'>{role.name}</Label>}
                    {" ?"}
                </div>
            )
        }
    }

    const usersWithRole = users.filter(user => user.roles?.includes(role.name))
    const isBuildInRole = [PLATFORM_DEVELOPER, PLATFORM_USER, PLATFORM_ADMIN].includes(role?.name);
    const canBeDeleted = !isBuildInRole && usersWithRole.length === 0;
    return (
        <Tbody>
            <Tr key={role.name} style={{verticalAlign: 'middle'}}>
                <Td>{isBuildInRole ? <ShieldAltIcon/> : <UsersIcon/>}</Td>
                <Td>{role.name}</Td>
                <Td>{role.description}</Td>
                <Td modifier='fitContent'>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        {usersWithRole.map(user => {
                            return (
                                <Content key={user.username}>{user.username}</Content>
                            )
                        })}
                    </div>
                </Td>

                <Td isActionCell>
                    <Button className="dev-action-button"
                            isDisabled={!canBeDeleted}
                            variant={"plain"}
                            icon={<DeleteIcon/>}
                            style={{padding: '6px', marginLeft: '6px'}}
                            onClick={() => {
                                setCommand('delete')
                                setShowConfirmation(true);
                            }}/>
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
                        setShowConfirmation(false);
                        executeAction();
                    }}
                    onCancel={() => setShowConfirmation(false)}
                />
            }
        </Tbody>
    )
}