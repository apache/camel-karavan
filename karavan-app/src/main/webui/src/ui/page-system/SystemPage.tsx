import React, {useEffect, useState} from 'react';
import {Button, capitalize, Content, Tab, Tabs, TabTitleText, TextInputGroup, TextInputGroupMain, TextInputGroupUtilities, Tooltip} from '@patternfly/react-core';
import {SyncAltIcon, TimesIcon} from "@patternfly/react-icons";
import {SystemService} from "@services/SystemService";
import {shallow} from "zustand/shallow";
import {SystemMenu, SystemMenus, useSystemStore} from "@stores/SystemStore";
import {RightPanel} from "@shared/ui/RightPanel";
import {EnvVarsTable} from "./env-vars/EnvVarsTable";
import {AppPropsTable} from "./app-props/AppPropsTable";
import {ContainersTable} from "./containers/ContainersTable";
import {ContainerLogTab} from "@page-project/logs/ContainerLogTab";
import {useSelectedContainerStore} from "@stores/ProjectStore";
import {DeploymentStatusesTable} from "./deployments/DeploymentStatusesTable";
import {KaravanApi} from "@api/KaravanApi";
import {EventBus} from "@designer/utils/EventBus";
import {Clean} from "@carbon/icons-react";
import {useAppConfig} from "@compass/useConfig";
import './SystemPage.css'
import {useDataPolling} from "@shared/polling/useDataPolling";
import {ProjectService} from "@services/ProjectService";
import {useDeploymentStatusesStore} from "@stores/DeploymentStatusesStore";

export const SystemPage = () => {

    const [filter, setFilter, tabIndex, setTabIndex] = useSystemStore((s) => [s.filter, s.setFilter, s.tabIndex, s.setTabIndex], shallow);
    const [isNewSecretOpen, setIsNewSecretOpen] = useState<boolean>(false);
    const [isNewConfigMapOpen, setIsNewConfigMapOpen] = useState<boolean>(false);
    const [selectedContainerName, setSelectedContainerName] = useSelectedContainerStore((s) => [s.selectedContainerName, s.setSelectedContainerName]);

    const fetchDeployments = useDeploymentStatusesStore(s => s.fetchDeployments);
    const isContainerSelected = selectedContainerName !== undefined;
    const {isDev} = useAppConfig();

    useDataPolling('SystemPageRefresher', refresh, 7000);

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
        ProjectService.refreshAllContainerStatuses();
        ProjectService.refreshAllCamelContextStatuses();
        fetchDeployments();
    }

    function searchInput() {
        return (
            <TextInputGroup className="search" style={{width: '300px'}}>
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
            <div className="system-page-toolbar" style={{justifyContent: "flex-end"}}>
                <Button icon={<SyncAltIcon/>} variant='link' onClick={refresh}/>
                {searchInput()}
                {tabIndex === 'secrets' && isDev &&
                    <Button onClick={event => setIsNewSecretOpen(true)}>Add Secret</Button>
                }
                {tabIndex === 'configMaps' &&
                    <Button onClick={event => setIsNewConfigMapOpen(true)}>Add ConfigMap</Button>
                }
                {tabIndex === 'containers' && isDev &&
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
            <Tabs isNav
                  activeKey={tabIndex}
                  onSelect={(_, selectedItem) => {
                      const menuItem = selectedItem as SystemMenu;
                      setTabIndex(menuItem);
                      if (menuItem !== 'log') {
                          setSelectedContainerName(undefined);
                      }
                  }}
            >
                {menu.map((item, i) =>
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
                    <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                        {tabIndex !== 'log' && tools()}
                        {tabIndex === 'containers' && <ContainersTable/>}
                        {tabIndex === 'deployments' && <DeploymentStatusesTable/>}
                        {tabIndex === 'envVars' && <EnvVarsTable/>}
                        {tabIndex === 'appProps' && <AppPropsTable/>}
                        {tabIndex === 'log' && <ContainerLogTab/>}
                    </div>
                </div>
            }
        />
    )
}