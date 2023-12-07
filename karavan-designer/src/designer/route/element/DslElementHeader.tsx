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
import React, {CSSProperties, useMemo} from 'react';
import {Text, Tooltip,} from '@patternfly/react-core';
import '../../karavan.css';
import './DslElement.css';
import {CamelElement} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelUi} from "../../utils/CamelUi";
import {ChildElement, CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {CamelDisplayUtil} from "karavan-core/lib/api/CamelDisplayUtil";
import {useDesignerStore} from "../../DesignerStore";
import {shallow} from "zustand/shallow";
import {useRouteDesignerHook} from "../useRouteDesignerHook";
import {AddElementIcon, DeleteElementIcon, InsertElementIcon} from "./DslElementIcons";
import { RouteConfigurationDefinition} from "karavan-core/lib/model/CamelDefinition";

interface Props {
    headerRef: React.RefObject<HTMLDivElement>
    step: CamelElement,
    parent: CamelElement | undefined,
    nextStep: CamelElement | undefined,
    prevStep: CamelElement | undefined,
    inSteps: boolean
    position: number
    isDragging: boolean
}

export function DslElementHeader(props: Props) {

    const {
        selectElement,
        moveElement,
        onShowDeleteConfirmation,
        openSelector,
        isKamelet,
        isSourceKamelet,
        isActionKamelet
    } = useRouteDesignerHook();

    const [selectedUuids, selectedStep, showMoveConfirmation, setShowMoveConfirmation, hideLogDSL, setMoveElements] =
        useDesignerStore((s) =>
            [s.selectedUuids, s.selectedStep, s.showMoveConfirmation, s.setShowMoveConfirmation, s.hideLogDSL, s.setMoveElements], shallow)

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

    function isElementSelected(): boolean {
        return selectedUuids.includes(props.step.uuid);
    }

    function isWide(): boolean {
        return ['RouteConfigurationDefinition', 'RouteDefinition', 'ChoiceDefinition', 'MulticastDefinition', 'TryDefinition', 'CircuitBreakerDefinition']
            .includes(props.step.dslName);
    }

    function isHorizontal(): boolean {
        return ['MulticastDefinition'].includes(props.step.dslName);
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

    function getHeaderStyle() {
        const style: CSSProperties = {
            width: isWide() ? "100%" : "",
            fontWeight: isElementSelected() ? "bold" : "normal",
        };
        return style;
    }

    function getAvailableModels() { // TODO: make static list-of-values instead
        const step: CamelElement = props.step
        return CamelUi.getSelectorModelsForParent(step.dslName, false);
    }

    const availableModels = useMemo(
        () => getAvailableModels(),
        [props.step.dslName]
    );

    function hasElements(rc: RouteConfigurationDefinition): boolean {
        return (rc.interceptFrom !== undefined && rc.interceptFrom.length > 0)
    || (rc.intercept !== undefined && rc.intercept.length > 0)
    || (rc.interceptSendToEndpoint !== undefined && rc.interceptSendToEndpoint.length > 0)
    || (rc.onException !== undefined && rc.onException.length > 0)
    || (rc.onCompletion !== undefined && rc.onCompletion.length > 0)
    }

    function getHeaderClasses(): string {
        const classes: string[] = [];
        const step: CamelElement = props.step;
        if (step.dslName === 'RouteDefinition') {
            classes.push('header-route')
            classes.push('header-bottom-line')
            classes.push(isElementSelected() ? 'header-bottom-selected' : 'header-bottom-not-selected')
        } else if (step.dslName === 'RouteConfigurationDefinition') {
            classes.push('header-route')
            if (hasElements(step)) classes.push('header-bottom-line')
            classes.push(isElementSelected() ? 'header-bottom-selected' : 'header-bottom-not-selected')
        } else {
            classes.push('header')
        }
        if (isElementSelected()) {
            classes.push("selected")
        }
        return classes.join(" ");
    }

    function getHeader() {
        const step: CamelElement = props.step;
        const parent = props.parent;
        const inRouteConfiguration = parent !== undefined && parent.dslName === 'RouteConfigurationDefinition';
        const showAddButton = !['CatchDefinition', 'RouteDefinition'].includes(step.dslName) && availableModels.length > 0;
        const showInsertButton =
            !['FromDefinition', 'RouteConfigurationDefinition', 'RouteDefinition', 'CatchDefinition', 'FinallyDefinition', 'WhenDefinition', 'OtherwiseDefinition'].includes(step.dslName)
            && !inRouteConfiguration;
        const headerClasses = getHeaderClasses();
        return (
            <div className={"dsl-element " + headerClasses} style={getHeaderStyle()} ref={props.headerRef}>
                {!['RouteConfigurationDefinition', 'RouteDefinition'].includes(props.step.dslName) &&
                    <div
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
        const title = getHeaderText(step);
        const checkRequired = CamelUtil.checkRequired(step);
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
                <Tooltip triggerRef={props.headerRef} position={"left"} content={<div>{tooltip}</div>}/>
            </>

        )
    }

    function getHeaderTooltip(): string | undefined {
        if (CamelUi.isShowExpressionTooltip(props.step)) return CamelUi.getExpressionTooltip(props.step);
        if (CamelUi.isShowUriTooltip(props.step)) return CamelUi.getUriTooltip(props.step);
        return undefined;
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
                    <AddElementIcon/>
                </button>
            </Tooltip>
        )
    }

    function getInsertElementButton() {
        return (
            <Tooltip position={"left"} content={<div>{"Insert element before"}</div>}>
                <button type="button"
                        aria-label="Insert"
                        onClick={e => onOpenSelector(e, true, true)}
                        className={"insert-element-button"}>
                    <InsertElementIcon/>
                </button>
            </Tooltip>
        )
    }

    function getDeleteButton() {
        return (
            <Tooltip position={"right"} content={<div>{"Delete element"}</div>}>
                <button type="button" aria-label="Delete" onClick={e => onDeleteElement(e)} className="delete-button">
                    <DeleteElementIcon/>
                </button>
            </Tooltip>
        )
    }

    const tooltip = getHeaderTooltip();
    if (tooltip !== undefined && !props.isDragging) {
        return getHeaderWithTooltip(tooltip);
    }
    return getHeader();
}
