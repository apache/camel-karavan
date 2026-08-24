import React, {useState} from 'react';
import {Button, capitalize, Label} from '@patternfly/react-core';
import {Tbody, Td, Tr} from "@patternfly/react-table";
import {SessionInfo} from "@models/AccessModels";
import {TimesIcon} from "@patternfly/react-icons";
import {ModalConfirmation} from "@shared/ui/ModalConfirmation";
import {AccessApi} from "@api/AccessApi";
import {useAccessStore} from "@stores/AccessStore";
import timeAgo from "@shared/timeAgo";

interface Props {
    index: number
    session: SessionInfo
}

export function SessionTableRow(props: Props) {

    const {refreshAccess} = useAccessStore();
    const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
    const [command, setCommand] = useState<'create' | 'delete' >();
    const {session, index} = props;
    const isExpired = session.expiredAt < new Date().getTime();


    function executeAction() {
        if (command === 'delete') {
            AccessApi.deleteSession(session.username).then(_ => refreshAccess());
        }
        setShowConfirmation(false);
    }

    function getConfirmationText() {
        if (command === 'delete') {
            return (
                <div style={{ display: 'flex', flexDirection: 'row', gap: '4px', alignItems: 'center' }}>
                    <Label color='red'>{capitalize('' + command)}</Label>
                    {" session for "}
                    {<Label color='blue'>{session.username}</Label>}
                    {" ?"}
                </div>
            )
        }
    }

    return (
        <Tbody>
            <Tr key={index} style={{verticalAlign: 'middle'}}>
                <Td>{session.username}</Td>
                <Td>
                    <div style={{display: 'flex', flexDirection: 'row', gap: 32, alignItems: 'center'}}>
                        {session.createdAt && new Date(session.createdAt).toISOString()}
                        <Label color={isExpired ? 'red' : 'blue'}>{timeAgo.format(new Date(session.createdAt))}</Label>
                    </div>
                </Td>
                <Td>
                    <div style={{display: 'flex', flexDirection: 'row', gap: 32, alignItems: 'center'}}>
                        {session.expiredAt && new Date(session.expiredAt).toISOString()}
                        <Label color={isExpired ? 'red' : 'blue'}>{timeAgo.format(new Date(session.expiredAt))}</Label>
                    </div>
                </Td>
                <Td isActionCell>
                    <Button className="dev-action-button"
                            variant={"plain"}
                            icon={<TimesIcon/>}
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