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
import {Button, Checkbox, Label, PageSection, Tooltip, TooltipPosition} from '@patternfly/react-core';
import '../../designer/karavan.css';
import CloseIcon from '@patternfly/react-icons/dist/esm/icons/times-icon';
import ExpandIcon from '@patternfly/react-icons/dist/esm/icons/expand-icon';
import CollapseIcon from '@patternfly/react-icons/dist/esm/icons/compress-icon';
import CleanIcon from '@patternfly/react-icons/dist/esm/icons/trash-alt-icon';
import {useLogStore, useStatusesStore} from "../../api/ProjectStore";
import {KaravanApi} from "../../api/KaravanApi";
import {shallow} from "zustand/shallow";
import {ProjectEventBus} from "../../api/ProjectEventBus";
import {ProjectLog} from "./ProjectLog";
import {LogWatchApi} from "../../api/LogWatchApi";

const INITIAL_LOG_HEIGHT = "50%";

export function ProjectLogPanel () {
    const [showLog, type, setShowLog, podName] = useLogStore(
        (state) => [state.showLog, state.type, state.setShowLog, state.podName], shallow)

    const [containers] = useStatusesStore((state) => [state.containers], shallow);
    const [height, setHeight] = useState(INITIAL_LOG_HEIGHT);
    const [isTextWrapped, setIsTextWrapped] = useState(true);
    const [autoScroll, setAutoScroll] = useState(true);
    const [fetch, setFetch] = useState<Promise<void> | undefined>(undefined);
    const [currentPodName, setCurrentPodName] = useState<string | undefined>(undefined);

    useEffect(() => {
        const controller = new AbortController();
        if (showLog && type !== 'none' && podName !== undefined) {
            const f = LogWatchApi.fetchData(type, podName, controller).then(value => {
                console.log("Fetch Started for: " + podName)
            });
            setFetch(f);
        }
        return () => {
            controller.abort();
        };
    }, [showLog, type, podName]);

    useEffect(() => {
        if (currentPodName !== podName) {
            ProjectEventBus.sendLog("set", "");
            setCurrentPodName(podName);
        }
    }, [podName]);

    function getButtons() {
        return (<div className="buttons">
            <Label className="log-name">{podName !== undefined ? (type + ": " + podName) : ''}</Label>
            <Tooltip content={"Clean log"} position={TooltipPosition.bottom}>
                <Button variant="plain" onClick={() => ProjectEventBus.sendLog('set', '')} icon={<CleanIcon/>}/>
            </Tooltip>
            <Checkbox label="Wrap text" aria-label="wrap text checkbox" isChecked={isTextWrapped}
                      id="wrap-text-checkbox"
                       onChange={(_, checked) => setIsTextWrapped(checked)}/>
            <Checkbox label="Autoscroll" aria-label="autoscroll checkbox" isChecked={autoScroll}
                      id="autoscroll-checkbox"
                       onChange={(_, checked) => setAutoScroll(checked)}/>
            {/*<Tooltip content={"Scroll to bottom"} position={TooltipPosition.bottom}>*/}
            {/*    <Button variant="plain" onClick={() => } icon={<ScrollIcon/>}/>*/}
            {/*</Tooltip>*/}
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
        </div>);
    }

    return (showLog ?
        <PageSection className="project-log" padding={{default: "noPadding"}} style={{height: height}}>
            <ProjectLog autoScroll={autoScroll} isTextWrapped={isTextWrapped} header={getButtons()}/>
        </PageSection>
        : <></>);
}
