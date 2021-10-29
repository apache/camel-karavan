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
import '../karavan.css';
import {Subscription} from "rxjs";
import {DslPosition, EventBus} from "../api/EventBus";
import {Path} from "../model/ConnectionModels";

interface Props {
    uuid: string,
    path: Path,
}

interface State {
    uuid: string,
    inout?: "in" | "out",
    width: number,
    left: number,
    top: number,
    sub?: Subscription
    fsub?: Subscription
    fRect?: DOMRect
}

export class DslPath extends React.Component<Props, State> {

    public state: State = {
        uuid: this.props.uuid,
        width: 0,
        left: 0,
        top: 0,
    };

    componentDidMount() {
        const sub = EventBus.onPosition()?.subscribe(evt => {
            if (evt.step.uuid === this.state.uuid) {
                this.setPosition(evt);
            }
        });
        this.setState({sub: sub});
        const fsub = EventBus.onFlowPosition()?.subscribe(evt => {
            this.setState({fRect: evt});
        });
        this.setState({fsub: fsub});
    }

    componentWillUnmount() {
        this.state.sub?.unsubscribe();
        this.state.fsub?.unsubscribe();
    }

    setPosition(evt: DslPosition) {
        if (evt.step.dslName === 'fromStep'){
            this.setState({inout:"in", left: 46, top: (evt.rect.top + 20), width: (evt.rect.x) - 46});
        } else {
            this.setState({inout:"out", left: evt.rect.x + evt.rect.width, top: (evt.rect.top + 20), width: (evt.rect.x + evt.rect.width + 200)});
        }
    }

    getTop(){
        if (this.state.fRect){
            return (this.state.top + this.props.path.index * 10) - this.state.fRect?.top;
        } else {
            return this.state.top + this.props.path.index * 10;
        }
    }

    getWidth(){
        if (this.state.fRect && this.state.inout === 'out'){
            return this.state.fRect.width - this.state.left - (this.props.path.index * 10) - 20;
        } else {
            return this.state.width;
        }
        // return this.state.fRect && this.state.inout === 'out' ? this.state.fRect.width - this.state.left : this.state.width;
    }

    render() {
        return (
            <svg style={{
                width: this.getWidth(),
                height: '2',
                position: "absolute",
                left: this.state.left,
                top: this.getTop()
            }} viewBox={"0 0 " + this.getWidth() + " 2"}>
                <path d={"M 0 0, " + this.getWidth() + " 0"} className="path"/>
            </svg>
        );
    }
}