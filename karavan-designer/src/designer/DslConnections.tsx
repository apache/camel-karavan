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
import './karavan.css';
import {InOut, Path} from "karavan-core/lib/model/ConnectionModels";
import {CamelElement, Integration} from "karavan-core/lib/model/CamelDefinition";
import {CamelUi} from "karavan-core/lib/api/CamelUi";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import {DslInOut} from "./DslInOut";
import {DslPath} from "./DslPath";
import {DslPosition, EventBus} from "karavan-core/lib/api/EventBus";
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";
import Rx from 'karavan-core/node_modules/rxjs';

interface Props {
    integration: Integration
}

interface State {
    integration: Integration
    paths: Path[]
    sub?: Rx.Subscription
    outs: Map<string, DslPosition>
}

export class DslConnections extends React.Component<Props, State> {

    public state: State = {
        integration: this.props.integration,
        paths: [],
        outs: new Map<string, DslPosition>()
    };

    componentDidMount() {
        const sub = EventBus.onPosition()?.subscribe(evt => {
            // this.setPosition(evt);
        });
        this.setState({sub: sub});
    }

    componentWillUnmount() {
        this.state.sub?.unsubscribe();
    }

    // setPosition(evt: DslPosition) {
    //     if (this.getOutgoings().findIndex(i => i.uuid === evt.step.uuid) !== -1){
    //         // console.log(evt);
    //     }
    // }

    getIncomings(): InOut[] {
        const result: InOut[] = [];
        this.state.integration.spec.flows?.forEach((route: any, index: number) => {
            const from = route.from;
            const uri = from.uri;
            if (uri && uri.startsWith("kamelet")) {
                const kamelet = KameletApi.findKameletByUri(uri);
                if (kamelet && kamelet.metadata.labels["camel.apache.org/kamelet.type"] === 'source') {
                    const i = new InOut('in', from.uuid, index * 60, 0, 0, CamelUi.getIcon(from));
                    result.push(i);
                }
            } else if (uri && !uri.startsWith("kamelet")) {
                const i = new InOut('in', from.uuid, index * 60, 0, 0, undefined, ComponentApi.getComponentNameFromUri(uri));
                result.push(i);
            }
        })
        return result;
    }

    getOutgoings(): InOut[] {
        const result: InOut[] = [];
        const toSteps: [CamelElement, number][] = CamelDefinitionApiExt.getToStepsFromIntegration(this.state.integration);
        const set = new Set(toSteps.map(value => value[1]));
        set.forEach((level) => {
            toSteps.filter(data => data[1] === level).forEach((data, index, all) => {
                const element: CamelElement = data[0];
                if (element.dslName === 'ToDefinition') {
                    const uri: string = (element as any).uri;
                    const i = new InOut('out', element.uuid, index * 60, 500, index, undefined, ComponentApi.getComponentNameFromUri(uri));
                    result.push(i);
                } else if (element.dslName === 'KameletDefinition') {
                    const name: string = (element as any).name;
                    const kamelet = KameletApi.findKameletByName(name);
                    if (kamelet && kamelet.metadata.labels["camel.apache.org/kamelet.type"] === 'sink') {
                        const i = new InOut('out', element.uuid, index * 60, 500, index, CamelUi.getIcon(element), undefined);
                        result.push(i);
                    }
                }
            })
        })
        return result;
    }

    getPath(): Path[] {
        const result: Path[] = [];
        this.getIncomings().forEach((i, index) => {
            const path = new Path(i.uuid, 66, i.top + 25, 66, i.top + 25, i.index);
            result.push(path);
        })
        this.getOutgoings().forEach((i, index) => {
            const path = new Path(i.uuid, 666, i.top + 25, 666, i.top + 25, i.index);
            result.push(path);
        })
        return result;
    }

    render() {
        return (
            <div className="connections">
                {this.getPath().map(path => <DslPath key={path.uuid} uuid={path.uuid} path={path}/>)}
                {this.getIncomings().map((i: InOut) =>
                    <DslInOut key={i.uuid} inout={i}/>
                )}
                {this.getOutgoings().map((o: InOut) =>
                    <DslInOut key={o.uuid} inout={o}/>
                )}
            </div>
        );
    }
}