import React from 'react';
import '../karavan.css';
import {InOut, Path} from "../model/ConnectionModels";
import {Integration} from "../model/CamelModel";
import {Subscription} from "rxjs";
import {CamelUi} from "../api/CamelUi";
import {CamelApiExt} from "../api/CamelApiExt";
import {KameletApi} from "../api/KameletApi";
import {DslInOut} from "./DslInOut";
import {DslPath} from "./DslPath";
import {DslPosition, EventBus} from "../api/EventBus";

interface Props {
    integration: Integration
}

interface State {
    integration: Integration
    paths: Path[]
    sub?: Subscription
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
        this.state.integration.spec.flows.forEach((flow, index) => {
            const uri = flow.from.uri;
            if (uri && uri.startsWith("kamelet")) {
                const kamelet = KameletApi.findKameletByUri(uri);
                if (kamelet && kamelet.metadata.labels["camel.apache.org/kamelet.type"] === 'source') {
                    const i = new InOut('in', flow.uuid, CamelUi.getIcon(flow.from), index * 60, 0);
                    result.push(i);
                }
            } else {
                // TODO ?
            }
        })
        return result;
    }

    getOutgoings(): InOut[] {
        const result: InOut[] = [];
        CamelApiExt.getToStepsFromIntegration(this.state.integration).forEach((element, index) => {
            const uri: string = (element as any).to.uri;
            if (uri && uri.startsWith("kamelet")) {
                const kamelet = KameletApi.findKameletByUri(uri);
                if (kamelet && kamelet.metadata.labels["camel.apache.org/kamelet.type"] === 'sink') {
                    const i = new InOut('out', element.uuid, CamelUi.getIcon((element as any).to), index * 60, 500);
                    result.push(i);
                }
            } else {
                // TODO ?
            }
        })
        return result;
    }

    getPath(): Path[] {
        const result: Path[] = [];
        this.getIncomings().forEach((i, index) => {
            const path = new Path(i.uuid, 66, i.top + 25, 66, i.top + 25);
            result.push(path);
        })
        this.getOutgoings().forEach((i, index) => {
            const path = new Path(i.uuid, 666, i.top + 25, 666, i.top + 25);
            result.push(path);
        })
        return result;
    }

    render() {
        return (
            <div className="connections">
                {this.getPath().map(path => <DslPath key={path.uuid} uuid={path.uuid}/>)}
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