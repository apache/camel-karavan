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

import {ContextMenuItem, ContextSubMenuItem, GraphElement} from '@patternfly/react-topology';
import * as React from "react";
import {PauseIcon, PlayIcon, StopIcon} from "@patternfly/react-icons";

const COLOR_INFO = 'var(--pf-t--global--text--color--link--default)';
const COLOR_DANGER = 'var(--pf-t--global--color--status--danger--default)';
const COLOR_WARNING = 'var(--pf-t--global--color--status--warning--default)';

export function getCustomMenu(element: GraphElement, groupNames: string[]) {
    const result: React.ReactElement<any, string | React.JSXElementConstructor<any>>[] | Promise<React.ReactElement<any, string | React.JSXElementConstructor<any>>[]> = []
    const data = element.getData();
    if (data?.type === 'route' && data.badge !== "TR") {
        if (data.state === 'Started') {
            result.push(
                <ContextMenuItem icon={<PauseIcon color={COLOR_WARNING}/>} key={"suspend"} onClick={e => data?.actions?.execRouteAction(data?.routeId, "suspend")}>
                    Suspend
                </ContextMenuItem>
            )
            result.push(
                <ContextMenuItem isDanger icon={<StopIcon color={COLOR_DANGER}/>} key={"stop"} onClick={e => data?.actions?.execRouteAction(data?.routeId, "stop")}>
                    Stop
                </ContextMenuItem>
            )
        } else if (data.state === 'Suspended') {
            result.push(
                <ContextMenuItem icon={<PlayIcon color={COLOR_INFO}/>} key={"resume"} onClick={e => data?.actions?.execRouteAction(data?.routeId, "resume")}>
                    Resume
                </ContextMenuItem>
            )
            result.push(
                <ContextMenuItem isDanger icon={<StopIcon color={COLOR_DANGER}/>} key={"stop"} onClick={e => data?.actions?.execRouteAction(data?.routeId, "stop")}>
                    Stop
                </ContextMenuItem>
            )
        } else if (data.state === 'Stopped') {
            result.push(
                <ContextMenuItem icon={<PlayIcon color={COLOR_INFO}/>} key={"start"} onClick={e => data?.actions?.execRouteAction(data?.routeId, "start")}>
                    Start
                </ContextMenuItem>
            )
        }
        result.push(
            <ContextMenuItem key={element.getId() + "-open"} onClick={() => data?.actions?.selectFile?.(data?.fileName)}>
                Open
            </ContextMenuItem>
        );
        result.push(
            <ContextMenuItem key={element.getId()}
                             onClick={() => data?.actions?.setDisabled?.(data?.fileName, data?.routeId, !(data?.autoStartup))}>
                {data?.autoStartup === false ? 'Enable' : 'Disable'}
            </ContextMenuItem>
        );
        result.push(
            <ContextMenuItem key={element.getId() + '-delete'} onClick={() => {
                data?.actions?.deleteRoute?.(data?.fileName, data?.step.id);
            }}>
                {'Delete'}
            </ContextMenuItem>
        );
        if (groupNames.length > 0) {
            result.push(
                <ContextSubMenuItem label='Groups' key={element.getId() + '-groups'} children={
                    groupNames.map(groupName => {
                        return (
                            <ContextMenuItem key={`${element.getId()}-groups-${groupName}`} isSelected={data.routeGroup === groupName} onClick={() => data?.actions?.setRouteGroup?.(data?.fileName, data?.routeId, groupName)}
                            >
                                {groupName}
                            </ContextMenuItem>
                        )
                    })
                }/>
            )
        }
    } else if (data?.type === 'step' && data?.outgoing) {
        result.push(
            <ContextMenuItem key={element.getId() + "-open"} onClick={() => data?.actions?.selectFile?.(data?.fileName)}>
                Open
            </ContextMenuItem>
        );
        result.push(
            <ContextMenuItem key={element.getId() + '-step'}
                             onClick={() => data?.actions?.setDisabled?.(data?.fileName, data?.step.id, !(data?.disabled))}>
                {data?.disabled ? 'Enable' : 'Disable'}
            </ContextMenuItem>
        );
    }
    return result;
}
