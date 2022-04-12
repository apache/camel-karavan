import React from 'react';
import {
    CardHeader, Card, CardTitle, CardBody, CardActions, CardFooter,Badge
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {KameletModel} from "karavan-core/lib/model/KameletModels";
import {camelIcon, CamelUi} from "../designer/utils/CamelUi";
import {Component} from "karavan-core/lib/model/ComponentModels";

interface Props {
    component: Component,
    onClickCard: any
}

interface State {
    component: Component,
}

export class ComponentCard extends React.Component<Props, State> {

    public state: State = {
        component: this.props.component
    };

    click = (event: React.MouseEvent) => {
        event.stopPropagation()
        this.props.onClickCard.call(this, this.state.component);
    }

    render() {
        const component = this.state.component;
        return (
            <Card isHoverable isCompact key={component.component.name} className="kamelet-card"
                onClick={event => this.click(event)}
            >
                <CardHeader>
                    <img draggable="false" src={camelIcon} className="kamelet-icon" alt=""></img>
                </CardHeader>
                <CardTitle>{CamelUi.titleFromName(component.component.name)}</CardTitle>
                <CardBody>{component.component.description}</CardBody>
                <CardFooter>
                    <Badge isRead className="labels">{component.component.label}</Badge>
                    <Badge isRead className="version">{component.component.version}</Badge>
                </CardFooter>
            </Card>
        );
    }
};