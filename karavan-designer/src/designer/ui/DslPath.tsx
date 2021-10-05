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