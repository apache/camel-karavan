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
import React, {useEffect, useState} from 'react';
import {Button, capitalize, Content, Nav, NavItem, NavList, TextInputGroup, TextInputGroupMain, TextInputGroupUtilities, Tooltip} from '@patternfly/react-core';
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
import {ContainerLogTab} from "@features/project/ContainerLogTab";
import {useSelectedContainerStore} from "@stores/ProjectStore";
import {DeploymentStatusesTable} from "@features/system/deployments/DeploymentStatusesTable";
import {KaravanApi} from "@api/KaravanApi";
import {EventBus} from "@features/project/designer/utils/EventBus";
import {Clean} from "@carbon/icons-react";

export const SystemPage = () => {

    const [filter, setFilter, tabIndex, setTabIndex] = useSystemStore((s) => [s.filter, s.setFilter, s.tabIndex, s.setTabIndex], shallow);
    const [isNewSecretOpen, setIsNewSecretOpen] = useState<boolean>(false);
    const [isNewConfigMapOpen, setIsNewConfigMapOpen] = useState<boolean>(false);
    const [selectedContainerName, setSelectedContainerName] = useSelectedContainerStore((s) => [s.selectedContainerName, s.setSelectedContainerName]);
    const isContainerSelected = selectedContainerName !== undefined;

    useEffect(() => {
        refresh();
        return () => setSelectedContainerName(undefined);
    }, []);

    useEffect(() => {
        if (selectedContainerName !== undefined) {
            setTabIndex('log')
        }
    }, [selectedContainerName]);

    function refresh() {
        SystemService.refresh();
    }

    function searchInput() {
        return (
            <TextInputGroup className="search" style={{width:'300px'}}>
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
            <div className="project-files-toolbar" style={{justifyContent: "flex-end"}}>
                <Button icon={<RefreshIcon/>} variant='link' onClick={refresh}/>
                {searchInput()}
                {tabIndex === 'secrets' &&
                    <Button onClick={event => setIsNewSecretOpen(true)}>Add Secret</Button>
                }
                {tabIndex === 'configMaps' &&
                    <Button onClick={event => setIsNewConfigMapOpen(true)}>Add ConfigMap</Button>
                }
                {tabIndex === 'containers' &&
                    <Tooltip content="Cleanup statuses">
                        <Button className="dev-action-button"
                                icon={<Clean className="carbon"/>}
                                isDanger
                                variant='secondary'
                                onClick={event => {
                                    KaravanApi.deleteAllStatuses(res => {
                                        if (res.status === 200) {
                                            EventBus.sendAlert('Success', 'Statuses deleted', "info");
                                            KaravanApi.restartInformers(res1 => {
                                                if (res1.status === 200) {
                                                    EventBus.sendAlert('Success', 'Informers restarted', "info");
                                                }
                                            })
                                        }
                                    })
                                }}>
                        </Button>
                    </Tooltip>
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
            tools={undefined}
            mainPanel={
                <div className="right-panel-card">
                    <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                        {tabIndex !== 'log' && tools()}
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
                </div>
            }
        />
    )
}