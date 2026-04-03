import React, {CSSProperties, ReactElement, useCallback, useMemo, useRef} from 'react';
import {Content, Tooltip,} from '@patternfly/react-core';
import '@features/project/designer/karavan.css';
import '@features/project/designer/route/element/DslElement.css';
import {CamelElement} from "@core/model/IntegrationDefinition";
import {CamelDefinitionApiExt, ChildElement} from "@core/api/CamelDefinitionApiExt";
import {CamelUtil} from "@core/api/CamelUtil";
import {CamelDisplayUtil} from "@core/api/CamelDisplayUtil";
import {shallow} from "zustand/shallow";
import {RouteConfigurationDefinition} from "@core/model/CamelDefinition";
import {useRouteDesignerHook} from "@features/project/designer/route/useRouteDesignerHook";
import {useDesignerStore, useIntegrationStore} from "@features/project/designer/DesignerStore";
import {CamelUi} from "@features/project/designer/utils/CamelUi";
import {AddElementIcon, CopyElementIcon, DeleteElementIcon, DisableStepIcon, EnableStepIcon, InsertElementIcon} from "@features/project/designer/utils/ElementIcons";
import {AutoStartupFalseIcon, ErrorHandlerIcon} from "@features/project/designer/icons/OtherIcons";
import "./DslElementHeader.css"
import {usePropertiesHook} from "@features/project/designer/property/usePropertiesHook";

interface Props {
    headerRef?: React.Ref<HTMLDivElement>;
    step: CamelElement,
    parent: CamelElement | undefined,
    nextStep: CamelElement | undefined,
    prevStep: CamelElement | undefined,
    inSteps: boolean
    position: number
    isDragging: boolean
}

function DslElementHeader(props: Props) {

    const {
        selectElement,
        moveElement,
        onShowDeleteConfirmation,
        openSelector,
        isKamelet,
        isSourceKamelet,
        isActionKamelet,
        copyPasteStep
    } = useRouteDesignerHook();

    const { onDisableStep, onAutoStartRoute, onStepPropertyChange } = usePropertiesHook();

    const [integration] = useIntegrationStore((s) => [s.integration], shallow)

    const [selectedStep, showMoveConfirmation, setShowMoveConfirmation, setMoveElements, passedIds, passedRouteId, failed, failedRouteId, suspendedNodeId, isDebugging] =
        useDesignerStore((s) =>
            [s.selectedStep, s.showMoveConfirmation, s.setShowMoveConfirmation, s.setMoveElements, s.passedNodeIds, s.passedRouteId, s.failed, s.failedRouteId, s.suspendedNodeId, s.isDebugging], shallow)

    const {step, parent} = props;
    const disabled = (step as any).disabled === true;
    const autoStartup = (step as any).autoStartup === undefined || (step as any).autoStartup === true;
    const localHeaderRef = useRef<HTMLDivElement | null>(null);
    const isMasGenerated = (step as any)?.note?.startsWith("_mas_");

    // Merge any incoming ref into our local ref
    const mergedRef = useCallback(
        (node: HTMLDivElement | null) => {
            // keep our own ref updated
            localHeaderRef.current = node;

            // propagate to the incoming ref (supports both callback and RefObject)
            const r = props.headerRef;
            if (typeof r === "function") r(node);
            else if (r && "current" in r) (r as React.MutableRefObject<HTMLDivElement | null>).current = node;
        },
        [props.headerRef]
    );

    function onOpenSelector(evt: React.MouseEvent, showSteps: boolean = true, isInsert: boolean = false) {
        evt.stopPropagation();
        if (isInsert && props.parent) {
            openSelector(props.parent.uuid, props.parent.dslName, showSteps, props.position);
        } else {
            openSelector(step.uuid, step.dslName, showSteps);
        }
    }

    function onDeleteElement(evt: React.MouseEvent) {
        evt.stopPropagation();
        onShowDeleteConfirmation(step.uuid);
    }

    function isElementSelected(): boolean {
        return (selectedStep as any)?.id === (step as any).id;
    }

    function isWide(): boolean {
        return ['RouteConfigurationDefinition', 'RouteTemplateDefinition', 'RouteDefinition', 'ChoiceDefinition', 'MulticastDefinition',
            'LoadBalanceDefinition', 'TryDefinition', 'CircuitBreakerDefinition']
            .includes(step.dslName);
    }

    function isHorizontal(): boolean {
        return ['MulticastDefinition', 'LoadBalanceDefinition'].includes(step.dslName);
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

    function getHasWideChildrenElement(childrenInfo: [boolean, number, boolean, number, number]) {
        const [hasStepsField, stepsChildrenCount, hasNonStepsFields, nonStepChildrenCount, childrenCount] = childrenInfo;
        if (step.dslName === 'SetHeadersDefinition') return false;
        else if (isHorizontal() && stepsChildrenCount > 1) return true;
        else if (hasStepsField && stepsChildrenCount > 0 && hasNonStepsFields && nonStepChildrenCount > 0) return true;
        else if (!hasStepsField && hasNonStepsFields && childrenCount > 1) return true;
        else if (hasStepsField && stepsChildrenCount > 0 && hasNonStepsFields && childrenCount > 1) return true;
        else return false;
    }

    function getHeaderStyle() {
        const style: CSSProperties = {
            width: isWide() ? "100%" : "",
            fontWeight: isElementSelected() ? "bold" : "normal",
            borderWidth: getBorderWidth(),
            borderColor: getBorderColor(),
        };
        return style;
    }

    function getAvailableModels() { // TODO: make static list-of-values instead
        return CamelUi.getSelectorModelsForParent(step.dslName, false);
    }

    const availableModels = useMemo(
        () => getAvailableModels(),
        [step.dslName]
    );

    function hasElements(rc: RouteConfigurationDefinition): boolean {
        return (rc.interceptFrom !== undefined && rc.interceptFrom.length > 0)
            || (rc.intercept !== undefined && rc.intercept.length > 0)
            || (rc.interceptSendToEndpoint !== undefined && rc.interceptSendToEndpoint.length > 0)
            || (rc.onException !== undefined && rc.onException.length > 0)
            || (rc.onCompletion !== undefined && rc.onCompletion.length > 0)
    }

    function getHeaderIconClasses(): string {
        const classes: string[] = ['header-icon'];
        if (['ToDefinition', 'FromDefinition', 'PollDefinition', 'WireTapDefinition'].includes(step.dslName)) {
            classes.push('header-icon-square');
        } else if (step.dslName === 'ChoiceDefinition') {
            classes.push('header-icon-diamond');
        } else {
            classes.push('header-icon-circle');
        }
        const passed = passedIds.includes((step as any).id);
        if (step.dslName === 'FromDefinition') {
        }
        if (passed) {
            classes.push("header-icon-border-passed");
        }
        if (suspendedNodeId === (step as any).id) {
            classes.push(failed ? "header-icon-border-failed" : "header-icon-border-current")
        }
        if (isMasGenerated) {
            classes.push("transparent-gradient-border")
        }
        classes.push((step as any)?.disabled ? " disabled " : "")
        classes.push((parent as any)?.disabled ? " disabled " : "")
        return classes.join(" ");
    }

    function getBorderColor() {
        if (step.dslName === 'RouteDefinition' && (step as any).id === failedRouteId) {
            return "var(--pf-t--color--red--50)";
        } else if (step.dslName === 'RouteDefinition' && (step as any).id === passedRouteId) {
            return "var(--pf-t--color--green--50)";
        } else {
            return isElementSelected() ? "var(--step-border-color-selected)" : "var(--step-border-color)";
        }
    }

    function getBorderWidth() {
        if (step.dslName === 'RouteDefinition' && (step as any).id === passedRouteId) {
            return "2px";
        } else {
            return '1px';
        }
    }

    function getHeaderClasses(): string {
        const classes: string[] = [];
        if (step.dslName === 'RouteDefinition') {
            classes.push('header-route')
            classes.push('header-bottom-line')
            classes.push(isElementSelected() ? 'header-bottom-selected' : 'header-bottom-not-selected')
        } else if (step.dslName === 'RouteTemplateDefinition') {
            classes.push('header-route')
            classes.push('header-bottom-line')
            classes.push(isElementSelected() ? 'header-bottom-selected' : 'header-bottom-not-selected')
        } else if (step.dslName === 'RouteConfigurationDefinition') {
            classes.push('header-route')
            if (hasElements(step)) {
                classes.push(isElementSelected() ? 'header-bottom-selected' : 'header-bottom-not-selected')
            }
        } else {
            classes.push('header')
        }
        if (isElementSelected()) {
            classes.push("selected")
        }
        if (isWide()) {
            classes.push("wide-element")
        }
        return classes.join(" ");
    }

    function getHeaderButtons() {
        const parent = props.parent;
        const inRouteConfiguration = parent !== undefined && parent.dslName === 'RouteConfigurationDefinition';
        const showAddButton = !['CatchDefinition', 'RouteTemplateDefinition', 'RouteDefinition'].includes(step.dslName) && availableModels.length > 0;
        const showInsertButton =
            !['FromDefinition', 'RouteConfigurationDefinition', 'RouteTemplateDefinition', 'RouteDefinition', 'CatchDefinition', 'FinallyDefinition', 'WhenDefinition', 'OtherwiseDefinition'].includes(step.dslName)
            && !inRouteConfiguration;
        const showDeleteButton = !('RouteDefinition' === step.dslName && 'RouteTemplateDefinition' === parent?.dslName);
        const showCopyButton = !['FromDefinition', 'RouteConfigurationDefinition', 'RouteTemplateDefinition', 'RouteDefinition', 'CatchDefinition', 'FinallyDefinition', 'WhenDefinition', 'OtherwiseDefinition'].includes(step.dslName)
        const showDisableButton = Object.getOwnPropertyNames(step).includes('disabled')
        return (
            <>
                {!isDebugging && showInsertButton && getInsertElementButton()}
                {!isDebugging && showDeleteButton && getDeleteButton()}
                {!isDebugging && showAddButton && getAddElementButton()}
                {!isDebugging && showCopyButton && getCopyElementButton()}
                {!isDebugging && showDisableButton && getDisableStepButton()}
            </>
        )
    }

    function getHeader() {
        const headerClasses = getHeaderClasses();
        const childrenInfo = getChildrenInfo(step);
        const hasWideChildrenElement = childrenInfo ? getHasWideChildrenElement(childrenInfo) : false;
        const isRoute = "RouteDefinition" === step.dslName;
        const isFrom = "FromDefinition" === step.dslName;
        return (
            <div className={"dsl-element " + headerClasses} style={getHeaderStyle()} ref={mergedRef}>
                {!['RouteConfigurationDefinition', 'RouteTemplateDefinition', 'RouteDefinition'].includes(step.dslName) &&
                    <div
                        className={getHeaderIconClasses()}
                        style={isWide() ? {width: ""} : {}}>
                        {CamelUi.getIconForElement(step)}
                    </div>
                }
                {'RouteDefinition' === step.dslName &&
                    <div className={"route-icons"}>
                        {(step as any).autoStartup === false && <AutoStartupFalseIcon/>}
                        {(step as any).errorHandler !== undefined && <ErrorHandlerIcon/>}
                    </div>
                }
                {'RouteDefinition' === step.dslName && getAutoStartupButton()}

                {'RouteConfigurationDefinition' === step.dslName &&
                    <div className={"route-icons"}>
                        {(step as any).errorHandler !== undefined && <ErrorHandlerIcon/>}
                    </div>
                }
                {'RouteTemplateDefinition' === step.dslName &&
                    <div style={{height: '10px'}}></div>
                }
                <div className={hasWideChildrenElement ? "header-text" : ""}>
                    {hasWideChildrenElement && <div className="spacer"/>}
                    {getHeaderTextWithTooltip(step, hasWideChildrenElement)}
                </div>
                {!isRoute && !isMasGenerated && getHeaderButtons()}
                {isRoute && getHeaderButtons()}
            </div>
        )
    }

    function getHeaderText(step: CamelElement): string {
        if (isKamelet() && step.dslName === 'ToDefinition' && (step as any).uri === 'kamelet:sink') {
            return "Sink";
        } else if (isKamelet() && step.dslName === 'FromDefinition' && (step as any).uri === 'kamelet:source') {
            return "Source";
        } else {
            const description: string = (step as any).description;
            if (description === undefined && step.dslName.startsWith('Set')) {
                const name = (step as any).name || '';
                const result = CamelUi.getElementTitle(step).concat(' ', name);
                return result.length > 32 ? result.substring(0, 32).concat("...") : result;
            } else if (description === undefined && step.dslName.startsWith('Convert')) {
                const type = (step as any).type || '';
                const result = CamelUi.getElementTitle(step).concat(' ', type);
                return result.length > 32 ? result.substring(0, 32).concat("...") : result;
            } else {
                const result = description !== undefined && description?.length > 32 ? description.substring(0, 32).concat("...") : description;
                return result || CamelUi.getElementTitle(step);
            }
        }
    }

    function getHeaderTextWithTooltip(step: CamelElement, hasWideChildrenElement: boolean) {
        const title = getHeaderText(step);
        const checkRequired = CamelUtil.checkRequired(step);
        if (CamelDefinitionApiExt.hasElementWithId(integration, (step as any).id) > 1) {
            checkRequired[0] = false;
            checkRequired[1].push('Id should be unique');
        }
        let className = hasWideChildrenElement ? "text text-right" : "text text-bottom";
        className = className.concat((step as any)?.disabled ? " disabled " : "")
        className = className.concat((parent as any)?.disabled ? " disabled " : "")
        if (!checkRequired[0]) className = className + " header-text-required";
        if (checkRequired[0]) {
            return <Content component="p" style={{marginTop: (step.dslName === 'ChoiceDefinition' ? '-5px' : 'inherit')}} className={className}>{title}</Content>
        } else return (
            <Tooltip position={"right"} className="tooltip-required-field"
                     content={checkRequired[1].map((text, i) => (<div key={i}>{text}</div>))}>
                <Content component="p" className={className}>{title}</Content>
            </Tooltip>
        )
    }

    function getHeaderWithTooltip(tooltip: string | ReactElement | undefined) {
        return (
            <>
                {getHeader()}
                <Tooltip triggerRef={localHeaderRef} entryDelay={700} position={"left"} content={<div style={{textAlign: 'left'}}>{tooltip}</div>}/>
            </>

        )
    }

    function getHeaderTooltip(): string | ReactElement | undefined {
        if (CamelUi.isShowUriTooltip(step)) return  CamelUi.getUriTooltip(step);
        return undefined;
    }


    function getAddElementButton() {
        return (
            <Tooltip position={"bottom"} content={<div>{"Add DSL element to " + CamelDisplayUtil.getTitle(step)}</div>}>
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
    function getCopyElementButton() {
        return (
            <Tooltip position={"left"} content={"Copy element"}>
                <button
                    type="button"
                    aria-label="Copy"
                    onClick={e => {
                        e.stopPropagation();
                        if (props.parent) {
                            copyPasteStep(step, props.parent?.uuid, props.position)
                        }
                    }}
                    className={"copy-element-button"}>
                    <CopyElementIcon/>
                </button>
            </Tooltip>
        )
    }

    function getDisableStepButton() {
        return (
            <Tooltip position={"right"} content={disabled ? "Enable" : "Disable"}>
                <button
                    type="button"
                    aria-label="Disable"
                    onClick={e => {
                        e.stopPropagation();
                        onDisableStep(step, !disabled)
                    }}
                    className={"disable-step-button"}>
                    {disabled ? <EnableStepIcon/> : <DisableStepIcon/>}
                </button>
            </Tooltip>
        )
    }

    function getAutoStartupButton() {
        return (
            <Tooltip position={"right"} content={autoStartup ? "Disable" : "Enable"}>
                <button
                    type="button"
                    aria-label="AutoStartup"
                    onClick={e => {
                        e.stopPropagation();
                        onAutoStartRoute(step, !autoStartup)
                    }}
                    className={"auto-startup-button"}>
                    {autoStartup ? <DisableStepIcon/> : <EnableStepIcon/>}
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
            <button type="button" aria-label="Delete" onClick={e => onDeleteElement(e)} className="delete-button">
                <DeleteElementIcon/>
            </button>
        )
    }

    const tooltip = getHeaderTooltip();
    if (tooltip !== undefined && !props.isDragging && !isDebugging) {
        return getHeaderWithTooltip(tooltip);
    }
    return getHeader();
}

export default DslElementHeader
