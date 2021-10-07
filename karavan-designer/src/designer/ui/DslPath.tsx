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

interface Props {
    uuid: string,
}

interface State {
    uuid: string,
    width: number,
    left: number,
    top: number,
    sub?: Subscription
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
    }

    componentWillUnmount() {
        this.state.sub?.unsubscribe();
    }

    setPosition(evt: DslPosition) {
        if (evt.step.dslName === 'fromStep'){
            this.setState({left: 56, top: (evt.rect.top + 25), width: (evt.rect.x) - 56});
        } else {
            this.setState({left: evt.rect.x + evt.rect.width, top: (evt.rect.top + 25), width: (evt.rect.x + evt.rect.width + 200)});
        }
    }

    render() {
        return (
            <svg style={{
                width: this.state.width,
                height: '2',
                position: "absolute",
                left: this.state.left,
                top: this.state.top
            }} viewBox={"0 0 " + this.state.width + " 2"}>
                <path d={"M 0 0, " + this.state.width + " 0"} className="path"/>
            </svg>
        );
    }
}