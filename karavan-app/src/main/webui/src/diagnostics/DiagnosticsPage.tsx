import React, {useEffect, useState} from 'react';
import {
    Button,
    capitalize,
    Content,
    Nav,
    NavItem,
    NavList,
    Switch,
    TextInputGroup,
    TextInputGroupMain,
    TextInputGroupUtilities,
    Tooltip,
    TooltipPosition
} from '@patternfly/react-core';
import {KaravanApi} from "@/api/KaravanApi";
import {EventBus} from "@/integration-designer/utils/EventBus";
import RefreshIcon from "@patternfly/react-icons/dist/esm/icons/sync-alt-icon";
import {CamelStatusesTable} from "./CamelStatusesTable";
import {ProjectService} from "@/api/ProjectService";
import {DiagnosticsApi} from "./DiagnosticsApi";
import {useAppConfigStore, useStatusesStore} from "@/api/ProjectStore";
import {shallow} from "zustand/shallow";
import {RightPanel} from "@/components/RightPanel";
import {ContainerStatusesTable} from "@/diagnostics/ContainerStatusesTable";
import {DeploymentStatusesTable} from "@/diagnostics/DeploymentStatusesTable";
import {useDiagnosticsStore} from "@/diagnostics/DiagnosticsStore";
import {EnvVarsTable} from "@/diagnostics/EnvVarsTable";
import {AppPropsTable} from "@/diagnostics/AppPropsTable";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";

export const DiagnosticsPage = () => {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [setEnvVars, setAppProps, filter, setFilter] = useDiagnosticsStore((state) => [state.setEnvVars, state.setAppProps, state.filter, state.setFilter], shallow)
    const isKubernetes = config.infrastructure === 'kubernetes'
    const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
    const [tab, setTab] = useState<string | number>("camel");
    const [setCamels] = useStatusesStore((state) => [state.setCamelContexts], shallow);

    function refresh() {
        ProjectService.refreshAllContainerStatuses();
        ProjectService.refreshAllDeploymentStatuses();
        DiagnosticsApi.getAllCamelStatuses(statuses => {
            setCamels(statuses);
        })
        DiagnosticsApi.getEnvVars((envVars: string[]) => {
            setEnvVars(envVars.sort((a, b) => a.localeCompare(b)));
        });
        DiagnosticsApi.getAppProps((appProps: string[]) => {
            setAppProps(appProps.sort((a, b) => a.localeCompare(b)));
        });
    }

    useEffect(() => {
        refresh()
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (autoRefresh) {
                refresh();
            }
        }, 2000)
        return () => clearInterval(interval);
    }, [autoRefresh]);

    function filterToolbar() {
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

    function statusesToolbar() {
        return (
            <div style={{display: "flex", flexDirection: "row", gap: "8px", alignItems: "center"}}>
                <Tooltip content={'Auto Refresh'} position={TooltipPosition.left}>
                    <Switch checked={autoRefresh} onChange={(_, e) => setAutoRefresh(e)}/>
                </Tooltip>
                <Button icon={<RefreshIcon/>} variant='link' onClick={refresh}/>
                <Button className="dev-action-button" onClick={event => {
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
                    Cleanup statuses
                </Button>
            </div>
        );
    }

    function title() {
        return (<Content component="h2">Diagnostic</Content>);
    }

    const showFilterToolbar = ['envVars', 'appProps'].includes(tab?.toString());

    function getNavigation() {
        const list = isKubernetes
            ? ['camel', 'containers', 'deployment', 'envVars', 'appProps']
            : ['camel', 'containers', 'envVars', 'appProps'];
        return (
            <Nav onSelect={(_, selectedItem) => setTab(selectedItem.itemId)}
                 aria-label="Nav" variant="horizontal">
                <NavList>
                    {list.map((item, i) =>
                        <NavItem key={item} preventDefault itemId={item} isActive={tab === item} to="#">
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
            tools={showFilterToolbar ? filterToolbar() : statusesToolbar()}
            mainPanel={
                <div className="right-panel-card">
                    {tab === 'camel' && <CamelStatusesTable/>}
                    {tab === 'containers' && <ContainerStatusesTable/>}
                    {tab === 'deployment' && <DeploymentStatusesTable/>}
                    {tab === 'envVars' && <EnvVarsTable/>}
                    {tab === 'appProps' && <AppPropsTable/>}
                </div>
            }
        />
    )
}