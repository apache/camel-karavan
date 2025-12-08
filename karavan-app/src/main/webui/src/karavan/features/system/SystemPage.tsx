import React, {useEffect, useState} from 'react';
import {Button, capitalize, Content, Nav, NavItem, NavList, TextInputGroup, TextInputGroupMain, TextInputGroupUtilities} from '@patternfly/react-core';
import RefreshIcon from "@patternfly/react-icons/dist/esm/icons/sync-alt-icon";
import {SystemService} from "@services/SystemService";
import {shallow} from "zustand/shallow";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import {SystemMenu, SystemMenus, useSystemStore} from "@stores/SystemStore";
import {RightPanel} from "@shared/ui/RightPanel";
import {EnvVarsTable} from "@features/system/env-vars/EnvVarsTable";
import {AppPropsTable} from "@features/system/app-props/AppPropsTable";
import {SecretsTable} from "@features/system/secrets/SecretsTable";
import {SecretModal} from "@features/system/secrets/SecretModal";
import {ConfigMapsTable} from "@features/system/config-maps/ConfigMapsTable";
import {ConfigMapModal} from "@features/system/config-maps/ConfigMapModal";
import {ContainersTable} from "@features/system/containers/ContainersTable";
import {ContainerLogTab} from "@features/integration/ContainerLogTab";
import {useSelectedContainerStore} from "@stores/ProjectStore";
import {DeploymentStatusesTable} from "@features/system/deployments/DeploymentStatusesTable";

export const SystemPage = () => {

    const [filter, setFilter, tabIndex, setTabIndex] = useSystemStore((s) => [s.filter, s.setFilter, s.tabIndex, s.setTabIndex], shallow);
    const [isNewSecretOpen, setIsNewSecretOpen] = useState<boolean>(false);
    const [isNewConfigMapOpen, setIsNewConfigMapOpen] = useState<boolean>(false);
    const [selectedContainerName,setSelectedContainerName] = useSelectedContainerStore((s) => [s.selectedContainerName, s.setSelectedContainerName]);
    const isContainerSelected = selectedContainerName !== undefined;

    useEffect(() => {
        refresh();
        return () => setSelectedContainerName(undefined);
    }, []);

    function refresh() {
        SystemService.refresh();
    }

    function searchInput() {
        return (
            <TextInputGroup className="search">
                <TextInputGroupMain
                    value={filter}
                    placeholder='Search by name'
                    type="text"
                    autoComplete={"off"}
                    autoFocus={true}
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
        return (
            <div style={{ display: "flex", gap: "8px" }}>
                <Button icon={<RefreshIcon/>} variant='link' onClick={refresh}/>
                {searchInput()}
                {tabIndex === 'secrets' &&
                    <Button onClick={event => setIsNewSecretOpen(true)}>Add Secret</Button>
                }
                {tabIndex === 'configMaps' &&
                    <Button onClick={event => setIsNewConfigMapOpen(true)}>Add ConfigMap</Button>
                }
            </div>
        );
    }

    function title() {
        return (<Content component="h2">System</Content>);
    }

    function getNavigation() {
        const menu = isContainerSelected ? SystemMenus : SystemMenus.filter(m => m !== 'log');
        return (
            <Nav onSelect={(_, selectedItem) => {
                const menuItem = selectedItem.itemId as SystemMenu;
                setTabIndex(menuItem);
                if (menuItem !== 'log') {
                    setSelectedContainerName(undefined);
                }
            }}
                 aria-label="Nav" variant="horizontal">
                <NavList>
                    {menu.map((item, i) =>
                        <NavItem key={item} preventDefault itemId={item} isActive={tabIndex === item} to="#">
                            {capitalize(item)}
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
                    {tabIndex === 'containers' && <ContainersTable/>}
                    {tabIndex === 'deployments' && <DeploymentStatusesTable/>}
                    {tabIndex === 'secrets' && <SecretsTable/>}
                    <SecretModal isOpen={isNewSecretOpen} onCancel={() => setIsNewSecretOpen(false)} onAfterCreated={() => setIsNewSecretOpen(false)}/>
                    {tabIndex === 'configMaps' && <ConfigMapsTable/>}
                    <ConfigMapModal isOpen={isNewConfigMapOpen} onCancel={() => setIsNewConfigMapOpen(false)} onAfterCreated={() => setIsNewConfigMapOpen(false)}/>
                    {tabIndex === 'envVars' && <EnvVarsTable/>}
                    {tabIndex === 'appProps' && <AppPropsTable/>}
                    {tabIndex === 'log' && <ContainerLogTab/>}
                </div>
            }
        />
    )
}