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
import React, {CSSProperties, useMemo, useState} from 'react';
import {Menu, MenuContent, MenuItem, MenuList, Popover, Text, Tooltip,} from '@patternfly/react-core';
import '../karavan.css';
import './DslElement.css';
import AddIcon from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-circle-icon";
import SyncIcon from "@patternfly/react-icons/dist/js/icons/sync-icon";
import TurnIcon from "@patternfly/react-icons/dist/js/icons/chevron-circle-right-icon";
import InsertIcon from "@patternfly/react-icons/dist/js/icons/arrow-alt-circle-right-icon";
import {CamelElement} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelUi} from "../utils/CamelUi";
import {EventBus} from "../utils/EventBus";
import {ChildElement, CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {CamelDisplayUtil} from "karavan-core/lib/api/CamelDisplayUtil";
import {useDesignerStore, useIntegrationStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";
import {useRouteDesignerHook} from "./useRouteDesignerHook";

interface Props {
    step: CamelElement,
    parent: CamelElement | undefined,
    inSteps: boolean
    position: number
}

export function DslElement(props: Props) {

    const headerRef = React.useRef<HTMLDivElement>(null);
    const {selectElement, moveElement, onShowDeleteConfirmation, openSelector, isKamelet, isSourceKamelet, isActionKamelet} = useRouteDesignerHook();

    const [integration] = useIntegrationStore((s) => [s.integration, s.setIntegration], shallow)

    const [selectedUuids, selectedStep, showMoveConfirmation, setShowMoveConfirmation, hideLogDSL, setMoveElements] =
        useDesignerStore((s) =>
            [s.selectedUuids, s.selectedStep, s.showMoveConfirmation, s.setShowMoveConfirmation, s.hideLogDSL, s.setMoveElements], shallow)
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

    function onDeleteElement(evt: React.MouseEvent) {
        evt.stopPropagation();
        onShowDeleteConfirmation(props.step.uuid);
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

    function isElementHidden(): boolean {
        return props.step.dslName === 'LogDefinition' && hideLogDSL;
    }

    function hasBorder(): boolean {
        return (props.step?.hasSteps() && !['FromDefinition'].includes(props.step.dslName))
            || ['RouteConfigurationDefinition',
                'RouteDefinition',
                'TryDefinition',
                'ChoiceDefinition',
                'SwitchDefinition'].includes(props.step.dslName);
    }

    function isNotDraggable(): boolean {
        return ['FromDefinition', 'RouteConfigurationDefinition', 'RouteDefinition', 'WhenDefinition', 'OtherwiseDefinition'].includes(props.step.dslName);
    }

    function isWide(): boolean {
        return ['RouteConfigurationDefinition', 'RouteDefinition', 'ChoiceDefinition', 'SwitchDefinition', 'MulticastDefinition', 'TryDefinition', 'CircuitBreakerDefinition']
            .includes(props.step.dslName);
    }

    function isAddStepButtonLeft(): boolean {
        return ['MulticastDefinition']
            .includes(props.step.dslName);
    }

    function isHorizontal(): boolean {
        return ['MulticastDefinition'].includes(props.step.dslName);
    }

    function isRoot(): boolean {
        return ['RouteConfigurationDefinition', 'RouteDefinition'].includes(props.step?.dslName);
    }

    function isInStepWithChildren() {
        const step: CamelElement = props.step;
        const children = CamelDefinitionApiExt.getElementChildrenDefinition(step.dslName);
        return children.filter((c: ChildElement) => c.name === 'steps' || c.multiple).length > 0 && props.inSteps;
    }

    function getChildrenInfo(step: CamelElement): [boolean, number, boolean, number, number] {
        const children = CamelDefinitionApiExt.getElementChildrenDefinition(step.dslName);
        const hasStepsField = children.filter((c: ChildElement) => c.name === 'steps').length === 1;
        const stepsChildrenCount = children
            .filter(c => c.name === 'steps')
            .map((child: ChildElement, index: number) => {
                const children: CamelElement[] = CamelDefinitionApiExt.getElementChildren(step, child);
                return children.length;
            }).reduce((a, b) => a + b, 0);

        const hasNonStepsFields = children.filter(c => c.name !== 'steps' && c.name !== 'expression' && c.name !== 'onWhen').length > 0;
        const childrenCount = children
            .map((child: ChildElement, index: number) => {
                const children: CamelElement[] = CamelDefinitionApiExt.getElementChildren(step, child);
                return children.length;
            }).reduce((a, b) => a + b, 0);
        const nonStepChildrenCount = childrenCount - stepsChildrenCount;
        return [hasStepsField, stepsChildrenCount, hasNonStepsFields, nonStepChildrenCount, childrenCount]
    }

    function hasWideChildrenElement() {
        const [hasStepsField, stepsChildrenCount, hasNonStepsFields, nonStepChildrenCount, childrenCount] = getChildrenInfo(props.step);
        if (isHorizontal() && stepsChildrenCount > 1) return true;
        else if (hasStepsField && stepsChildrenCount > 0 && hasNonStepsFields && nonStepChildrenCount > 0) return true;
        else if (!hasStepsField && hasNonStepsFields && childrenCount > 1) return true;
        else if (hasStepsField && stepsChildrenCount > 0 && hasNonStepsFields && childrenCount > 1) return true;
        else return false;
    }

    function hasBorderOverSteps(step: CamelElement) {
        const [hasStepsField, stepsChildrenCount, hasNonStepsFields, nonStepChildrenCount] = getChildrenInfo(step);
        if (hasStepsField && stepsChildrenCount > 0 && hasNonStepsFields && nonStepChildrenCount > 0) return true;
        else return false;
    }

    function getHeaderStyle() {
        const style: CSSProperties = {
            width: isWide() ? "100%" : "",
            fontWeight: isElementSelected() ? "bold" : "normal",
        };
        return style;
    }

    function sendPosition(el: HTMLDivElement | null) {
        const isSelected = isElementSelected();
        const isHidden = isElementHidden();
        if (el) {
            const header = Array.from(el.childNodes.values()).filter((n: any) => n.classList.contains("header"))[0];
            if (header) {
                const headerIcon: any = Array.from(header.childNodes.values()).filter((n: any) => n.classList.contains("header-icon"))[0];
                const headerRect = headerIcon.getBoundingClientRect();
                const rect = el.getBoundingClientRect();
                if (props.step.showChildren) {
                    if (isHidden) {
                        // EventBus.sendPosition("delete", props.step, props.parent, new DOMRect(), new DOMRect(), 0);
                        EventBus.sendPosition("add", props.step, props.parent, rect, headerRect, props.position, props.inSteps, isSelected);
                    } else {
                        EventBus.sendPosition("add", props.step, props.parent, rect, headerRect, props.position, props.inSteps, isSelected);
                    }
                } else {
                    EventBus.sendPosition("delete", props.step, props.parent, new DOMRect(), new DOMRect(), 0);
                }
            }
        }
    }

    function getAvailableModels() { // TODO: make static list-of-values instead
        const step: CamelElement = props.step
        return CamelUi.getSelectorModelsForParent(step.dslName, false);
    }

    const availableModels = useMemo(
        () => getAvailableModels(),
        [props.step.dslName]
    );


    function getHeader() {
        const step: CamelElement = props.step;
        const parent = props.parent;
        const inRouteConfiguration = parent !== undefined && parent.dslName === 'RouteConfigurationDefinition';
        const showAddButton = !['CatchDefinition', 'RouteDefinition'].includes(step.dslName) && availableModels.length > 0;
        const showInsertButton =
            !['FromDefinition', 'RouteConfigurationDefinition', 'RouteDefinition', 'CatchDefinition', 'FinallyDefinition', 'WhenDefinition', 'OtherwiseDefinition'].includes(step.dslName)
            && !inRouteConfiguration;
        const headerClass = ['RouteConfigurationDefinition', 'RouteDefinition'].includes(step.dslName) ? "header-route" : "header"
        const headerClasses = isElementSelected() ? headerClass + " selected" : headerClass;
        return (
            <div className={"dsl-element " + headerClasses} style={getHeaderStyle()} ref={headerRef}>
                {!['RouteConfigurationDefinition', 'RouteDefinition'].includes(props.step.dslName) &&
                    <div
                        ref={el => sendPosition(el)}
                        className={"header-icon"}
                        style={isWide() ? {width: ""} : {}}>
                        {CamelUi.getIconForElement(step)}
                    </div>
                }
                <div className={hasWideChildrenElement() ? "header-text" : ""}>
                    {hasWideChildrenElement() && <div className="spacer"/>}
                    {getHeaderTextWithTooltip(step)}
                </div>
                {showInsertButton && getInsertElementButton()}
                {getDeleteButton()}
                {/*{getMenuButton()}*/}
                {showAddButton && getAddElementButton()}
            </div>
        )
    }

    function getHeaderText(step: CamelElement): string {
        if (isKamelet() && step.dslName === 'ToDefinition' && (step as any).uri === 'kamelet:sink') {
            return "Sink";
        } else if (isKamelet() && step.dslName === 'FromDefinition' && (step as any).uri === 'kamelet:source') {
            return "Source";
        } else {
            return (step as any).description ? (step as any).description : CamelUi.getElementTitle(props.step);
        }
    }

    function getHeaderTextWithTooltip(step: CamelElement) {
        const checkRequired = CamelUtil.checkRequired(step);
        const title = getHeaderText(step);
        let className = hasWideChildrenElement() ? "text text-right" : "text text-bottom";
        if (!checkRequired[0]) className = className + " header-text-required";
        if (checkRequired[0]) {
            return <Text className={className}>{title}</Text>
        } else return (
            <Tooltip position={"right"} className="tooltip-required-field"
                     content={checkRequired[1].map((text, i) => (<div key={i}>{text}</div>))}>
                <Text className={className}>{title}</Text>
            </Tooltip>
        )
    }

    function getHeaderWithTooltip(tooltip: string | undefined) {
        return (
            <>
                {getHeader()}
                <Tooltip triggerRef={headerRef} position={"left"} content={<div>{tooltip}</div>}/>
            </>

        )
    }

    function getHeaderTooltip(): string | undefined {
        if (CamelUi.isShowExpressionTooltip(props.step)) return CamelUi.getExpressionTooltip(props.step);
        if (CamelUi.isShowUriTooltip(props.step)) return CamelUi.getUriTooltip(props.step);
        return undefined;
    }

    function getElementHeader() {
        const tooltip = getHeaderTooltip();
        if (tooltip !== undefined && !isDragging) {
            return getHeaderWithTooltip(tooltip);
        }
        return getHeader();
    }

    function getChildrenStyle() {
        const style: CSSProperties = {
            display: "flex",
            flexDirection: "row",
        }
        return style;
    }

    function getChildrenElementsStyle(child: ChildElement, notOnlySteps: boolean) {
        const step = props.step;
        const isBorder = child.name === 'steps' && hasBorderOverSteps(step);
        const style: CSSProperties = {
            borderStyle: isBorder ? "dotted" : "none",
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
                    {children.map((element, index) => (
                        <div key={step.uuid + child.className + index}>
                            <DslElement
                                inSteps={child.name === 'steps'}
                                position={index}
                                step={element}
                                parent={step}/>
                        </div>
                    ))}
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
            <Tooltip position={"bottom"}
                     content={<div>{"Add step to " + CamelDisplayUtil.getTitle(step)}</div>}>
                <button type="button" aria-label="Add" onClick={e => onOpenSelector(e)}
                        className={isAddStepButtonLeft() ? "add-button add-button-left" : "add-button add-button-bottom"}>
                    <AddIcon/>
                </button>
            </Tooltip>
        )
    }

    function getAddElementButton() {
        return (
            <Tooltip position={"bottom"}
                     content={<div>{"Add DSL element to " + CamelDisplayUtil.getTitle(props.step)}</div>}>
                <button
                    type="button"
                    aria-label="Add"
                    onClick={e => onOpenSelector(e, false)}
                    className={"add-element-button"}>
                    <AddIcon/>
                </button>
            </Tooltip>
        )
    }

    function getInsertElementButton() {
        return (
            <Tooltip position={"left"} content={<div>{"Insert element before"}</div>}>
                <button type="button" aria-label="Insert" onClick={e => onOpenSelector(e, true, true)}
                        className={"insert-element-button"}><InsertIcon/>
                </button>
            </Tooltip>
        )
    }

    function getDeleteButton() {
        return (
            <Tooltip position={"right"} content={<div>{"Delete element"}</div>}>
                <button type="button" aria-label="Delete" onClick={e => onDeleteElement(e)} className="delete-button">
                    <DeleteIcon/>
                </button>
            </Tooltip>
        )
    }

    function getMenuButton() {
        return (
            <Popover
                aria-label="Convert Popover"
                hasNoPadding
                position={"right"}
                hideOnOutsideClick={true}
                showClose={false}
                bodyContent={
                    <Menu activeItemId={''} onSelect={event => {}} isPlain>
                        <MenuContent>
                            <MenuList>
                                <MenuItem itemId={0} icon={<SyncIcon aria-hidden />}>Convert to SetHeader</MenuItem>
                                {/*<MenuItem itemId={1}>Action</MenuItem>*/}
                                {/*<MenuItem itemId={2}>Action</MenuItem>*/}
                            </MenuList>
                        </MenuContent>
                    </Menu>
                }
            >
                <button type="button" aria-label="Menu" onClick={e => {}} className="menu-button">
                    <TurnIcon/>
                </button>
            </Popover>
        )
    }

    const element: CamelElement = props.step;
    const className = "step-element"
        + (isElementSelected() ? " step-element-selected" : "") + (!props.step.showChildren ? " hidden-step" : "")
        + ((element as any).disabled ? " disabled " : "");
    return (
        <div key={"root" + element.uuid}
             className={className}
             ref={el => sendPosition(el)}
             style={{
                 borderStyle: hasBorder() ? "dotted" : "none",
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
            {getElementHeader()}
            {getChildElements()}
        </div>
    )
}
