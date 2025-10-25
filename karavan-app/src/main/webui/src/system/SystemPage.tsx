import React, {useEffect, useState} from 'react';
import {Button, capitalize, Content, Nav, NavItem, NavList, TextInputGroup, TextInputGroupMain, TextInputGroupUtilities} from '@patternfly/react-core';
import RefreshIcon from "@patternfly/react-icons/dist/esm/icons/sync-alt-icon";
import {SystemService} from "./SystemService";
import {useAppConfigStore} from "@/api/ProjectStore";
import {shallow} from "zustand/shallow";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import {useSystemStore} from "./SystemStore";
import {RightPanel} from "@/components/RightPanel";
import {EnvVarsTable} from "@/diagnostics/EnvVarsTable";
import {AppPropsTable} from "@/diagnostics/AppPropsTable";
import {SecretsTable} from "@/system/SecretsTable";
import {SecretModal} from "@/system/SecretModal";
import {ConfigMapsTable} from "@/system/ConfigMapsTable";
import {ConfigMapModal} from "@/system/ConfigMapModal";
import {ContainersTable} from "@/system/ContainersTable";

export const SystemPage = () => {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [filter, setFilter] = useSystemStore((s) => [s.filter, s.setFilter], shallow);
    const [tab, setTab] = useState<string | number>("containers");
    const [isNewSecretOpen, setIsNewSecretOpen] = useState<boolean>(false);
    const [isNewConfigMapOpen, setIsNewConfigMapOpen] = useState<boolean>(false);

    function refresh() {
        SystemService.refresh();
    }

    useEffect(() => {
        refresh();
    }, []);

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
                {tab === 'secrets' &&
                    <Button onClick={event => setIsNewSecretOpen(true)}>Add Secret</Button>
                }
                {tab === 'configMaps' &&
                    <Button onClick={event => setIsNewConfigMapOpen(true)}>Add ConfigMap</Button>
                }
            </div>
        );
    }

    function title() {
        return (<Content component="h2">System</Content>);
    }

    function getNavigation() {
        return (
            <Nav onSelect={(_, selectedItem) => setTab(selectedItem.itemId)}
                 aria-label="Nav" variant="horizontal">
                <NavList>
                    {['containers', 'secrets', 'configMaps'].map((item, i) =>
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
            tools={tools()}
            mainPanel={
                <div className="right-panel-card">
                    {tab === 'containers' && <ContainersTable/>}
                    {tab === 'secrets' && <SecretsTable/>}
                    <SecretModal isOpen={isNewSecretOpen} onCancel={() => setIsNewSecretOpen(false)} onAfterCreated={() => setIsNewSecretOpen(false)}/>
                    {tab === 'configMaps' && <ConfigMapsTable/>}
                    <ConfigMapModal isOpen={isNewConfigMapOpen} onCancel={() => setIsNewConfigMapOpen(false)} onAfterCreated={() => setIsNewConfigMapOpen(false)}/>
                    {tab === 'envVars' && <EnvVarsTable/>}
                    {tab === 'appProps' && <AppPropsTable/>}
                </div>
            }
        />
    )
}