import React, {useEffect, useState} from 'react';
import {Button, capitalize, Checkbox, Content, Nav, NavItem, NavList, Tooltip, TooltipPosition} from '@patternfly/react-core';
import './ProjectLog.css';
import {CompressIcon, ExpandIcon, TimesIcon, TrashAltIcon} from '@patternfly/react-icons';
import {useAppConfigStore, useLogStore, useStatusesStore} from "@/api/ProjectStore";
import {shallow} from "zustand/shallow";
import {ProjectEventBus} from "@/api/ProjectEventBus";
import {ProjectLogTab} from "./ProjectLogTab";
import {LogWatchApi} from "@/api/LogWatchApi";
import {PodEventsLogTab} from "./PodEventsLogTab";
import {MainConfigLogTab} from "./MainConfigLogTab";
import {InformationTab} from "./InformationTab";
import {LogViewerSearch} from '@patternfly/react-log-viewer';
import {ThreadsTab} from "@/runtime/ThreadsTab";
import {RoutesTab} from "@/runtime/RoutesTab";

const INITIAL_LOG_HEIGHT = "50%";

export function RuntimePanel() {

    const [config] = useAppConfigStore((state) => [state.config], shallow);
    const [containers] = useStatusesStore((state) => [state.containers], shallow);
    const [showLog, type, setShowLog, podName] = useLogStore(
        (state) => [state.showLog, state.type, state.setShowLog, state.podName], shallow)

    const [height, setHeight] = useState(INITIAL_LOG_HEIGHT);
    const [isTextWrapped, setIsTextWrapped] = useState(true);
    const [autoScroll, setAutoScroll] = useState(true);
    const [currentPodName, setCurrentPodName] = useState<string | undefined>(undefined);
    const [tab, setTab] = useState<'log' | 'events' | 'main-configuration' | 'info' | 'threads' | 'routes'>('log');
    const [controller, setController] = React.useState(new AbortController());

    useEffect(() => {
        setTab('log');
        controller.abort()
        const c = new AbortController();
        setController(c);
        if (showLog && type !== 'none' && podName !== undefined) {
            const f = LogWatchApi.fetchData(type, podName, c).then(_ => {
                console.log("Fetch Started for: " + podName);
            });
        }
        return () => {
            c.abort();
        };
    }, [showLog, type, podName]);

    useEffect(() => {
        if (currentPodName !== podName) {
            ProjectEventBus.sendLog("set", "");
            setCurrentPodName(podName);
        }
    }, [podName]);

    function getNavigation() {
        const isKubernetes = config.infrastructure === 'kubernetes';
        const containerType = containers.filter(c => c.containerName === podName).at(0)?.type;
        const showMain = containerType !== undefined && ['devmode', 'packaged'].includes(containerType);
        return (
            <Nav onSelect={(_, sel) => setTab(sel.itemId as 'log' | 'events' | 'main-configuration' | 'info')}
                 variant="horizontal" aria-label="Horizontal nav local" style={{flexGrow: 2}}>
                <NavList>
                    <NavItem preventDefault key={'info'} itemId={'info'} isActive={tab === 'info'} to={`#`}>Information</NavItem>
                    <NavItem preventDefault key={'log'} itemId={'log'} isActive={tab === 'log'} to={`#`}>Log</NavItem>
                    <NavItem preventDefault key={'routes'} itemId={'routes'} isActive={tab === 'routes'} to={`#`}>Routes</NavItem>
                    {showMain && <NavItem preventDefault key={'main-configuration'} itemId={'main-configuration'} isActive={tab === 'main-configuration'} to={`#`}>Main Configuration</NavItem>}
                    {showMain && <NavItem preventDefault key={'threads'} itemId={'threads'} isActive={tab === 'threads'} to={`#`}>Threads</NavItem>}
                    {isKubernetes && <NavItem preventDefault key={'events'} itemId={'events'} isActive={tab === 'events'} to={`#`}>Events</NavItem>}
                </NavList>
            </Nav>
        );
    }

    function getButtons() {
        const isKubernetes = config.infrastructure === 'kubernetes';
        const title = isKubernetes ? ('Pod (' + type + ") runtime ") : (capitalize(type) + " Runtime");
        return (
            <div className="buttons">
                <Content component='h6'>{podName !== undefined ? title : ''}</Content>
                {getNavigation()}
                {tab === 'log' &&
                    <div style={{display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '12px'}}>
                        <LogViewerSearch placeholder={'search'} minSearchChars={4}/>
                        <Tooltip content={"Clean log"} position={TooltipPosition.bottom}>
                            <Button variant="plain" onClick={() => ProjectEventBus.sendLog('set', '')} icon={<TrashAltIcon/>}/>
                        </Tooltip>
                        <Checkbox label="Wrap text" aria-label="wrap text checkbox" isChecked={isTextWrapped}
                                  id="wrap-text-checkbox"
                                  onChange={(_, checked) => setIsTextWrapped(checked)}/>
                        <Checkbox label="Autoscroll" aria-label="autoscroll checkbox" isChecked={autoScroll}
                                  id="autoscroll-checkbox"
                                  onChange={(_, checked) => setAutoScroll(checked)}/>

                    </div>
                }
                <Tooltip content={height === "100%" ? "Collapse" : "Expand"} position={TooltipPosition.bottom}>
                    <Button variant="plain" onClick={() => {
                        const h = height === "100%" ? INITIAL_LOG_HEIGHT : "100%";
                        setHeight(h);
                        ProjectEventBus.sendLog('add', ' ')
                    }} icon={height === "100%" ? <CompressIcon/> : <ExpandIcon/>}/>
                </Tooltip>
                <Button variant="plain" onClick={() => {
                    setShowLog(false, 'none');
                    setHeight(INITIAL_LOG_HEIGHT);
                    ProjectEventBus.sendLog('set', '')
                }} icon={<TimesIcon/>}/>
            </div>
        );
    }

    return (showLog ?
        <div className="project-log" style={{height: height}}>
            {tab === 'info' && currentPodName && <InformationTab currentPodName={currentPodName} header={getButtons()}/>}
            {tab === 'log' && <ProjectLogTab autoScroll={autoScroll} isTextWrapped={isTextWrapped} header={getButtons()}/>}
            {tab === 'events' && currentPodName && <PodEventsLogTab currentPodName={currentPodName} header={getButtons()}/>}
            {tab === 'main-configuration' && currentPodName && <MainConfigLogTab currentPodName={currentPodName} header={getButtons()}/>}
            {tab === 'threads' && currentPodName && <ThreadsTab currentPodName={currentPodName} header={getButtons()}/>}
            {tab === 'routes' && currentPodName && <RoutesTab currentPodName={currentPodName} header={getButtons()}/>}
        </div>
        : <></>);
}
