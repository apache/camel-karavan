import React from 'react';
import {Badge, Content, ContentVariants, DescriptionList, DescriptionListDescription, DescriptionListGroup, DescriptionListTerm, Flex, Popover,} from '@patternfly/react-core';
import UserIcon from "@patternfly/react-icons/dist/esm/icons/user-icon";
import {shallow} from "zustand/shallow";
import {useAccessStore} from "@stores/AccessStore";
import {getCurrentUser} from "@api/auth/AuthApi";

export function UserPopupOidc() {

    const [setShowUserModal, showUserModal] = useAccessStore((s) => [s.setShowUserModal, s.showUserModal], shallow);

    return (
        <Popover
            hasAutoWidth
            aria-label="Current user"
            position={"right-end"}
            hideOnOutsideClick={false}
            isVisible={showUserModal}
            shouldClose={(_event, tip) => setShowUserModal(false)}
            shouldOpen={(_event, tip) => setShowUserModal(true)}
            headerContent={
                <Content>
                    <Content component={ContentVariants.h3}>Profile</Content>
                </Content>
            }
            bodyContent={
                <DescriptionList isHorizontal className='description-align-center'>
                    <DescriptionListGroup>
                        <DescriptionListTerm>UserName:</DescriptionListTerm>
                        <DescriptionListDescription>{getCurrentUser()?.username}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                        <DescriptionListTerm>Roles:</DescriptionListTerm>
                        <DescriptionListDescription>
                            <Flex direction={{default: "column"}} gap={{default: "gapXs"}}>
                                {getCurrentUser()?.roles && Array.isArray(getCurrentUser()?.roles)
                                    && getCurrentUser()?.roles.map((role: string) => <Badge key={role} id={role}
                                                                                         isRead>{role}</Badge>)}
                            </Flex>
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                </DescriptionList>
            }
        >
            <div style={{alignSelf: 'center'}}>
                <UserIcon className="avatar"/>
            </div>
        </Popover>
)
}