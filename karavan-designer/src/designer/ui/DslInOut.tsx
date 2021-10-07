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
import {InOut} from "../model/ConnectionModels";
import {Subscription} from "rxjs";
import {DslPosition, EventBus} from "../api/EventBus";

interface Props {
    inout: InOut,
}

interface State {
    inout: InOut
    top: number
    sub?: Subscription
}

export class DslInOut extends React.Component<Props, State> {

    public state: State = {
        inout: this.props.inout,
        top: this.props.inout.top
    };

    componentDidMount() {
        const sub = EventBus.onPosition()?.subscribe(evt => {
            if (evt.step.uuid === this.state.inout.uuid) {
                this.setPosition(evt);
            }
        });
        this.setState({sub: sub});
    }

    componentWillUnmount() {
        this.state.sub?.unsubscribe();
    }

    setPosition(evt: DslPosition) {
        this.setState({top: evt.rect.top});
    }

    render() {
        return (
            <div className={this.state.inout.type === 'out' ? 'outgoing' : 'incoming'} style={{top: this.state.top + 'px'}}>
                <img draggable={false}
                     src={this.state.inout.icon}
                     className="icon" alt="icon">
                </img>
            </div>
        );
    }
}