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
import React, {useEffect} from 'react';
import '../karavan.css';
import {CamelElement} from "karavan-core/lib/model/IntegrationDefinition";
import {ButtonPosition, DslPosition, EventBus} from "../utils/EventBus";
import {CamelUi} from "../utils/CamelUi";
import {useConnectionsStore, useDesignerStore, useIntegrationStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {TopologyUtils} from "karavan-core/lib/api/TopologyUtils";

const overlapGap: number = 40;

export function DslConnections() {

    const [integration] = useIntegrationStore((state) => [state.integration], shallow)
    const [width, height, top, left, hideLogDSL] = useDesignerStore((s) =>
        [s.width, s.height, s.top, s.left, s.hideLogDSL], shallow)
    const [steps, addStep, deleteStep, clearSteps, buttons, addButton, clearButtons, deleteButton] =
        useConnectionsStore((s) => [s.steps, s.addStep, s.deleteStep, s.clearSteps,
            s.buttons, s.addButton, s.clearButtons, s.deleteButton], shallow)

    useEffect(() => {
        const sub1 = EventBus.onPosition()?.subscribe((evt: DslPosition) => setPosition(evt));
        const sub2 = EventBus.onButtonPosition()?.subscribe((btn: ButtonPosition) => setButtonPosition(btn));
        return () => {
            sub1?.unsubscribe();
            sub2?.unsubscribe();
        };
    });

    useEffect(() => {
        const toDelete: string[] = Array.from(steps.keys()).filter(k => CamelDefinitionApiExt.findElementInIntegration(integration, k) === undefined);
        toDelete.forEach(key => deleteStep(key));
    }, [integration]);

    function setButtonPosition(btn: ButtonPosition) {
        if (btn.command === "add") {
            addButton(btn);
        } else if (btn.command === "delete") {
            deleteButton(btn);
        } else if (btn.command === "clean") {
            clearButtons();
        }
    }

    function setPosition(evt: DslPosition) {
        if (evt.command === "add") {
            addStep(evt.step.uuid, evt);
        } else if (evt.command === "delete") {
            deleteStep(evt.step.uuid);
        } else if (evt.command === "clean") {
            clearSteps();
        }
    }

    function getIncomings() {
        let outs: [string, number][] = Array.from(steps.values())
            .filter(pos => ["FromDefinition"].includes(pos.step.dslName))
            .filter(pos => !TopologyUtils.isElementInternalComponent(pos.step))
            .filter(pos => !(pos.step.dslName === 'FromDefinition' && TopologyUtils.hasInternalUri(pos.step)))
            .filter(pos => !(pos.step.dslName === 'FromDefinition' && (pos.step as any).uri === 'kamelet:source'))
            .sort((pos1: DslPosition, pos2: DslPosition) => {
                const y1 = pos1.headerRect.y + pos1.headerRect.height / 2;
                const y2 = pos2.headerRect.y + pos2.headerRect.height / 2;
                return y1 > y2 ? 1 : -1
            })
            .map(pos => [pos.step.uuid, pos.headerRect.y]);
        while (hasOverlap(outs)) {
            outs = addGap(outs);
        }
        return outs;
    }

    function getIncoming(data: [string, number]) {
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

            return (
                <g key={pos.step.uuid + "-incoming"}>
                    <circle cx={incomingX} cy={fromY} r={r} className="circle-incoming"/>
                    {/*<image x={imageX} y={imageY} href={CamelUi.getConnectionIconString(pos.step)} className="icon"/>*/}
                    {/*<text x={imageX - 5} y={imageY + 40} className="caption" textAnchor="start">{CamelUi.getTitle(pos.step)}</text>*/}
                    <path d={`M ${lineX1},${lineY1} C ${lineX1},${lineY2} ${lineX2},${lineY1}  ${lineX2},${lineY2}`}
                          className="path-incoming" markerEnd="url(#arrowhead)"/>
                </g>
            )
        }
    }

    function getIncomingIcons(data: [string, number]) {
        const pos = steps.get(data[0]);
        if (pos) {
            const fromY = pos.headerRect.y + pos.headerRect.height / 2 - top;
            const r = pos.headerRect.height / 2;
            const incomingX = 20;
            const imageX = incomingX - r + 5;
            const imageY = fromY - r + 5;
            return (
                <div key={pos.step.uuid + "-icon"}
                     style={{display: "block", position: "absolute", top: imageY, left: imageX}}>
                    {CamelUi.getConnectionIcon(pos.step)}
                </div>
            )
        }
    }

    function hasOverlap(data: [string, number][]): boolean {
        let result = false;
        data.forEach((d, i, arr) => {
            if (i > 0 && d[1] - arr[i - 1][1] < overlapGap) result = true;
        })
        return result;
    }

    function addGap(data: [string, number][]): [string, number][] {
        const result: [string, number][] = [];
        data.forEach((d, i, arr) => {
            if (i > 0 && d[1] - arr[i - 1][1] < overlapGap) result.push([d[0], d[1] + overlapGap])
            else result.push(d);
        })
        return result;
    }


    function getOutgoings(): [string, number][] {
        const outgoingDefinitions = TopologyUtils.getOutgoingDefinitions();
        let outs: [string, number][] = Array.from(steps.values())
            .filter(pos => outgoingDefinitions.includes(pos.step.dslName))
            .filter(pos => pos.step.dslName !== 'KameletDefinition' || (pos.step.dslName === 'KameletDefinition' && !CamelUi.isActionKamelet(pos.step)))
            .filter(pos => pos.step.dslName === 'ToDefinition' && !CamelUi.isActionKamelet(pos.step) && !TopologyUtils.isElementInternalComponent(pos.step))
            .filter(pos => !(outgoingDefinitions.includes(pos.step.dslName) && TopologyUtils.hasInternalUri(pos.step)))
            .filter(pos => pos.step.dslName !== 'SagaDefinition')
            .filter(pos => !CamelUi.isKameletSink(pos.step))
            .sort((pos1: DslPosition, pos2: DslPosition) => {
                const y1 = pos1.headerRect.y + pos1.headerRect.height / 2;
                const y2 = pos2.headerRect.y + pos2.headerRect.height / 2;
                return y1 > y2 ? 1 : -1
            })
            .map(pos => [pos.step.uuid, pos.headerRect.y - top]);
        while (hasOverlap(outs)) {
            outs = addGap(outs);
        }
        return outs;
    }

    function getOutgoing(data: [string, number]) {
        const pos = steps.get(data[0]);
        if (pos) {
            const fromX = pos.headerRect.x + pos.headerRect.width / 2 - left;
            const fromY = pos.headerRect.y + pos.headerRect.height / 2 - top;
            const r = pos.headerRect.height / 2;

            const outgoingX = width - 20;
            const outgoingY = data[1] + 15;

            const lineX1 = fromX + r;
            const lineY1 = fromY;
            const lineX2 = outgoingX - r * 2 + 4;
            const lineY2 = outgoingY;

            const lineXi = lineX1 + 40;
            const lineYi = lineY2;

            return (
                <g key={pos.step.uuid + "-outgoing"}>
                    <circle cx={outgoingX} cy={outgoingY} r={r} className="circle-outgoing"/>
                    {/*<image x={imageX} y={imageY} href={image} className="icon"/>*/}
                    {/*<text x={imageX + 25} y={imageY + 40}  className="caption" textAnchor="end">{CamelUi.getOutgoingTitle(pos.step)}</text>*/}
                    <path
                        d={`M ${lineX1},${lineY1} C ${lineXi - 20}, ${lineY1} ${lineX1 - 15},${lineYi} ${lineXi},${lineYi} L ${lineX2},${lineY2}`}
                        className="path-incoming" markerEnd="url(#arrowhead)"/>
                </g>
            )
        }
    }

    function getOutgoingIcons(data: [string, number]) {
        const pos = steps.get(data[0]);
        if (pos) {
            const r = pos.headerRect.height / 2;
            const outgoingX = width - 20;
            const outgoingY = data[1] + 15;
            const imageX = outgoingX - r + 5;
            const imageY = outgoingY - r + 5;
            return (
                <div key={pos.step.uuid + "-icon"}
                     style={{display: "block", position: "absolute", top: imageY, left: imageX}}>
                    {CamelUi.getConnectionIcon(pos.step)}
                </div>
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

    function hasSteps(step: CamelElement): boolean {
        return (step.hasSteps() && !['FromDefinition'].includes(step.dslName))
            || ['RouteDefinition', 'TryDefinition', 'ChoiceDefinition', 'SwitchDefinition'].includes(step.dslName);
    }

    function getPreviousStep(pos: DslPosition) {
        return Array.from(steps.values())
            .filter(p => pos.parent?.uuid === p.parent?.uuid)
            .filter(p => p.inSteps)
            .filter(p => p.position === pos.position - 1)[0];
    }

    function getArrow(pos: DslPosition) {
        const endX = pos.headerRect.x + pos.headerRect.width / 2 - left;
        const endY = pos.headerRect.y - 9 - top;
        if (pos.parent) {
            const parent = steps.get(pos.parent.uuid);
            const showArrow = pos.prevStep !== undefined && !['TryDefinition', 'ChoiceDefinition'].includes(pos.prevStep.dslName);
            const name = pos.prevStep?.dslName;
            if (parent && showArrow) {
                const startX = parent.headerRect.x + parent.headerRect.width / 2 - left;
                const startY = parent.headerRect.y + parent.headerRect.height - top;
                if ((!pos.inSteps || (pos.inSteps && pos.position === 0)) && parent.step.dslName !== 'MulticastDefinition') {
                    return (
                        <path name={pos.step.dslName}
                              d={`M ${startX},${startY} C ${startX},${endY} ${endX},${startY}   ${endX},${endY}`}
                              className="path" key={pos.step.uuid} markerEnd="url(#arrowhead)"/>
                    )
                } else if (parent.step.dslName === 'MulticastDefinition' && pos.inSteps) {
                    return (
                        <path d={`M ${startX},${startY} C ${startX},${endY} ${endX},${startY}   ${endX},${endY}`}
                              name={name} className="path" key={pos.step.uuid} markerEnd="url(#arrowhead)"/>
                    )
                } else if (pos.inSteps && pos.position > 0 && !hasSteps(pos.step)) {
                    const prev = getPreviousStep(pos);
                    if (prev) {
                        const r = hasSteps(prev.step) ? prev.rect : prev.headerRect;
                        const prevX = r.x + r.width / 2 - left;
                        const prevY = r.y + r.height - top;
                        return (
                            <line name={name} x1={prevX} y1={prevY} x2={endX} y2={endY} className="path"
                                  key={pos.step.uuid} markerEnd="url(#arrowhead)"/>
                        )
                    }
                } else if (pos.inSteps && pos.position > 0 && hasSteps(pos.step)) {
                    const prev = getPreviousStep(pos);
                    if (prev) {
                        const r = hasSteps(prev.step) ? prev.rect : prev.headerRect;
                        const prevX = r.x + r.width / 2 - left;
                        const prevY = r.y + r.height - top;
                        return (
                            <line name={name} x1={prevX} y1={prevY} x2={endX} y2={endY} className="path"
                                  key={pos.step.uuid} markerEnd="url(#arrowhead)"/>
                        )
                    }
                }
            }
        }
    }

    function getButtonArrow(btn: ButtonPosition) {
        const rect1 = btn.rect;
        const uuid = btn.nextstep.uuid;
        const nextStep = steps.get(uuid);
        const rect2 = nextStep?.rect;
        if (rect1 && rect2) {
            const startX = rect1.x + rect1.width / 2 - left;
            const startY = rect1.y + rect1.height - top - 2;
            const endX = rect2.x + rect2.width / 2 - left;
            const endTempY = rect2.y - top - 9;

            const gapX = Math.abs(endX - startX);
            const gapY = Math.abs(endTempY - startY);

            const radX = gapX > 30 ? 20 : gapX/2;
            const radY = gapY > 30 ? 20 : gapY/2;
            const endY = rect2.y - top - 9 - radY;

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
                // + ` L ${endX} ${endY}`;
            return (
                <path key={btn.uuid} d={path} className="path" markerEnd="url(#arrowhead)"/>
            )
        }
    }

    function getSvg() {
        const stepsArray = Array.from(steps.values());
        return (
            <svg
                style={{width: width, height: height, position: "absolute", left: 0, top: 0}}
                viewBox={"0 0 " + (width) + " " + (height)}>
                <defs>
                    <marker id="arrowhead" markerWidth="9" markerHeight="6" refX="0" refY="3" orient="auto"
                            className="arrow">
                        <polygon points="0 0, 9 3, 0 6"/>
                    </marker>
                </defs>
                {stepsArray.map(pos => getCircle(pos))}
                {stepsArray.map(pos => getArrow(pos))}
                {buttons.map(btn => getButtonArrow(btn)).filter(b => b !== undefined)}
                {getIncomings().map(p => getIncoming(p))}
                {getOutgoings().map(p => getOutgoing(p))}
                {/*{getInternals().map((p) => getInternalLines(p)).flat()}*/}
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
