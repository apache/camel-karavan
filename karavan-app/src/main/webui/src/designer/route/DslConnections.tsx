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
import React, {ReactElement, useEffect, useState} from 'react';
import './DslConnections.css';
import {DslPosition, EventBus} from "../utils/EventBus";
import {CamelUi} from "../utils/CamelUi";
import {useConnectionsStore, useDesignerStore, useIntegrationStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {IncomingLink, TopologyUtils} from "karavan-core/lib/api/TopologyUtils";
import {CamelElement} from "karavan-core/lib/model/IntegrationDefinition";
import {v4 as uuidv4} from "uuid";
import {Button, Tooltip} from "@patternfly/react-core";
import {InfrastructureAPI} from "../utils/InfrastructureAPI";
import {getIntegrations} from "../../topology/TopologyApi";
import {ComponentApi, INTERNAL_COMPONENTS} from "karavan-core/lib/api/ComponentApi";

const overlapGap: number = 40;
const DIAMETER: number = 34;
const RADIUS: number = DIAMETER / 2;
type ConnectionType = 'internal' | 'remote' | 'nav' | 'poll' | 'dynamic';

export function DslConnections() {

    const [integration, files] = useIntegrationStore((s) => [s.integration, s.files], shallow)
    const [width, height, top, left] = useDesignerStore((s) =>
        [s.width, s.height, s.top, s.left], shallow)
    const [steps, addStep, deleteStep, clearSteps] =
        useConnectionsStore((s) => [s.steps, s.addStep, s.deleteStep, s.clearSteps], shallow)

    const [svgKey, setSvgKey] = useState<string>('svgKey');
    const [tons, setTons] = useState<Map<string, IncomingLink[]>>(new Map<string, IncomingLink[]>());

    useEffect(() => {
        const integrations = getIntegrations(files);
        const openApiFile = files.filter(f => f.name === 'openapi.json')?.at(0);
        const openApiJson = openApiFile?.code;
        const data = TopologyUtils.getIncomingLinkMap(integrations, openApiJson);
        setTons(data);
        const sub1 = EventBus.onPosition()?.subscribe((evt: DslPosition) => setPosition(evt));
        return () => {
            sub1?.unsubscribe();
        };
    }, [files]);

    useEffect(() => {
        const toDelete1: string[] = Array.from(steps.keys()).filter(k => CamelDefinitionApiExt.findElementInIntegration(integration, k) === undefined);
        toDelete1.forEach(key => deleteStep(key));
        setSvgKey(uuidv4())
    }, [integration]);

    function setPosition(evt: DslPosition) {
        if (evt.command === "add") {
            addStep(evt.step.uuid, evt);
        } else if (evt.command === "delete") {
            deleteStep(evt.step.uuid);
        } else if (evt.command === "clean") {
            clearSteps();
        }
    }

    function getElementType(element: CamelElement): ConnectionType {
        const uri = (element as any).uri;
        if (element.dslName === 'PollDefinition') {
            return 'poll';
        } else if (element.dslName === 'ToDynamicDefinition') {
            return 'dynamic';
        } else if (INTERNAL_COMPONENTS.includes((uri))) {
            return 'nav';
        } else {
            const component = ComponentApi.findByName(uri);
            return (component !== undefined && component.component.remote !== true) ? 'internal' : 'remote';
        }
    }

    function getIncomings(): [string, number, ConnectionType][] {
        let outs: [string, number, ConnectionType][] = Array.from(steps.values())
            .filter(pos => ["FromDefinition"].includes(pos.step.dslName))
            .filter(pos => !(pos.step.dslName === 'FromDefinition' && (pos.step as any).uri === 'kamelet:source'))
            .sort((pos1: DslPosition, pos2: DslPosition) => {
                const y1 = pos1.headerRect.y + pos1.headerRect.height / 2;
                const y2 = pos2.headerRect.y + pos2.headerRect.height / 2;
                return y1 > y2 ? 1 : -1
            })
            .map(pos => [pos.step.uuid, pos.headerRect.y, getElementType(pos.step)]);
        while (hasOverlap(outs)) {
            outs = addGap(outs);
        }
        return outs;
    }

    function getIncoming(data: [string, number, ConnectionType]) {
        const pos = steps.get(data[0]);
        if (pos) {
            const fromX = pos.headerRect.x + pos.headerRect.width / 2 - left;
            const fromY = pos.headerRect.y + pos.headerRect.height / 2 - top;
            const r = pos.headerRect.height / 2;

            const incomingX = 20;
            const lineX1 = incomingX + r;
            const lineY1 = fromY;
            const lineX2 = fromX - r * 2 + 7;
            const lineY2 = fromY;
            const isInternal = data[2] === 'internal';
            const isNav = data[2] === 'nav';
            return (!isInternal
                    ? <g key={pos.step.uuid + "-incoming"}>
                        <circle key={pos.step.uuid + "-circle"} cx={incomingX} cy={fromY} r={r} className="circle-incoming"/>
                        <path key={pos.step.uuid + "-path"} d={`M ${lineX1},${lineY1} C ${lineX1},${lineY2} ${lineX2},${lineY1}  ${lineX2},${lineY2}`}
                              className={isNav ? 'path-incoming-nav' : 'path-incoming'}
                              markerEnd="url(#arrowheadRight)"/>
                    </g>
                    : <div key={pos.step.uuid + "-incoming"} style={{display: 'none'}}></div>
            )
        }
    }

    // function getToDirectSteps(name: string) {
    //     return Array.from(steps.values())
    //         .filter(s => s.step.dslName === 'ToDefinition')
    //         .filter(s =>  NAV_COMPONENTS.includes((s.step as any)?.uri))
    //         .filter(s =>  (s.step as any)?.parameters?.name === name)
    // }

    function getIncomingIcons(data: [string, number, ConnectionType]) {
        const pos = steps.get(data[0]);
        if (pos) {
            const step = (pos.step as any);
            const uri = step?.uri;
            const internalCall: boolean = step && uri && step?.dslName === 'FromDefinition' && INTERNAL_COMPONENTS.includes(uri);
            const name: string = internalCall ? (step?.parameters?.name) : undefined;
            const links = internalCall ? tons.get(uri + ':' + name) || [] : [];
            const isInternal = data[2] === 'internal';
            const fromY = pos.headerRect.y + pos.headerRect.height / 2 - top;
            const r = pos.headerRect.height / 2;
            const incomingX = 20;
            const imageX = incomingX - r + 6;
            const imageY = fromY - r + 6;
            return (!isInternal
                    ? <div key={pos.step.uuid + "-icon"}
                           style={{display: "block", position: "absolute", top: imageY, left: imageX}}
                    >
                        {CamelUi.getConnectionIcon(pos.step)}
                        {links.map((link, index) =>
                            <Tooltip key={`${link.name}:${index}`}
                                     content={
                                         <div>
                                             {`Go to ${link.name}`}
                                         </div>
                                     }
                                     position={"right"}>
                                <Button style={{
                                    position: 'absolute',
                                    left: 27,
                                    top: (index * 16) + (12),
                                    whiteSpace: 'nowrap',
                                    zIndex: 300,
                                    padding: 0
                                }}
                                        variant={'link'}
                                        aria-label="Goto"
                                        onClick={_ => InfrastructureAPI.onInternalConsumerClick(uri, name, link.name, link.fileName)}>
                                    {link.name}
                                </Button>
                            </Tooltip>
                        )}
                    </div>
                    : <div key={pos.step.uuid + "-icon"} style={{display: 'none'}}></div>
            )
        }
    }

    function hasOverlap(data: [string, number, ConnectionType][]): boolean {
        let result = false;
        data.forEach((d, i, arr) => {
            if (i > 0 && d[1] - arr[i - 1][1] < overlapGap) result = true;
        })
        return result;
    }

    function addGap(data: [string, number, ConnectionType][]): [string, number, ConnectionType][] {
        const result: [string, number, ConnectionType][] = [];
        data.forEach((d, i, arr) => {
            if (i > 0 && d[1] - arr[i - 1][1] < overlapGap) result.push([d[0], d[1] + overlapGap, d[2]])
            else result.push(d);
        })
        return result;
    }


    function getOutgoings(): [string, number, ConnectionType][] {
        const outgoingDefinitions = TopologyUtils.getOutgoingDefinitions();
        let outs: [string, number, ConnectionType][] = Array.from(steps.values())
            .filter(pos => outgoingDefinitions.includes(pos.step.dslName))
            .filter(pos => pos.step.dslName !== 'KameletDefinition' || (pos.step.dslName === 'KameletDefinition' && !CamelUi.isActionKamelet(pos.step)))
            .filter(pos => ['ToDefinition', 'PollDefinition', "ToDynamicDefinition"].includes(pos.step.dslName) && !CamelUi.isActionKamelet(pos.step))
            .filter(pos => !CamelUi.isKameletSink(pos.step))
            .sort((pos1: DslPosition, pos2: DslPosition) => {
                const y1 = pos1.headerRect.y + pos1.headerRect.height / 2;
                const y2 = pos2.headerRect.y + pos2.headerRect.height / 2;
                return y1 > y2 ? 1 : -1
            })
            .map(pos => [pos.step.uuid, pos.headerRect.y - top, getElementType(pos.step)]);
        while (hasOverlap(outs)) {
            outs = addGap(outs);
        }
        return outs;
    }

    function getOutgoing(data: [string, number, ConnectionType]) {
        const pos = steps.get(data[0]);
        const isInternal = data[2] === 'internal';
        const isNav = data[2] === 'nav';
        const isPoll = data[2] === 'poll';
        const isDynamic = data[2] === 'dynamic';
        if (pos) {
            const fromX = pos.headerRect.x + pos.headerRect.width / 2 - left;
            const fromY = pos.headerRect.y + pos.headerRect.height / 2 - top;
            const r = pos.headerRect.height / 2;

            const outgoingX = width - 20;
            const outgoingY = data[1] + RADIUS;

            const lineX1 = fromX + r;
            const lineY1 = fromY;
            const lineX2 = outgoingX - r * 2 + (isPoll ? 14 : 6);
            const lineY2 = outgoingY;

            const lineXi = lineX1 + 40;
            const lineYi = lineY2;

            const className = isNav
                ? 'path-incoming-nav'
                : (isPoll ? 'path-poll' : (isDynamic ? 'path-dynamic' : 'path-incoming'))

            return (!isInternal
                    ? <g key={pos.step.uuid + "-outgoing"}>
                        <circle cx={outgoingX} cy={outgoingY} r={r} className="circle-outgoing"/>
                        <path
                            d={`M ${lineX1},${lineY1} C ${lineXi - 20}, ${lineY1} ${lineX1 - RADIUS},${lineYi} ${lineXi},${lineYi} L ${lineX2},${lineY2}`}
                            className={className} markerStart={isPoll ? "url(#arrowheadLeft)" : "none"} markerEnd={isPoll ? "none" : "url(#arrowheadRight)"}/>
                    </g>
                    : <div key={pos.step.uuid + "-outgoing"} style={{display: 'none'}}></div>
            )
        }
    }

    function getOutgoingIcons(data: [string, number, ConnectionType]) {
        const pos = steps.get(data[0]);
        if (pos) {
            const step = (pos.step as any);
            const uri = step?.uri;
            const isInternal = data[2] === 'internal';
            const isNav = data[2] === 'nav';
            const internalCall = step && uri && step?.dslName === 'ToDefinition' && isNav;
            const name = internalCall ? (step?.parameters?.name ? step?.parameters.name : step?.parameters?.address) : '';
            const r = pos.headerRect.height / 2;
            const outgoingX = width - 20;
            const outgoingY = data[1] + RADIUS;
            const imageX = outgoingX - r + 6;
            const imageY = outgoingY - r + 6;
            return (!isInternal
                    ? <div key={pos.step.uuid + "-icon"}
                           style={{display: "block", position: "absolute", top: imageY, left: imageX}}>
                        {CamelUi.getConnectionIcon(pos.step)}
                        {name !== undefined &&
                            <Tooltip content={`Go to ${uri}:${name}`} position={"left"}>
                                <Button style={{
                                    position: 'absolute',
                                    right: 27,
                                    top: -12,
                                    whiteSpace: 'nowrap',
                                    zIndex: 300,
                                    padding: 0
                                }}
                                        variant={'link'}
                                        aria-label="Goto"
                                        onClick={_ => InfrastructureAPI.onInternalConsumerClick(uri, name, undefined)}>
                                    {name}
                                </Button>
                            </Tooltip>
                        }
                    </div>
                    : <div key={pos.step.uuid + "-icon"} style={{display: 'none'}}></div>
            )
        }
    }

    function getCircle(pos: DslPosition) {
        const cx = pos.headerRect.x + pos.headerRect.width / 2 - left;
        const cy = pos.headerRect.y + pos.headerRect.height / 2 - top;
        const r = pos.headerRect.height / 2;
        return (
            <circle cx={cx} cy={cy} r={r} stroke="transparent" strokeWidth="3" fill="transparent"
                    key={pos.step.uuid + "-circle"}/>
        )
    }

    function getNext(pos: DslPosition): CamelElement | undefined {
        if (pos.nextstep) {
            return pos.nextstep;
        } else if (pos.parent) {
            const parent = steps.get(pos.parent.uuid);
            if (parent) return getNext(parent);
        }
    }

    function isSpecial(pos: DslPosition): boolean {
        return ['ChoiceDefinition', 'MulticastDefinition', 'LoadBalanceDefinition', 'TryDefinition', 'RouteConfigurationDefinition'].includes(pos.step.dslName);
    }

    function addArrowToList(list: ReactElement[], from?: DslPosition, to?: DslPosition, fromHeader?: boolean, toHeader?: boolean): ReactElement[] {
        const result: ReactElement[] = [...list];
        if (from && to) {
            const rect1 = fromHeader === true ? from.headerRect : from.rect;
            const rect2 = toHeader === true ? to.headerRect : to.rect;
            const key = from.step.uuid + "->" + to.step.uuid;
            result.push(getComplexArrow(key, rect1, rect2, toHeader === true));
        }
        return result;
    }

    function getParentDsl(uuid?: string): string | undefined {
        return uuid ? steps.get(uuid)?.parent?.dslName : undefined;
    }

    function getArrow(pos: DslPosition): ReactElement[] {
        const list: ReactElement[] = [];

        if (pos.parent && pos.parent.dslName === 'TryDefinition' && pos.position === 0) {
            const parent = steps.get(pos.parent.uuid);
            list.push(...addArrowToList(list, parent, pos, true, false))
        } else if (pos.parent && ['RouteConfigurationDefinition', 'MulticastDefinition', 'LoadBalanceDefinition'].includes(pos.parent.dslName)) {
            const parent = steps.get(pos.parent.uuid);
            list.push(...addArrowToList(list, parent, pos, true, false))
            if (parent?.nextstep) {
                const to = steps.get(parent.nextstep.uuid);
                list.push(...addArrowToList(list, pos, to, true, true))
            }
        } else if (pos.parent && pos.parent.dslName === 'ChoiceDefinition') {
            const parent = steps.get(pos.parent.uuid);
            list.push(...addArrowToList(list, parent, pos, true, false))
        } else if (pos.parent && ['WhenDefinition', 'OtherwiseDefinition', 'CatchDefinition', 'FinallyDefinition', 'TryDefinition'].includes(pos.parent.dslName)) {
            if (pos.position === 0) {
                const parent = steps.get(pos.parent.uuid);
                list.push(...addArrowToList(list, parent, pos, true, false))
            }
            if (pos.position === (pos.inStepsLength - 1) && !isSpecial(pos)) {
                const nextElement = getNext(pos);
                const parentDsl1 = getParentDsl(nextElement?.uuid);
                if (parentDsl1 && ['RouteConfigurationDefinition', 'MulticastDefinition', 'LoadBalanceDefinition'].includes(parentDsl1)) {
                    // do nothing
                } else if (nextElement) {
                    const next = steps.get(nextElement.uuid);
                    list.push(...addArrowToList(list, pos, next, true, true))
                }
            }
        } else if (pos.step && !isSpecial(pos)) {
            if (pos.nextstep) {
                const next = steps.get(pos.nextstep.uuid);
                const fromHeader = !pos.step.hasSteps();
                list.push(...addArrowToList(list, pos, next, fromHeader, true))
            }
            if (pos.step.hasSteps() && (pos.step as any).steps.length > 0) {
                const firstStep = (pos.step as any).steps[0];
                const next = steps.get(firstStep.uuid);
                list.push(...addArrowToList(list, pos, next, true, true))
            }
        }

        if (['WhenDefinition', 'OtherwiseDefinition'].includes(pos.step.dslName) && pos.step.hasSteps() && (pos.step as any).steps.length === 0) {
            const parentDsl = getParentDsl(pos?.nextstep?.uuid);
            if (parentDsl && ['RouteConfigurationDefinition', 'MulticastDefinition', 'LoadBalanceDefinition'].includes(parentDsl)) {
                // do nothing
            } else if (pos.nextstep) {
                const to = steps.get(pos.nextstep.uuid);
                list.push(...addArrowToList(list, pos, to, true, true))
            } else {
                const next = getNext(pos);
                const parentDsl1 = getParentDsl(next?.uuid);
                if (parentDsl1 && ['RouteConfigurationDefinition', 'MulticastDefinition', 'LoadBalanceDefinition'].includes(parentDsl1)) {
                    // do nothing
                } else if (next) {
                    const to = steps.get(next.uuid);
                    list.push(...addArrowToList(list, pos, to, true, true))
                }
            }
        }

        if (pos.parent?.dslName === 'TryDefinition' && pos.inSteps && pos.position === (pos.inStepsLength - 1)) {
            const parent = steps.get(pos.parent.uuid);
            if (parent && parent.nextstep) {
                const to = steps.get(parent.nextstep.uuid);
                list.push(...addArrowToList(list, pos, to, true, true))
            }
        }

        if (!isSpecial(pos) && pos.inSteps && pos.nextstep && (pos.parent?.dslName &&
            !['MulticastDefinition', 'LoadBalanceDefinition'].includes(pos.parent?.dslName))) {
            const next = steps.get(pos.nextstep.uuid);
            if (pos.step.hasSteps() && pos.prevStep) {
            } else {
                list.push(...addArrowToList(list, pos, next, true, true))
            }
        }

        if (!isSpecial(pos) && pos.inSteps && pos.nextstep && (pos.parent?.dslName &&
            !['MulticastDefinition', 'LoadBalanceDefinition'].includes(pos.parent?.dslName))) {
            const next = steps.get(pos.nextstep.uuid);
            if (next && !isSpecial(next) && next.inSteps) {
                // const to = steps.get(parent.nextstep.uuid);
                // list.push(...addArrowToList(list, pos, to, true, true))
            }
        }

        return list;
    }

    function getComplexArrow(key: string, rect1: DOMRect, rect2: DOMRect, toHeader: boolean) {
        const startX = rect1.x + rect1.width / 2 - left;
        const startY = rect1.y + rect1.height - top - 2;
        const endX = rect2.x + rect2.width / 2 - left;
        const endTempY = rect2.y - top - 9;

        const gapX = Math.abs(endX - startX);
        const gapY = Math.abs(endTempY - startY);

        const radX = gapX > DIAMETER ? 20 : gapX / 2;
        const radY = gapY > DIAMETER ? 20 : gapY / 2;
        const endY = rect2.y - top - radY - (toHeader ? 9 : 6);

        const iRadX = startX > endX ? -1 * radX : radX;
        const iRadY = startY > endY ? -1 * radY : radY;

        const LX1 = startX;
        const LY1 = endY - radY;

        const Q1_X1 = startX;
        const Q1_Y1 = LY1 + radY;
        const Q1_X2 = startX + iRadX;
        const Q1_Y2 = LY1 + radY;

        const LX2 = startX + (endX - startX) - iRadX;
        const LY2 = LY1 + radY;

        const Q2_X1 = LX2 + iRadX;
        const Q2_Y1 = endY;
        const Q2_X2 = LX2 + iRadX;
        const Q2_Y2 = endY + radY;

        const path = `M ${startX} ${startY}`
            + ` L ${LX1} ${LY1} `
            + ` Q ${Q1_X1} ${Q1_Y1} ${Q1_X2} ${Q1_Y2}`
            + ` L ${LX2} ${LY2}`
            + ` Q ${Q2_X1} ${Q2_Y1} ${Q2_X2} ${Q2_Y2}`
        return (
            <path key={uuidv4()} name={key} d={path} className="path" markerEnd="url(#arrowheadRight)"/>
        )
    }

    function getSvg() {
        const stepsArray = Array.from(steps.values());
        const arrows = stepsArray.map(pos => getArrow(pos)).flat(1);
        const uniqueArrows = [...new Map(arrows.map(item => [(item as any).key, item])).values()];

        return (
            <svg key={svgKey}
                 style={{width: width, height: height, position: "absolute", left: 0, top: 0}}
                 viewBox={"0 0 " + (width) + " " + (height)}>
                <defs key='defs'>
                    <marker key='maker1' id="arrowheadRight" markerWidth="9" markerHeight="6" refX="0" refY="3" orient="auto"
                            className="arrow">
                        <polygon points="0 0, 9 3, 0 6"/>
                    </marker>
                    <marker key='maker2' id="arrowheadLeft" markerWidth="9" markerHeight="6" refX="0" refY="3" orient="auto"
                            className="arrow">
                        <polygon points="9 0, 0 3, 9 6"/>
                    </marker>
                </defs>
                {stepsArray.map(pos => getCircle(pos))}
                {uniqueArrows}
                {getIncomings().map(p => getIncoming(p))}
                {getOutgoings().map(p => getOutgoing(p))}
            </svg>
        )
    }

    return (
        <div id="connections" className="connections" style={{width: width, height: height}}>
            {getSvg()}
            {getIncomings().map(p => getIncomingIcons(p))}
            {getOutgoings().map(p => getOutgoingIcons(p))}
        </div>
    )
}