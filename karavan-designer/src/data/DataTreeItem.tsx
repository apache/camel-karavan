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
import React, {RefObject} from 'react';
import './datamapper.css';
import '../designer/karavan.css';
import {ExchangeElement} from "./DataMapperModel";

interface Props {
    element: ExchangeElement
    type: 'source' | 'target' | 'transformation'
    onMapElements: (source: ExchangeElement, target: ExchangeElement) => void
    onDragStart: (rect: DOMRect) => void
    onMoving: (clientX: number, clientY: number) => void
}

interface State {
    isDragging: boolean
    isDraggedOver: boolean
}

export class DataTreeItem extends React.Component<Props, State> {

    public state: State = {
        isDragging: false,
        isDraggedOver: false
    }

    ref:RefObject<HTMLDivElement> = React.createRef();

    render() {
        const {isDragging, isDraggedOver} = this.state;
        const {element, type} = this.props;
        const className = "exchange-item" ;
        return (
            <div key={"root-" + element.id}
                 className={className}
                 ref={this.ref}
                 style={{
                     // borderStyle: this.hasBorder() ? "dotted" : "none",
                     // borderColor: this.isSelected() ? "var(--step-border-color-selected)" : "var(--step-border-color)",
                     // marginTop: this.isInStepWithChildren() ? "16px" : "8px",
                     // zIndex: element.dslName === 'ToDefinition' ? 20 : 10,
                     boxShadow: isDraggedOver && type !== 'source' ? "0px 0px 1px 2px var(--step-border-color-selected)" : "none",
                 }}
                 onMouseOver={event => event.stopPropagation()}
                 // onClick={event => this.selectElement(event)}body
                 onDragStart={event => {
                     event.stopPropagation();
                     event.dataTransfer.setData("text/plain", element.id);
                     (event.target as any).style.opacity = 1.5;
                     (event.target as any).style.borderRadius = 16;
                     this.setState({isDragging: true});
                     const rect = this.ref.current?.getBoundingClientRect();
                     if (rect) this.props.onDragStart?.call(this, rect);
                 }}
                 onDragEnd={event => {
                     (event.target as any).style.opacity = '';
                     this.setState({isDragging: false});
                 }}
                 onDragOver={event => {
                     event.preventDefault();
                     event.stopPropagation();
                     if (element.id !== 'exchange') {
                         this.setState({isDraggedOver: true});
                     }
                 }}
                 onDragEnter={event => {
                     event.preventDefault();
                     event.stopPropagation();
                     if (element.id !== 'exchange') {
                         this.setState({isDraggedOver: true});
                     }
                 }}
                 onDragLeave={event => {
                     event.preventDefault();
                     event.stopPropagation();
                     this.setState({isDraggedOver: false});
                 }}
                 onDrag ={event => {
                     this.props.onMoving?.call(this, event.nativeEvent.clientX, event.nativeEvent.clientY);
                 }}
                 onDrop={event => this.dragElement(event, element)}
                 draggable={element.id !== 'exchange'}
            >
                {element.name}
            </div>
        );
    }

    private dragElement(event: React.DragEvent<HTMLDivElement>, element: ExchangeElement) {
        this.props.onMapElements?.call(this, this.props.element, element);
        this.setState({isDraggedOver: false});
    }
}
