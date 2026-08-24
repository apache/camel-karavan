import React, {useEffect, useState} from 'react';
import {Button, capitalize, Content, Tab, Tabs, TabTitleText, TextInputGroup, TextInputGroupMain, TextInputGroupUtilities,} from '@patternfly/react-core';
import {useAccessStore} from "@stores/AccessStore";
import {PlusIcon, SearchIcon, SyncAltIcon, TimesIcon} from "@patternfly/react-icons";
import {RightPanel} from "@shared/ui/RightPanel";
import {UsersTable} from "./users/UsersTable";
import {ErrorBoundaryWrapper} from "@designer/ErrorBoundaryWrapper";
import {RolesTable} from "./roles/RolesTable";
import {UserModal} from "./UserModal";
import {RoleModal} from "./roles/RoleModal";
import {UserProfileTab} from "./profile/UserProfileTab";
import {getCurrentUser} from "@api/auth/AuthApi";
import {PLATFORM_ADMIN} from "@models/AccessModels";
import {PasswordModal} from "./PasswordModal";
import {SessionTable} from "./sessions/SessionTable";
import {TabProps} from "@patternfly/react-core/src/components/Tabs/Tab";

export const AccessPage = () => {

    const adminMenus: (string | number)[] = ['profile', 'users', 'roles', 'sessions'];
    const userMenus: (string | number)[] = ['profile'];
    const {
        showUserModal, setShowUserModal, setFilter, filter, setCurrentUser, showRoleModal,
        setShowRoleModal, showPasswordModal, showTokenModal, setShowTokenModal, refreshAccess
    } = useAccessStore();
    const [activeItem, setActiveItem] = useState<string | number>(userMenus.at(0)!);

    const onNavSelect = (event: React.MouseEvent<HTMLElement, MouseEvent>, eventKey: TabProps['eventKey']) => {
        setActiveItem(eventKey);
    };

    useEffect(() => {
        refreshAccess();
    }, []);

    function searchInput() {
        return (
            <TextInputGroup className="search" style={{width: '300px'}}>
                <TextInputGroupMain
                    value={filter}
                    placeholder='Search'
                    type="text"
                    autoComplete={"off"}
                    autoFocus={true}
                    icon={<SearchIcon/>}
                    onChange={(_event, value) => {
                        setFilter(value);
                    }}
                    aria-label="text input example"
                />
                <TextInputGroupUtilities>
                    <Button variant="plain" onClick={_ => {
                        setFilter('');
                    }}>
                        <TimesIcon aria-hidden={true}/>
                    </Button>
                </TextInputGroupUtilities>
            </TextInputGroup>
        )
    }

    function tools() {
        const showAddButton = ["users", "roles", "tokens"].includes(activeItem?.toString())
        return (<div className="project-files-toolbar" style={{justifyContent: "flex-end"}}>
            <Button icon={<SyncAltIcon/>}
                    variant={"link"}
                    onClick={e => refreshAccess()}
            />
            {searchInput()}
            {showAddButton &&
                <Button className="dev-action-button"
                        icon={<PlusIcon/>}
                        onClick={e => {
                            setCurrentUser(undefined)
                            if (activeItem === "users") {
                                setShowUserModal(true)
                            } else if (activeItem === "roles") {
                                setShowRoleModal(true)
                            } else if (activeItem === "tokens") {
                                setShowTokenModal(true)
                            }
                        }}
                >Add</Button>
            }
        </div>);
    }

    function title() {
        return (
            <Content component="h2">Access Control</Content>
        );
    }

    function getNavigation() {
        return (
            <Tabs onSelect={onNavSelect} isNav activeKey={activeItem}>
                {(getCurrentUser()?.roles?.includes(PLATFORM_ADMIN) ? adminMenus : userMenus)
                    .filter(m => []).map((item, i) =>
                        <Tab
                            key={item}
                            eventKey={item}
                            title={<TabTitleText>{capitalize(item?.toString())}</TabTitleText>}
                        />
                    )}
            </Tabs>
        )
    }

    return (
        <RightPanel
            title={title()}
            toolsStart={getNavigation()}
            tools={undefined}
            mainPanel={
                <div className="right-panel-card">
                    <ErrorBoundaryWrapper key='info' onError={error => console.error(error)}>
                        <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                            {activeItem !== 'profile' && tools()}
                            {activeItem === 'profile' && <UserProfileTab/>}
                            {activeItem === 'users' && <UsersTable/>}
                            {activeItem === 'roles' && <RolesTable/>}
                            {activeItem === 'sessions' && <SessionTable/>}
                            {showUserModal && <UserModal/>}
                            {showRoleModal && <RoleModal/>}
                            {showPasswordModal && <PasswordModal/>}
                        </div>
                    </ErrorBoundaryWrapper>
                </div>
            }
        />
    )
}