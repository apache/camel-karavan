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
    Text, Tooltip,
} from '@patternfly/react-core';
import './karavan.css';
import AddIcon from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import {CamelElement} from "karavan-core/lib/model/CamelDefinition";
import {CamelUi} from "karavan-core/lib/api/CamelUi";
import {EventBus} from "karavan-core/lib/api/EventBus";
import {ChildElement, CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";

interface Props {
    step: CamelElement,
    deleteElement: any
    selectElement: any
    openSelector: (parentId: string | undefined, parentDsl: string | undefined, showSteps: boolean) => void
    moveElement: (source: string, target: string) => void
    selectedUuid: string
    borderColor: string
    borderColorSelected: string
}

interface State {
    step: CamelElement,
    showSelector: boolean
    tabIndex: string | number
    selectedUuid: string
    isDragging: boolean
    isDraggedOver: boolean
}

export class DslElement extends React.Component<Props, State> {

    public state: State = {
        step: this.props.step,
        showSelector: false,
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

    openSelector = (evt: React.MouseEvent, showSteps: boolean = true) => {
        evt.stopPropagation();
        this.props.openSelector.call(this, this.state.step.uuid, this.state.step.dslName, showSteps);
    }

    closeDslSelector = () => {
        this.setState({showSelector: false})
    }

    delete = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        this.props.deleteElement.call(this, this.state.step.uuid);
    }

    selectElement = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        this.props.selectElement.call(this, this.state.step);
    }

    isSelected = (): boolean => {
        return this.state.selectedUuid === this.state.step.uuid
    }

    hasBorder = ():boolean => {
        return (this.state?.step?.hasSteps() &&  !['FromDefinition'].includes(this.state.step.dslName))
            ||  ['RouteDefinition', 'TryDefinition', 'ChoiceDefinition'].includes(this.state.step.dslName);
    }

    isDraggable = (): boolean => {
        return ['FromDefinition', 'RouteDefinition', 'WhenDefinition', 'OtherwiseDefinition'].includes(this.state.step.dslName);
    }

    isWide = (): boolean => {
        return ['RouteDefinition', 'ChoiceDefinition', 'MulticastDefinition', 'TryDefinition', 'CircuitBreakerDefinition']
            .includes(this.state.step.dslName);
    }

    isHorizontal = (): boolean => {
        return ['MulticastDefinition'].includes(this.state.step.dslName);
    }

    needMarginLeft = (): boolean => {
        return ['CatchDefinition', "WhenDefinition"].includes(this.state.step.dslName);
    }

    isRoot = (): boolean => {
        return this.state.step?.dslName?.startsWith("RouteDefinition");
    }

    getArrow = () => {
        return (
            <svg className={"arrow-down"} viewBox="0 0 483.284 483.284" width="16" height="16"
                 preserveAspectRatio="none">
                <polygon fill={"currentColor"}
                         points="347.5,320.858 261.888,406.469 261.888,0 221.888,0 221.888,406.962 135.784,320.858   107.5,349.142 241.642,483.284 375.784,349.142 "/>
            </svg>
        )
    }

    getHeaderStyle = () => {
        const style: CSSProperties = {
            width: this.isWide() ? "100%" : "",
            fontWeight: this.isSelected() ? "bold" : "normal",
        };
        return style;
    }

    getHeader = () => {
        const step: CamelElement = this.state.step;
        const availableModels = CamelUi.getSelectorModelsForParent(step.dslName, false);
        const showAddButton = !['CatchDefinition', 'RouteDefinition'].includes(step.dslName) && availableModels.length > 0;
        return (
            <div className={step.dslName === 'RouteDefinition' ? "header-route" : "header" }
                 style={this.getHeaderStyle()}
                 ref={el => {
                     if (el && (this.state.step.dslName === 'FromDefinition'
                         || this.state.step.dslName === 'ToDefinition'
                         || this.state.step.dslName === 'KameletDefinition'))
                         EventBus.sendPosition(this.state.step, el.getBoundingClientRect());
                 }}>
                {this.state.step.dslName !== 'RouteDefinition' &&
                    <div className={"header-icon"} style={this.isWide() ? {border: "none"}: {}}>
                        <img draggable={false} src={CamelUi.getIcon(this.state.step)} className="icon" alt="icon"/>
                    </div>
                }
                <Text>{CamelUi.getTitle(this.state.step)}</Text>
                {this.state.step.dslName !== 'FromDefinition' && <button type="button" aria-label="Delete" onClick={e => this.delete(e)} className="delete-button"><DeleteIcon noVerticalAlign/></button>}
                {showAddButton && this.getAddElementButton()}
            </div>
        );
    }

    getHeaderWithTooltip = (tooltip: string | undefined) => {
        return (
            <Tooltip position={"auto"}
                     content={<div>{tooltip}</div>}>
                {this.getHeader()}
            </Tooltip>
        );
    }

    getHeaderTooltip = (): string | undefined => {
        if (CamelUi.isShowExpressionTooltip(this.state.step)) return CamelUi.getExpressionTooltip(this.state.step);
        if (CamelUi.isShowUriTooltip(this.state.step)) return CamelUi.getUriTooltip(this.state.step);
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
        };
        return style;
    }

    getChildrenElementsStyle = (child:ChildElement, onlySteps: boolean) => {
        const step = this.state.step;
        const children: CamelElement[] = CamelDefinitionApiExt.getElementChildren(step, child);
        const isBorder = child.name === 'steps' && children.length > 0 && !onlySteps;
        const isMarginLeft = (child.name === 'steps' && !onlySteps);
        const style: CSSProperties = {
            borderStyle: isBorder ? "dotted" : "none",
            borderColor:  this.props.borderColor,
            borderWidth: "1px",
            borderRadius: "3px",
            padding: isBorder ? "6px" : "none",
            marginLeft: isMarginLeft ? "3px" : "none",
            display: this.isHorizontal() || child.name !== 'steps' ? "flex" : "block",
            flexDirection: "row",
        };
        return style;
    }

    getChildStyle = (index: number, count: number) => {
        const style: CSSProperties = this.isHorizontal()
            ? {marginRight: (index < count - 1) ? "6px" : "0"}
            : {}
        return style;
    }

    showUpArrow = (child:ChildElement, count: number, index: number) => {
        const step = this.state.step;
        const children = CamelDefinitionApiExt.getElementChildrenDefinition(step.dslName);
        if (this.state.step.dslName === "RouteDefinition"){
            return false;
        } else {
            return (child.name === 'steps' && count > 0 && index !== 0)
                || (child.name === 'steps' && count > 0 && index === 0 && children.length === 1)
                || (child.name !== 'steps' && count > 0 );
        }
    }

    showStepsArrow = (child: ChildElement) => {
        const step: CamelElement = this.state.step;
        const children = CamelDefinitionApiExt.getElementChildrenDefinition(step.dslName);
        return child.name === 'steps' && children.length > 1;
    }

    getChildElements = () => {
        const step: CamelElement = this.state.step;
        let children = CamelDefinitionApiExt.getElementChildrenDefinition(step.dslName);
        const onlySteps = children.length === 1 && children[0].name === "steps";

        if (step.dslName !== 'RouteDefinition') {
            children = children.filter(child => {
                const cc = CamelDefinitionApiExt.getElementChildrenDefinition(child.className);
                return child.name === 'steps' || cc.filter(c => c.multiple).length > 0;
            })
        }
        if (step.dslName === 'CatchDefinition'){ // exception
            children = children.filter(value => value.name !== 'onWhen')
        }
        return (
            <div key={step.uuid + "-children"} className="children" style={this.getChildrenStyle()}>
                {children.map((child:ChildElement, index:number) => this.getChildDslElements(child, index, onlySteps))}
            </div>
        )
    }

    getChildDslElements = (child:ChildElement, index: number,  onlySteps: boolean) => {
        const step = this.state.step;
        const children: CamelElement[] = CamelDefinitionApiExt.getElementChildren(step, child);
        return (
            <div className={child.name} key={step.uuid+"-child-"+index}>
                {this.showStepsArrow(child) && this.getArrow()}
                <div style={this.getChildrenElementsStyle(child, onlySteps)}>
                    {children.map((element, index) => (
                        <div key={step.uuid + child.className +  index} style={this.getChildStyle(index, children.length)}>
                            {this.showUpArrow(child, children.length, index) && this.getArrow() }
                            <DslElement
                                openSelector={this.props.openSelector}
                                deleteElement={this.props.deleteElement}
                                selectElement={this.props.selectElement}
                                moveElement={this.props.moveElement}
                                selectedUuid={this.state.selectedUuid}
                                borderColor={this.props.borderColor}
                                borderColorSelected={this.props.borderColorSelected}
                                step={element}/>
                        </div>
                    ))}
                </div>
                {child.name === 'steps' && this.getAddStepButton()}
            </div>
        )
    }

    getAddStepButton() {
        return (
            <Tooltip position={"bottom"}
                     content={<div>{"Add step to " + CamelUi.getTitle(this.state.step)}</div>}>
                <button type="button" aria-label="Add" onClick={e => this.openSelector(e)}
                        className={"add-button"}>
                    <AddIcon noVerticalAlign/>
                </button>
            </Tooltip>
        )
    }

    getAddElementButton() {
        return (
            <Tooltip position={"bottom"} content={<div>{"Add DSL element to " + CamelUi.getTitle(this.state.step)}</div>}>
                <button type="button" aria-label="Add" onClick={e => this.openSelector(e, false)} className={"add-element-button"}><AddIcon noVerticalAlign/>
                </button>
            </Tooltip>
        )
    }

    render() {
        const element: CamelElement = this.state.step;
        return (
            <div key={"root"+element.uuid} className={
                this.hasBorder()
                    ? "step-element step-element-with-steps"
                    : "step-element step-element-without-steps"}
                 style={{
                     borderStyle: this.isSelected() ? "dashed" : (this.hasBorder() ? "dotted" : "none"),
                     borderColor: this.isSelected() ? this.props.borderColorSelected : this.props.borderColor,
                     marginTop: this.isRoot() ? "16px" : "",
                     marginLeft: this.needMarginLeft() ? "3px" : "",
                     zIndex: element.dslName === 'ToDefinition' ? 20 : 10,
                     boxShadow: this.state.isDraggedOver ? "0px 0px 1px 2px " + this.props.borderColorSelected : "none",
                 }}
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
                 onDrop={event => {
                     event.preventDefault();
                     event.stopPropagation();
                     this.setState({isDraggedOver: false});
                     const sourceUuid = event.dataTransfer.getData("text/plain");
                     const targetUuid = element.uuid;
                     if (sourceUuid !== targetUuid) {
                         this.props.moveElement?.call(this, sourceUuid, targetUuid);
                     }
                 }}
                 draggable={!this.isDraggable()}
            >
                {this.getElementHeader()}
                {this.getChildElements()}
            </div>
        );
    }
}
