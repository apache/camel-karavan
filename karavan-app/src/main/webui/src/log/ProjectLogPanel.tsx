import React, {useEffect, useState} from 'react';
import {
    Button,
    Checkbox,
    Label,
    PageSection, ToggleGroup, ToggleGroupItem,
    Tooltip,
    TooltipPosition
} from '@patternfly/react-core';
import './ProjectLog.css';
import CloseIcon from '@patternfly/react-icons/dist/esm/icons/times-icon';
import ExpandIcon from '@patternfly/react-icons/dist/esm/icons/expand-icon';
import CollapseIcon from '@patternfly/react-icons/dist/esm/icons/compress-icon';
import CleanIcon from '@patternfly/react-icons/dist/esm/icons/trash-alt-icon';
import {useAppConfigStore, useLogStore, useProjectStore, useStatusesStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {ProjectEventBus} from "../api/ProjectEventBus";
import {ProjectLog} from "./ProjectLog";
import {LogWatchApi} from "../api/LogWatchApi";
import {InformationLog} from "./InformationLog";
import {ProjectService} from "../api/ProjectService";

const INITIAL_LOG_HEIGHT = "50%";

export function ProjectLogPanel() {

    const [config] = useAppConfigStore((state) => [state.config], shallow);
    const [project] = useProjectStore((s) => [s.project], shallow);
    const [containers] = useStatusesStore((state) => [state.containers], shallow);
    const [showLog, type, setShowLog, podName] = useLogStore(
        (state) => [state.showLog, state.type, state.setShowLog, state.podName], shallow)

    const [height, setHeight] = useState(INITIAL_LOG_HEIGHT);
    const [isTextWrapped, setIsTextWrapped] = useState(true);
    const [autoScroll, setAutoScroll] = useState(true);
    const [currentPodName, setCurrentPodName] = useState<string | undefined>(undefined);
    const [tab, setTab] = useState<'log' | 'events' | 'main-configuration' | 'info'>('log');
    const [controller, setController] = React.useState(new AbortController());

    useEffect(() => {
        setTab('log');
        controller.abort()
        const c = new AbortController();
        setController(c);
        if (showLog && type !== 'none' && podName !== undefined) {
            const f = LogWatchApi.fetchData(type, podName, c).then(value => {
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

    useEffect(() => {
        const interval = setInterval(() => refreshData(), 1300)
        return () => clearInterval(interval);
    }, [tab]);

    function refreshData(){
        if (tab === 'info') {
            ProjectService.refreshCamelStatus(project.projectId, config.environment);
        }
    }

    function getButtons() {
        const isKubernetes = config.infrastructure === 'kubernetes';
        const title = isKubernetes ? ('Pod (' + type + "): " + podName) : (type + ": " + podName);
        const containerType = containers.filter(c => c.containerName === podName).at(0)?.type;
        const showMain= containerType !== undefined && ['devmode', 'project'].includes(containerType);
        return (
            <div className="buttons">
                <Label className="log-name">{podName !== undefined ? title : ''}</Label>
                <ToggleGroup isCompact style={{marginRight:'auto'}}>
                    <ToggleGroupItem key={0} isSelected={tab === 'log'} text='Log' onChange={_ => setTab('log')}/>
                    <ToggleGroupItem key={4} isSelected={tab === 'info'} text='Information' onChange={_ => setTab('info')}/>
                </ToggleGroup>
                <Tooltip content={"Clean log"} position={TooltipPosition.bottom}>
                    <Button variant="plain" onClick={() => ProjectEventBus.sendLog('set', '')} icon={<CleanIcon/>}/>
                </Tooltip>
                <Checkbox label="Wrap text" aria-label="wrap text checkbox" isChecked={isTextWrapped}
                          id="wrap-text-checkbox"
                          onChange={(_, checked) => setIsTextWrapped(checked)}/>
                <Checkbox label="Autoscroll" aria-label="autoscroll checkbox" isChecked={autoScroll}
                          id="autoscroll-checkbox"
                          onChange={(_, checked) => setAutoScroll(checked)}/>
                <Tooltip content={height === "100%" ? "Collapse" : "Expand"} position={TooltipPosition.bottom}>
                    <Button variant="plain" onClick={() => {
                        const h = height === "100%" ? INITIAL_LOG_HEIGHT : "100%";
                        setHeight(h);
                        ProjectEventBus.sendLog('add', ' ')
                    }} icon={height === "100%" ? <CollapseIcon/> : <ExpandIcon/>}/>
                </Tooltip>
                <Button variant="plain" onClick={() => {
                    setShowLog(false, 'none');
                    setHeight(INITIAL_LOG_HEIGHT);
                    ProjectEventBus.sendLog('set', '')
                }} icon={<CloseIcon/>}/>
            </div>
        );
    }

    return (showLog ?
        <PageSection className="project-log" padding={{default: "noPadding"}} style={{height: height}}>
            {tab === 'log' && <ProjectLog autoScroll={autoScroll} isTextWrapped={isTextWrapped} header={getButtons()}/>}
            {tab === 'info' && currentPodName && <InformationLog currentPodName={currentPodName} header={getButtons()}/>}
        </PageSection>
        : <></>);
}
