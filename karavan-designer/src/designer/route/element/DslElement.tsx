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
import React, {CSSProperties, useState} from 'react';
import {Tooltip,} from '@patternfly/react-core';
import '../../karavan.css';
import './DslElement.css';
import {CamelElement} from "karavan-core/lib/model/IntegrationDefinition";
import {EventBus} from "../../utils/EventBus";
import {ChildElement, CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {CamelDisplayUtil} from "karavan-core/lib/api/CamelDisplayUtil";
import {useDesignerStore, useIntegrationStore} from "../../DesignerStore";
import {shallow} from "zustand/shallow";
import {useRouteDesignerHook} from "../useRouteDesignerHook";
import {AddElementIcon} from "../../utils/ElementIcons";
import {DslElementHeader} from "./DslElementHeader";

interface Props {
    step: CamelElement,
    parent: CamelElement | undefined,
    nextStep: CamelElement | undefined,
    prevStep: CamelElement | undefined,
    inSteps: boolean
    position: number
    inStepsLength: number
}

export function DslElement(props: Props) {

    const headerRef = React.useRef<HTMLDivElement>(null);
    const {
        selectElement,
        moveElement,
        onShowDeleteConfirmation,
        openSelector,
        isKamelet,
        isSourceKamelet,
        isActionKamelet
    } = useRouteDesignerHook();

    const [integration] = useIntegrationStore((s) => [s.integration], shallow)

    const [selectedUuids, selectedStep, showMoveConfirmation, setShowMoveConfirmation, setMoveElements] =
        useDesignerStore((s) =>
            [s.selectedUuids, s.selectedStep, s.showMoveConfirmation, s.setShowMoveConfirmation, s.setMoveElements], shallow)
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const [isDraggedOver, setIsDraggedOver] = useState<boolean>(false);

    function onOpenSelector(evt: React.MouseEvent, showSteps: boolean = true, isInsert: boolean = false) {
        evt.stopPropagation();
        if (isInsert && props.parent) {
            openSelector(props.parent.uuid, props.parent.dslName, showSteps, props.position);
        } else {
            openSelector(props.step.uuid, props.step.dslName, showSteps);
        }
    }

    function onSelectElement(evt: React.MouseEvent) {
        evt.stopPropagation();
        selectElement(props.step);
    }

    function dragElement(event: React.DragEvent<HTMLDivElement>, element: CamelElement) {
        event.preventDefault();
        event.stopPropagation();
        setIsDraggedOver(false);
        const sourceUuid = event.dataTransfer.getData("text/plain");
        const targetUuid = element.uuid;
        if (sourceUuid !== targetUuid) {
            if (element.hasSteps()) {
                setShowMoveConfirmation(true);
                setMoveElements([sourceUuid, targetUuid])
            } else {
                moveElement(sourceUuid, targetUuid, false);
            }
        }
    }

    function isElementSelected(): boolean {
        return selectedUuids.includes(props.step.uuid);
    }

    function hasBorder(): boolean {
        const step = props.step;
        if (['FilterDefinition', 'RouteDefinition', 'RouteConfigurationDefinition'].includes(step.dslName)) {
            return true;
        }
        if ([
            'FromDefinition',
            'TryDefinition',
            'CatchDefinition', 'FinallyDefinition',
            'ChoiceDefinition',
            'SwitchDefinition', 'WhenDefinition', 'OtherwiseDefinition'
        ].includes(step.dslName)) {
            return false;
        }
        return props.step?.hasSteps();
    }

    function isNotDraggable(): boolean {
        return ['FromDefinition', 'RouteConfigurationDefinition', 'RouteDefinition', 'WhenDefinition', 'OtherwiseDefinition'].includes(props.step.dslName);
    }

    function isAddStepButtonLeft(): boolean {
        return ['MulticastDefinition', 'LoadBalanceDefinition']
            .includes(props.step.dslName);
    }

    function isHorizontal(): boolean {
        return ['MulticastDefinition', 'LoadBalanceDefinition'].includes(props.step.dslName);
    }


    function isInStepWithChildren() {
        const step: CamelElement = props.step;
        const children = CamelDefinitionApiExt.getElementChildrenDefinition(step.dslName);
        return children.filter((c: ChildElement) => c.name === 'steps' || c.multiple).length > 0 && props.inSteps;
    }


    function sendPosition(el: HTMLDivElement | null) {
        const {step, prevStep, nextStep, parent, inSteps, inStepsLength} = props;
        const isSelected = isElementSelected();
        if (el) {
            const header = Array.from(el.childNodes.values()).filter((n: any) => n.classList.contains("header"))[0];
            if (header) {
                const headerIcon: any = Array.from(header.childNodes.values()).filter((n: any) => n.classList.contains("header-icon"))[0];
                const headerRect = headerIcon.getBoundingClientRect();
                const rect = el.getBoundingClientRect();
                if (step.showChildren) {
                    EventBus.sendPosition("add", step, prevStep, nextStep, parent, rect, headerRect, props.position, inStepsLength, inSteps, isSelected);
                }
            }
        } else {
            EventBus.sendPosition("delete", step, prevStep, nextStep, parent, new DOMRect(), new DOMRect(), 0, 0);
        }
    }

    function getChildrenStyle() {
        const style: CSSProperties = {
            display: "flex",
            flexDirection: "row",
        }
        return style;
    }

    function getChildrenElementsStyle(child: ChildElement, notOnlySteps: boolean) {
        const style: CSSProperties = {
            borderColor: "var(--step-border-color)",
            borderWidth: "1px",
            borderRadius: "16px",
            display: isHorizontal() || child.name !== 'steps' ? "flex" : "block",
            flexDirection: "row",
        }
        return style;
    }

    function getChildElements() {
        const step: CamelElement = props.step;
        let children: ChildElement[] = CamelDefinitionApiExt.getElementChildrenDefinition(step.dslName);
        const notOnlySteps = children.filter(c => c.name === 'steps').length === 1
            && children.filter(c => c.multiple && c.name !== 'steps').length > 0;

        if (step.dslName !== 'RouteDefinition') {
            children = children.filter(child => {
                const cc = CamelDefinitionApiExt.getElementChildrenDefinition(child.className);
                return child.name === 'steps' || cc.filter(c => c.multiple).length > 0;
            })
        } else {
            children = children.filter(child => child.className === 'FromDefinition')
        }
        if (step.dslName === 'CatchDefinition') { // exception
            children = children.filter(value => value.name !== 'onWhen')
        }
        return (
            <div key={step.uuid + "-children"} className="children" style={getChildrenStyle()}>
                {children.map((child: ChildElement, index: number) => getChildDslElements(child, index, notOnlySteps))}
            </div>
        )
    }

    function getChildDslElements(child: ChildElement, index: number, notOnlySteps: boolean) {
        const step = props.step;
        const children: CamelElement[] = CamelDefinitionApiExt.getElementChildren(step, child);
        if (children.length > 0) {
            return (
                <div className={child.name + " has-child"} style={getChildrenElementsStyle(child, notOnlySteps)}
                     key={step.uuid + "-child-" + index}>
                    {children.map((element, index, array) => {
                            let prevStep = children.at(index - 1);
                            let nextStep: CamelElement | undefined = undefined;
                            if ('ChoiceDefinition' === step.dslName) {
                                nextStep = props.nextStep;
                            } else if ('TryDefinition' === step.dslName && ['CatchDefinition', 'FinallyDefinition'].includes(element.dslName)) {
                                nextStep = props.nextStep;
                            } else {
                                nextStep = children.at(index + 1);
                            }
                            return (<div key={step.uuid + child.className + index}>
                                <DslElement
                                    inSteps={child.name === 'steps'}
                                    position={index}
                                    step={element}
                                    nextStep={nextStep}
                                    prevStep={prevStep}
                                    inStepsLength={array.length}
                                    parent={step}/>
                            </div>)
                        }
                    )}
                    {child.name === 'steps' && getAddStepButton()}
                </div>
            )
        } else if (child.name === 'steps') {
            return (
                <div className={child.name + " has-child"} style={getChildrenElementsStyle(child, notOnlySteps)}
                     key={step.uuid + "-child-" + index}>
                    {getAddStepButton()}
                </div>
            )
        }
    }

    function getAddStepButton() {
        const {step} = props;
        const hideAddButton = step.dslName === 'StepDefinition' && !CamelDisplayUtil.isStepDefinitionExpanded(integration, step.uuid, selectedUuids.at(0));
        if (hideAddButton) return (<></>)
        else return (
                <Tooltip position={"left"}
                         content={<div>{"Add step to " + CamelDisplayUtil.getTitle(step)}</div>}
                >
                    <button type="button"
                            aria-label="Add"
                            onClick={e => onOpenSelector(e)}
                            className={isAddStepButtonLeft() ? "add-button add-button-left" : "add-button add-button-bottom"}>
                        <AddElementIcon/>
                    </button>

                </Tooltip>
        )
    }

    const element: CamelElement = props.step;
    const className = "step-element"
        + (!props.step.showChildren ? " hidden-step" : "")
        + ((element as any).disabled ? " disabled " : "");
    return (
        <div key={"root" + element.uuid}
             className={className}
             ref={el => sendPosition(el)}
             style={{
                 borderStyle: hasBorder() ? "dashed" : "none",
                 borderColor: isElementSelected() ? "var(--step-border-color-selected)" : "var(--step-border-color)",
                 marginTop: isInStepWithChildren() ? "16px" : "8px",
                 zIndex: element.dslName === 'ToDefinition' ? 20 : 10,
                 boxShadow: isDraggedOver ? "0px 0px 1px 2px var(--step-border-color-selected)" : "none",
             }}
             onMouseOver={event => event.stopPropagation()}
             onClick={event => onSelectElement(event)}
             onDragStart={event => {
                 event.stopPropagation();
                 event.dataTransfer.setData("text/plain", element.uuid);
                 (event.target as any).style.opacity = .5;
                 setIsDragging(true);
             }}
             onDragEnd={event => {
                 (event.target as any).style.opacity = '';
                 setIsDragging(false);
             }}
             onDragOver={event => {
                 event.preventDefault();
                 event.stopPropagation();
                 if (element.dslName !== 'FromDefinition' && !isDragging) {
                     setIsDraggedOver(true);
                 }
             }}
             onDragEnter={event => {
                 event.preventDefault();
                 event.stopPropagation();
                 if (element.dslName !== 'FromDefinition') {
                     setIsDraggedOver(true);
                 }
             }}
             onDragLeave={event => {
                 event.preventDefault();
                 event.stopPropagation();
                 setIsDraggedOver(false);
             }}
             onDrop={event => dragElement(event, element)}
             draggable={!isNotDraggable()}
        >
            <DslElementHeader headerRef={headerRef}
                              step={props.step}
                              parent={props.parent}
                              nextStep={props.nextStep}
                              prevStep={props.prevStep}
                              inSteps={props.inSteps}
                              isDragging={isDragging}
                              position={props.position}/>
            {getChildElements()}
        </div>
    )
}
