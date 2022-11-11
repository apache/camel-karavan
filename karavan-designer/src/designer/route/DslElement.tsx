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
import React, {CSSProperties} from 'react';
import {
    Button,
    Flex,
    Modal, ModalVariant,
    Text, Tooltip,
} from '@patternfly/react-core';
import '../karavan.css';
import AddIcon from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-circle-icon";
import InsertIcon from "@patternfly/react-icons/dist/js/icons/arrow-alt-circle-right-icon";
import CheckCircleIcon from "@patternfly/react-icons/dist/js/icons/check-circle-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/js/icons/exclamation-circle-icon";
import {CamelElement, Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelUi} from "../utils/CamelUi";
import {EventBus} from "../utils/EventBus";
import {ChildElement, CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import ReactDOM from "react-dom";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {CamelDisplayUtil} from "karavan-core/lib/api/CamelDisplayUtil";
import { ComponentProperty } from 'karavan-core/lib/model/ComponentModels';
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";

interface Props {
    integration: Integration,
    step: CamelElement,
    parent: CamelElement | undefined,
    deleteElement: any
    selectElement: any
    openSelector: (parentId: string | undefined, parentDsl: string | undefined, showSteps: boolean, position?: number | undefined) => void
    moveElement: (source: string, target: string, asChild: boolean) => void
    selectedUuid: string
    inSteps: boolean
    position: number
}

interface State {
    showSelector: boolean
    showMoveConfirmation: boolean
    moveElements: [string | undefined, string | undefined]
    tabIndex: string | number
    selectedUuid: string
    isDragging: boolean
    isDraggedOver: boolean
}

export class DslElement extends React.Component<Props, State> {

    public state: State = {
        showSelector: false,
        showMoveConfirmation: false,
        moveElements: [undefined, undefined],
        tabIndex: 0,
        selectedUuid: this.props.selectedUuid,
        isDragging: false,
        isDraggedOver: false
    };

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevState.selectedUuid !== this.props.selectedUuid) {
            this.setState({selectedUuid: this.props.selectedUuid});
        }
    }

    openSelector = (evt: React.MouseEvent, showSteps: boolean = true, isInsert: boolean = false) => {
        evt.stopPropagation();
        if (isInsert && this.props.parent) {
            this.props.openSelector.call(this, this.props.parent.uuid, this.props.parent.dslName, showSteps, this.props.position);
        } else {
            this.props.openSelector.call(this, this.props.step.uuid, this.props.step.dslName, showSteps);
        }
    }

    closeDslSelector = () => {
        this.setState({showSelector: false})
    }

    delete = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        this.props.deleteElement.call(this, this.props.step.uuid);
    }

    selectElement = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        this.props.selectElement.call(this, this.props.step);
    }

    dragElement = (event: React.DragEvent<HTMLDivElement>, element: CamelElement) => {
        event.preventDefault();
        event.stopPropagation();
        this.setState({isDraggedOver: false});
        const sourceUuid = event.dataTransfer.getData("text/plain");
        const targetUuid = element.uuid;
        if (sourceUuid !== targetUuid) {
            if (element.hasSteps()){
                this.setState({showMoveConfirmation: true, moveElements: [sourceUuid, targetUuid]});
            } else {
                this.props.moveElement?.call(this, sourceUuid, targetUuid, false);
            }
        }
    }

    confirmMove = (asChild: boolean) => {
        const sourceUuid = this.state.moveElements[0];
        const targetUuid = this.state.moveElements[1];
        if (sourceUuid && targetUuid && sourceUuid !== targetUuid) {
            this.props.moveElement?.call(this, sourceUuid, targetUuid, asChild);
            this.setState({showMoveConfirmation: false, moveElements: [undefined, undefined]})
        }
    }

    cancelMove = () => {
        this.setState({showMoveConfirmation: false, moveElements: [undefined, undefined]})
    }

    isSelected = (): boolean => {
        return this.state.selectedUuid === this.props.step.uuid
    }

    hasBorder = (): boolean => {
        return (this.props.step?.hasSteps() && !['FromDefinition'].includes(this.props.step.dslName))
            || ['RouteDefinition', 'TryDefinition', 'ChoiceDefinition', 'SwitchDefinition'].includes(this.props.step.dslName);
    }

    isNotDraggable = (): boolean => {
        return ['FromDefinition', 'RouteDefinition', 'WhenDefinition', 'OtherwiseDefinition'].includes(this.props.step.dslName);
    }

    isWide = (): boolean => {
        return ['RouteDefinition', 'ChoiceDefinition', 'SwitchDefinition', 'MulticastDefinition', 'TryDefinition', 'CircuitBreakerDefinition']
            .includes(this.props.step.dslName);
    }

    isAddStepButtonLeft = (): boolean => {
        return ['MulticastDefinition']
            .includes(this.props.step.dslName);
    }

    isHorizontal = (): boolean => {
        return ['MulticastDefinition'].includes(this.props.step.dslName);
    }

    isRoot = (): boolean => {
        return this.props.step?.dslName?.startsWith("RouteDefinition");
    }

    isInStepWithChildren = () => {
        const step: CamelElement = this.props.step;
        const children = CamelDefinitionApiExt.getElementChildrenDefinition(step.dslName);
        return children.filter((c: ChildElement) => c.name === 'steps' || c.multiple).length > 0 && this.props.inSteps;
    }

    getChildrenInfo = (step: CamelElement): [boolean, number, boolean, number, number] => {
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

    hasWideChildrenElement = () => {
        const [hasStepsField, stepsChildrenCount, hasNonStepsFields, nonStepChildrenCount, childrenCount] = this.getChildrenInfo(this.props.step);
        if (this.isHorizontal() && stepsChildrenCount > 1) return true;
        else if (hasStepsField && stepsChildrenCount > 0 && hasNonStepsFields && nonStepChildrenCount > 0) return true;
        else if (!hasStepsField && hasNonStepsFields && childrenCount > 1) return true;
        else if (hasStepsField && stepsChildrenCount > 0 && hasNonStepsFields && childrenCount > 1) return true;
        else return false;
    }

    hasBorderOverSteps = (step: CamelElement) => {
        const [hasStepsField, stepsChildrenCount, hasNonStepsFields, nonStepChildrenCount] = this.getChildrenInfo(step);
        if (hasStepsField && stepsChildrenCount > 0 && hasNonStepsFields && nonStepChildrenCount > 0) return true;
        else return false;
    }

    getHeaderStyle = () => {
        const style: CSSProperties = {
            width: this.isWide() ? "100%" : "",
            fontWeight: this.isSelected() ? "bold" : "normal"
        };
        return style;
    }

    sendPosition = (el: HTMLDivElement | null, isSelected: boolean) => {
        const node = ReactDOM.findDOMNode(this);
        if (node && el) {
            const header = Array.from(node.childNodes.values()).filter((n: any) => n.classList.contains("header"))[0];
            if (header) {
                const headerIcon: any = Array.from(header.childNodes.values()).filter((n: any) => n.classList.contains("header-icon"))[0];
                const headerRect = headerIcon.getBoundingClientRect();
                const rect = el.getBoundingClientRect();
                if (this.props.step.show){
                    EventBus.sendPosition("add", this.props.step, this.props.parent, rect, headerRect, this.props.position, this.props.inSteps, isSelected);
                } else {
                    EventBus.sendPosition("delete", this.props.step, this.props.parent, new DOMRect(), new DOMRect(), 0);
                }
            }
        }
    }

    hasUnFilledRequiredProperties()
    {
        let hasUnFilledRequiredProperties: boolean  = false;
        if(this.props.step.dslName === 'RouteDefinition')
            return true;
        if( CamelUtil.isKameletComponent(this.props.step)){
            let kameletRequiredProperties : string[] = [];
            kameletRequiredProperties = CamelUtil.getKameletRequiredParameters(this.props.step);
            const step = this.props.step as any
            hasUnFilledRequiredProperties = kameletRequiredProperties.every(parameterName => {
                return step.parameters.hasOwnProperty(parameterName) && step.parameters[parameterName] !== ''? true: false;
            })
            return hasUnFilledRequiredProperties
        }else if(this.props.step?.dslName === 'FromDefinition' || this.props.step?.dslName === 'ToDefinition'){
            const componentRequiredParameters : ComponentProperty[] = CamelUtil.getComponentProperties(this.props.step).filter(property => property.required === true && property.kind==='parameter');
            const componentRequiredPathParameters : ComponentProperty[] = CamelUtil.getComponentProperties(this.props.step).filter(property => property.required === true && property.kind==='path');
            const step = this.props.step as any
            hasUnFilledRequiredProperties = componentRequiredParameters.every(parameter => step.hasOwnProperty(parameter.name) ? true: false)
            const uriParts = ComponentApi.getUriParts(step.uri);
            return hasUnFilledRequiredProperties && (componentRequiredPathParameters.every(path => uriParts.has(path.name) && uriParts.get(path.name)!==''))
        }
        else{
            const elementProperties = CamelDefinitionApiExt.getElementProperties(this.props.step?.dslName).filter(property => property.required === true).map( property => property.name);
            hasUnFilledRequiredProperties = elementProperties.every(parameterName => {
                if(parameterName === 'expression')
                {
                    return CamelDefinitionApiExt.getExpressionValue((this.props.step as any).expression) === undefined || (CamelDefinitionApiExt.getExpressionValue((this.props.step as any).expression) as any).expression === '' ? false : true;
                }
                else
                    return this.props.step.hasOwnProperty(parameterName) && (this.props.step as any)[parameterName] !== '' ? true: false;
            })
            return hasUnFilledRequiredProperties;
        }
    }

    getHeader = () => {
        const step: CamelElement = this.props.step;
        const availableModels = CamelUi.getSelectorModelsForParent(step.dslName, false);
        const showAddButton = !['CatchDefinition', 'RouteDefinition'].includes(step.dslName) && availableModels.length > 0;
        const showInsertButton = !['FromDefinition', 'RouteDefinition', 'CatchDefinition', 'FinallyDefinition', 'WhenDefinition', 'OtherwiseDefinition'].includes(step.dslName);
        const headerClass = step.dslName === 'RouteDefinition' ? "header-route" : "header"
        const headerClasses = this.isSelected() ? headerClass + " selected" : headerClass;
        const isRequiredProperty = this.hasUnFilledRequiredProperties();
        return (
            <div className={headerClasses} style={this.getHeaderStyle()}>
                {this.props.step.dslName !== 'RouteDefinition' &&
                    <div ref={el => this.sendPosition(el, this.isSelected())}
                         className={"header-icon"}
                         style={this.isWide() ? {width: ""} : {}}>
                        {CamelUi.getIconForElement(step)}
                    </div>
                }
                <div className={this.hasWideChildrenElement() ? "header-text" : ""}>
                    {this.hasWideChildrenElement() && <div className="spacer"/>}
                    {this.getHeaderTextWithTooltip(step)}
                </div>
                {showInsertButton && this.getInsertElementButton()}
                {this.getDeleteButton()}
                {showAddButton && this.getAddElementButton()}
                {this.getDslElementReadyIcon(isRequiredProperty)}
            </div>
        )
    }

    getHeaderTextWithTooltip = (step: CamelElement) => {
        const checkRequired = CamelUtil.checkRequired(step);
        const title = (step as any).description ? (step as any).description : CamelUi.getElementTitle(this.props.step);
        let className = this.hasWideChildrenElement() ? "text text-right" : "text text-bottom";
        if (!checkRequired[0]) className = className + " header-text-required";
        if (checkRequired[0]) return <Text className={className}>{title}</Text>
        else return (
            <Tooltip position={"right"} className="tooltip-required-field"
                     content={checkRequired[1].map((text, i) =>(<div key={i}>{text}</div>))}>
                <Text className={className}>{title}</Text>
            </Tooltip>
        )
    }

    getHeaderWithTooltip = (tooltip: string | undefined) => {
        return (
            <Tooltip position={"left"}
                     content={<div>{tooltip}</div>}>
                {this.getHeader()}
            </Tooltip>
        )
    }

    getHeaderTooltip = (): string | undefined => {
        if (CamelUi.isShowExpressionTooltip(this.props.step)) return CamelUi.getExpressionTooltip(this.props.step);
        if (CamelUi.isShowUriTooltip(this.props.step)) return CamelUi.getUriTooltip(this.props.step);
        return undefined;
    }

    getElementHeader = () => {
        const tooltip = this.getHeaderTooltip();
        if (tooltip !== undefined && !this.state.isDragging) {
            return this.getHeaderWithTooltip(tooltip);
        }
        return this.getHeader();
    }

    getChildrenStyle = () => {
        const style: CSSProperties = {
            display: "flex",
            flexDirection: "row",
        }
        return style;
    }

    getChildrenElementsStyle = (child: ChildElement, notOnlySteps: boolean) => {
        const step = this.props.step;
        const isBorder = child.name === 'steps' && this.hasBorderOverSteps(step);
        const style: CSSProperties = {
            borderStyle: isBorder ? "dotted" : "none",
            borderColor: "var(--step-border-color)",
            borderWidth: "1px",
            borderRadius: "16px",
            display: this.isHorizontal() || child.name !== 'steps' ? "flex" : "block",
            flexDirection: "row",
        }
        return style;
    }

    getChildElements = () => {
        const step: CamelElement = this.props.step;
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
            <div key={step.uuid + "-children"} className="children" style={this.getChildrenStyle()}>
                {children.map((child: ChildElement, index: number) => this.getChildDslElements(child, index, notOnlySteps))}
            </div>
        )
    }

    getChildDslElements = (child: ChildElement, index: number, notOnlySteps: boolean) => {
        const step = this.props.step;
        const children: CamelElement[] = CamelDefinitionApiExt.getElementChildren(step, child);
        if (children.length > 0) {
            return (
                <div className={child.name + " has-child"} style={this.getChildrenElementsStyle(child, notOnlySteps)} key={step.uuid + "-child-" + index}>
                    {children.map((element, index) => (
                        <div key={step.uuid + child.className + index}>
                            <DslElement
                                integration={this.props.integration}
                                openSelector={this.props.openSelector}
                                deleteElement={this.props.deleteElement}
                                selectElement={this.props.selectElement}
                                moveElement={this.props.moveElement}
                                selectedUuid={this.state.selectedUuid}
                                inSteps={child.name === 'steps'}
                                position={index}
                                step={element}
                                parent={step}/>
                        </div>
                    ))}
                    {child.name === 'steps' && this.getAddStepButton()}
                </div>
            )
        } else if (child.name === 'steps') {
            return (
                <div className={child.name + " has-child"} style={this.getChildrenElementsStyle(child, notOnlySteps)} key={step.uuid + "-child-" + index}>
                    {this.getAddStepButton()}
                </div>
            )
        }
    }

    getAddStepButton() {
        const {integration, step, selectedUuid} = this.props;
        const hideAddButton = step.dslName === 'StepDefinition' && !CamelDisplayUtil.isStepDefinitionExpanded(integration, step.uuid, selectedUuid);
        if (hideAddButton) return (<></>)
        else return (
            <Tooltip position={"bottom"}
                     content={<div>{"Add step to " + CamelUi.getTitle(step)}</div>}>
                <button type="button" aria-label="Add" onClick={e => this.openSelector(e)}
                        className={this.isAddStepButtonLeft() ? "add-button add-button-left" : "add-button add-button-bottom"}>
                    <AddIcon noVerticalAlign/>
                </button>
            </Tooltip>
        )
    }

    getAddElementButton() {
        return (
            <Tooltip position={"bottom"} content={<div>{"Add DSL element to " + CamelUi.getTitle(this.props.step)}</div>}>
                <button
                    type="button"
                    aria-label="Add"
                    onClick={e => this.openSelector(e, false)}
                    className={"add-element-button"}>
                    <AddIcon noVerticalAlign/>
                </button>
            </Tooltip>
        )
    }

    getDslElementReadyIcon(isReady:boolean) {
        return (
            <>
            {
                isReady && <Tooltip position={"right"} content={<div>{"Required setup completed for DSL element " + CamelUi.getTitle(this.props.step)}</div>}>
                       <div className={"add-ready-checkicon"}>
                       <CheckCircleIcon noVerticalAlign/>
                    </div>
                </Tooltip>
                
             }
             {
                !isReady && <Tooltip position={"right"} content={<div>{"Required properties not set for DSL element " + CamelUi.getTitle(this.props.step)}</div>}>
                     <div className={"add-ready-exclamationicon"}>
                        <ExclamationCircleIcon noVerticalAlign/>
                    </div>
                </Tooltip>
             }
            </> 
        )
    }

    getInsertElementButton() {
        return (
            <Tooltip position={"left"} content={<div>{"Insert element before"}</div>}>
                <button type="button" aria-label="Insert" onClick={e => this.openSelector(e, true, true)} className={"insert-element-button"}><InsertIcon noVerticalAlign/>
                </button>
            </Tooltip>
        )
    }

    getDeleteButton() {
        return (
            <Tooltip position={"right"} content={<div>{"Delete element"}</div>}>
                <button type="button" aria-label="Delete" onClick={e => this.delete(e)} className="delete-button"><DeleteIcon noVerticalAlign/></button>
            </Tooltip>
        )
    }

    getMoveConfirmation() {
        return (
            <Modal
                aria-label="title"
                className='move-modal'
                isOpen={this.state.showMoveConfirmation}
                variant={ModalVariant.small}
            ><Flex direction={{default: "column"}}>
                <div>Select move type:</div>
                <Button key="place" variant="primary" onClick={event => this.confirmMove(false)}>Shift (target down)</Button>
                <Button key="child" variant="secondary" onClick={event => this.confirmMove(true)}>Move as target step</Button>
                <Button key="cancel" variant="tertiary" onClick={event => this.cancelMove()}>Cancel</Button>
            </Flex>

            </Modal>
        )
    }

    render() {
        const element: CamelElement = this.props.step;
        const className = "step-element" + (this.isSelected() ? " step-element-selected" : "")
            + (!this.props.step.show ? " hidden-step" : "");
        return (
            <div key={"root" + element.uuid}
                 className={className}
                 ref={el => this.sendPosition(el, this.isSelected())}
                 style={{
                     borderStyle: this.hasBorder() ? "dotted" : "none",
                     borderColor: this.isSelected() ? "var(--step-border-color-selected)" : "var(--step-border-color)",
                     marginTop: this.isInStepWithChildren() ? "16px" : "8px",
                     zIndex: element.dslName === 'ToDefinition' ? 20 : 10,
                     boxShadow: this.state.isDraggedOver ? "0px 0px 1px 2px var(--step-border-color-selected)" : "none",
                 }}
                 onMouseOver={event => event.stopPropagation()}
                 onClick={event => this.selectElement(event)}
                 onDragStart={event => {
                     event.stopPropagation();
                     event.dataTransfer.setData("text/plain", element.uuid);
                     (event.target as any).style.opacity = .5;
                     this.setState({isDragging: true});
                 }}
                 onDragEnd={event => {
                     (event.target as any).style.opacity = '';
                     this.setState({isDragging: false});
                 }}
                 onDragOver={event => {
                     event.preventDefault();
                     event.stopPropagation();
                     if (element.dslName !== 'FromDefinition' && !this.state.isDragging) {
                         this.setState({isDraggedOver: true});
                     }
                 }}
                 onDragEnter={event => {
                     event.preventDefault();
                     event.stopPropagation();
                     if (element.dslName !== 'FromDefinition') {
                         this.setState({isDraggedOver: true});
                     }
                 }}
                 onDragLeave={event => {
                     event.preventDefault();
                     event.stopPropagation();
                     this.setState({isDraggedOver: false});

                 }}
                 onDrop={event => this.dragElement(event, element)}
                 draggable={!this.isNotDraggable()}
            >
                {this.getElementHeader()}
                {this.getChildElements()}
                {this.getMoveConfirmation()}
            </div>
        )
    }
}
