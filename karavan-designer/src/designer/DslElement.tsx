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
import React from 'react';
import {
    Text, Tooltip,
} from '@patternfly/react-core';
import './karavan.css';
import AddIcon from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import {CamelElement, Otherwise, When} from "karavan-core/lib/model/CamelModel";
import {CamelUi} from "karavan-core/lib/api/CamelUi";
import {EventBus} from "karavan-core/lib/api/EventBus";

interface Props {
    step: CamelElement,
    deleteElement: any
    selectElement: any
    openSelector: any
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

    openSelector = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        this.props.openSelector.call(this, this.state.step.uuid, this.state.step.dslName);
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

    getSteps = (): CamelElement[] => {
        return (this.state.step as any).steps
    }

    hasSteps = (): boolean => {
        const steps = this.getSteps();
        return steps !== undefined && steps.length > 0;
    }

    getWhens = (): When[] => {
        return (this.state.step as any).when
    }

    getOtherwise = (): Otherwise => {
        return (this.state.step as any).otherwise
    }

    horizontal = (): boolean => {
        return ['choice', 'multicast'].includes(this.state.step.dslName);
    }

    isRoot = (): boolean => {
        return this.state.step.dslName.startsWith("from");
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

    getHeader = () => {
        return (
            <div className="header"
                 style={
                     ["choice", "multicast"].includes(this.state.step.dslName)
                         ? {width: "100%", fontWeight: this.isSelected() ? "bold" : "normal"}
                         : {fontWeight: this.isSelected() ? "bold" : "normal"}
                 }
                 ref={el => {
                     if (el && (this.state.step.dslName === 'from' || this.state.step.dslName === 'to' || this.state.step.dslName === 'kamelet')) EventBus.sendPosition(this.state.step, el.getBoundingClientRect());
                 }}>
                <img draggable={false}
                     src={CamelUi.getIcon(this.state.step)}
                     className="icon" alt="icon">
                </img>
                <Text>{CamelUi.getTitle(this.state.step)}</Text>
                <button type="button" aria-label="Delete" onClick={e => this.delete(e)}
                        className="delete-button">
                    <DeleteIcon noVerticalAlign/>
                </button>
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

    hasBorder = ():boolean => {
        return this.state.step.hasSteps() || ['choice', 'from'].includes(this.state.step.dslName);
    }

    render() {
        return (
            <div className={
                this.hasBorder()
                    ? "step-element step-element-with-steps"
                    : "step-element step-element-without-steps"}
                 style={{
                     borderStyle: this.isSelected() ? "dashed" : (this.hasBorder() ? "dotted" : "none"),
                     borderColor: this.isSelected() ? this.props.borderColorSelected : this.props.borderColor,
                     marginTop: this.isRoot() ? "16px" : "",
                     zIndex: this.state.step.dslName === 'to' ? 20 : 10,
                     boxShadow: this.state.isDraggedOver ? "0px 0px 1px 2px " + this.props.borderColorSelected : "none",
                 }}
                 onClick={event => this.selectElement(event)}
                 onDragStart={event => {
                     event.stopPropagation();
                     event.dataTransfer.setData("text/plain", this.state.step.uuid);
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
                     if (this.state.step.dslName !== 'from' && !this.state.isDragging) {
                         this.setState({isDraggedOver: true});
                     }
                 }}
                 onDragEnter={event => {
                     event.preventDefault();
                     event.stopPropagation();
                     if (this.state.step.dslName !== 'from') {
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
                     const targetUuid = this.state.step.uuid;
                     if (sourceUuid !== targetUuid) {
                         this.props.moveElement?.call(this, sourceUuid, targetUuid);
                     }
                 }}
                 draggable={!['from', 'when', 'otherwise'].includes(this.state.step.dslName)}
            >
                {this.getElementHeader()}
                {this.state.step.hasSteps() && !this.horizontal() && this.getArrow()}
                <div className={this.state.step.dslName}>
                    {this.state.step.hasSteps() &&
                    <div className="steps" style={this.horizontal() ? {display: "flex", flexDirection: "row"} : {}}>
                        {this.getSteps().map((step, index) => (
                            <div key={step.uuid}
                                 style={this.horizontal() ? {marginRight: (index < this.getSteps().length - 1) ? "6px" : "0"} : {}}>
                                {this.state.step.hasSteps() && this.horizontal() && this.getArrow()}
                                <DslElement
                                    openSelector={this.props.openSelector}
                                    deleteElement={this.props.deleteElement}
                                    selectElement={this.props.selectElement}
                                    moveElement={this.props.moveElement}
                                    selectedUuid={this.state.selectedUuid}
                                    borderColor={this.props.borderColor}
                                    borderColorSelected={this.props.borderColorSelected}
                                    step={step}/>
                                {index < this.getSteps().length - 1 && !this.horizontal() && this.getArrow()}
                            </div>
                        ))}
                    </div>
                    }
                    {this.state.step.hasSteps() &&
                    <Tooltip position={"bottom"}
                             content={<div>{"Add element to " + CamelUi.getTitle(this.state.step)}</div>}>
                        <button type="button" aria-label="Add" onClick={e => this.openSelector(e)}
                                className={this.state.step.dslName === 'from' ? "add-button-from" : "add-button"}>
                            <AddIcon noVerticalAlign/>
                        </button>
                    </Tooltip>
                    }
                    {this.state.step.dslName === 'choice' &&
                    <Tooltip position={"bottom"} content={<div>{"Add element to Choice"}</div>}>
                        <button type="button" aria-label="Add" onClick={e => this.openSelector(e)}
                                className="add-button">
                            <AddIcon noVerticalAlign/>
                        </button>
                    </Tooltip>
                    }
                    {this.state.step.dslName === 'choice' &&
                    <div className={this.getWhens().length > 0 ? "whens" : ""}
                         style={this.horizontal() ? {display: "flex", flexDirection: "row"} : {}}>
                        {this.getWhens().map((when, index) => (
                            <div key={when.uuid} style={{marginLeft: (index !== 0) ? "6px" : "0"}}>
                                {this.getArrow()}
                                <DslElement
                                    openSelector={this.props.openSelector}
                                    deleteElement={this.props.deleteElement}
                                    selectElement={this.props.selectElement}
                                    moveElement={this.props.moveElement}
                                    selectedUuid={this.state.selectedUuid}
                                    borderColor={this.props.borderColor}
                                    borderColorSelected={this.props.borderColorSelected}
                                    step={when}/>
                            </div>
                        ))}
                        {this.getOtherwise() &&
                        <div key={this.getOtherwise().uuid}
                             style={{marginLeft: (this.getWhens().length > 0) ? "6px" : "0"}}>
                            {this.getArrow()}
                            <DslElement
                                openSelector={this.props.openSelector}
                                deleteElement={this.props.deleteElement}
                                selectElement={this.props.selectElement}
                                moveElement={this.props.moveElement}
                                selectedUuid={this.state.selectedUuid}
                                borderColor={this.props.borderColor}
                                borderColorSelected={this.props.borderColorSelected}
                                step={this.getOtherwise()}/>
                        </div>
                        }
                    </div>
                    }
                </div>
            </div>
        );
    }
}
