import React, {useEffect, useState} from 'react';
import {Button, Checkbox, Label, PageSection, Tooltip, TooltipPosition} from '@patternfly/react-core';
import '../../designer/karavan.css';
import CloseIcon from '@patternfly/react-icons/dist/esm/icons/times-icon';
import ExpandIcon from '@patternfly/react-icons/dist/esm/icons/expand-icon';
import CollapseIcon from '@patternfly/react-icons/dist/esm/icons/compress-icon';
import CleanIcon from '@patternfly/react-icons/dist/esm/icons/trash-alt-icon';
import {useRunnerStore} from "../../api/ProjectStore";
import {KaravanApi} from "../../api/KaravanApi";
import {shallow} from "zustand/shallow";
import {ProjectEventBus} from "../../api/ProjectEventBus";
import {ProjectLog} from "./ProjectLog";

const INITIAL_LOG_HEIGHT = "50%";

export const ProjectLogPanel = () => {
    const [showLog, type, setShowLog, podName, status] = useRunnerStore(
        (state) => [state.showLog, state.type, state.setShowLog, state.podName, state.status], shallow)

    const [height, setHeight] = useState(INITIAL_LOG_HEIGHT);
    const [isTextWrapped, setIsTextWrapped] = useState(true);
    const [autoScroll, setAutoScroll] = useState(true);
    const [fetch, setFetch] = useState<Promise<void> | undefined>(undefined);

    useEffect(() => {
        console.log("ProjectLogPanel", showLog, type, podName, status);
        const controller = new AbortController();
        if (showLog && type !== 'none' && podName !== undefined) {
            const f = KaravanApi.fetchData(type, podName, controller).then(value => {
                console.log("Fetch Started for: " + podName)
            });
            console.log("new fetch")
            setFetch(f);
        }
        return () => {
            console.log("end");
            controller.abort();
        };
    }, [showLog, type, podName, status]);

    function getButtons() {
        return (<div className="buttons">
            <Label className="log-name">{podName!== undefined ? (type + ": " + podName + " " + status) : ''}</Label>
            <Tooltip content={"Clean log"} position={TooltipPosition.bottom}>
                <Button variant="plain" onClick={() => ProjectEventBus.sendLog('set', '')} icon={<CleanIcon/>}/>
            </Tooltip>
            <Checkbox label="Wrap text" aria-label="wrap text checkbox" isChecked={isTextWrapped} id="wrap-text-checkbox"
                      onChange={checked => setIsTextWrapped(checked)} />
            <Checkbox label="Autoscroll" aria-label="autoscroll checkbox" isChecked={autoScroll} id="autoscroll-checkbox"
                      onChange={checked => setAutoScroll(checked)} />
            {/*<Tooltip content={"Scroll to bottom"} position={TooltipPosition.bottom}>*/}
            {/*    <Button variant="plain" onClick={() => } icon={<ScrollIcon/>}/>*/}
            {/*</Tooltip>*/}
            <Tooltip content={height === "100%" ? "Collapse": "Expand"} position={TooltipPosition.bottom}>
                <Button variant="plain" onClick={() => {
                    const h = height === "100%" ? INITIAL_LOG_HEIGHT : "100%";
                    setHeight(h);
                    ProjectEventBus.sendLog('add', ' ')
                }} icon={height === "100%" ? <CollapseIcon/> : <ExpandIcon/>}/>
            </Tooltip>
            <Button variant="plain" onClick={() => {
                setShowLog(false);
                setHeight(INITIAL_LOG_HEIGHT);
                ProjectEventBus.sendLog('set', '')
            }} icon={<CloseIcon/>}/>
        </div>);
    }

    return (showLog ?
        <PageSection className="project-log" padding={{default: "noPadding"}} style={{height: height}}>
            <ProjectLog autoScroll={autoScroll} isTextWrapped={isTextWrapped} header={getButtons()}/>
        </PageSection>
        : <></>);
}
