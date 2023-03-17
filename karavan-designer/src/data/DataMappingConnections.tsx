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
import './datamapper.css';
import {ConnectionPoint, ConnectionsRect} from "./DataMapperModel";

interface Props {
    rect: ConnectionsRect
    starting: ConnectionPoint
    moving: ConnectionPoint
}

interface State {
    connections:[]
}

export class DataMappingConnections extends React.Component<Props, State> {

    public state: State = {
        connections: [],
    };

    render() {
        const {starting, moving} = this.props;
        const {top, left, height, width} = this.props.rect;
        const startX = starting.left - left;
        const startY = starting.top - top;
        const endX = moving.left - left;
        const endY = moving.top - top;
        const middleX = (endX + startX) / 2;
        console.log(`M ${startX},${startY} C ${middleX},${startY} ${middleX},${endY}   ${endX},${endY}`);
        return (
            <svg className="data-mapping-connection"
                style={{width: width, height: height, position: "absolute", left: left, top: top, backgroundColor: "transparent", zIndex:0}}
                viewBox={"0 0 " + width + " " + height}>
                <defs>
                    <marker id="arrowhead" markerWidth="9" markerHeight="6" refX="0" refY="3" orient="auto" className="arrow">
                        <polygon points="0 0, 9 3, 0 6"/>
                    </marker>
                </defs>
                {starting.top !==0 && moving.top !== 0
                    && <path name={"moving"} d={`M ${startX},${startY} C ${middleX},${startY} ${middleX},${endY}   ${endX},${endY}`}
                             className="path" key={"moving"} markerEnd="url(#arrowhead)"/>}
            </svg>
        );
    }
}
