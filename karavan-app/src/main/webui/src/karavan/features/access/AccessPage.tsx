import React, {useEffect, useState} from 'react';
import {Button, capitalize, Content, Nav, NavItem, NavList, TextInputGroup, TextInputGroupMain, TextInputGroupUtilities,} from '@patternfly/react-core';
import {useAccessStore} from "../../stores/AccessStore";
import {shallow} from "zustand/shallow";
import {AccessService} from "@services/AccessService";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import RefreshIcon from "@patternfly/react-icons/dist/esm/icons/sync-alt-icon";
import {RightPanel} from "@shared/ui/RightPanel";
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import {UsersTable} from "@features/access/users/UsersTable";
import {ErrorBoundaryWrapper} from "@features/integration/designer/ErrorBoundaryWrapper";
import {RolesTable} from "@features/access/roles/RolesTable";
import {UserModal} from "./users/UserModal";
import {RoleModal} from "@features/access/roles/RoleModal";
import {UserProfileTab} from "@features/access/users/UserProfileTab";
import {getCurrentUser} from "@api/auth/AuthApi";
import {PLATFORM_ADMIN} from "@models/AccessModels";
import {PasswordModal} from "@features/access/users/PasswordModal";

export const AccessPage = () => {

    const adminMenus: (string | number)[] = ['profile', 'users', 'roles'];
    const userMenus: (string | number)[] = ['profile'];
    const [showUserModal, setShowUserModal, setFilter, filter, setCurrentUser, showRoleModal, setShowRoleModal, showPasswordModal] =
        useAccessStore((s) => [s.showUserModal, s.setShowUserModal, s.setFilter, s.filter, s.setCurrentUser, s.showRoleModal, s.setShowRoleModal, s.showPasswordModal], shallow);
    const [activeItem, setActiveItem] = useState<string | number>(userMenus.at(0)!);
    const onSelect = (_event: React.FormEvent<HTMLInputElement>, result: { itemId: number | string }) => {
        setActiveItem(result.itemId);
    };

    useEffect(() => AccessService.refreshAccess(), []);

    function searchInput() {
        return (
            <TextInputGroup className="search">
                <TextInputGroupMain
                    value={filter}
                    placeholder='Search'
                    type="text"
                    autoComplete={"off"}
                    autoFocus={true}
                    icon={<SearchIcon />}
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
        return (<div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <Button icon={<RefreshIcon/>}
                            variant={"link"}
                            onClick={e => AccessService.refreshAccess()}
                    />
                    {searchInput()}
                    <Button className="dev-action-button"
                            icon={<PlusIcon/>}
                            onClick={e => {
                                setCurrentUser(undefined)
                                if (activeItem === "users") {
                                    setShowUserModal(true)
                                } else {
                                    setShowRoleModal(true)
                                }
                            }}
                    >Add</Button>
            </div>);
    }

    function title() {
        return (
            <Content component="h2">Access Control</Content>
        );
    }

    function getNavigation() {
        return (
            <Nav onSelect={onSelect} aria-label="Nav" variant="horizontal">
                <NavList>
                    {(getCurrentUser()?.roles?.includes(PLATFORM_ADMIN) ? adminMenus : userMenus)
                        .filter(m => []).map((item, i) =>
                        <NavItem key={item} preventDefault itemId={item} isActive={activeItem === item} to="#">
                            {capitalize(item?.toString())}
                        </NavItem>
                    )}
                </NavList>
            </Nav>
        )
    }

    return (
        <RightPanel
            title={title()}
            toolsStart={getNavigation()}
            tools={tools()}
            mainPanel={
                <div className="right-panel-card">
                    <ErrorBoundaryWrapper key='info' onError={error => console.error(error)}>
                        {activeItem === 'users' && <UsersTable/>}
                        {activeItem === 'roles' && <RolesTable/>}
                        {activeItem === 'profile' && <UserProfileTab/>}
                        {showUserModal && <UserModal/>}
                        {showRoleModal && <RoleModal/>}
                        {showPasswordModal && <PasswordModal/>}
                    </ErrorBoundaryWrapper>
                </div>
            }
        />
    )
}