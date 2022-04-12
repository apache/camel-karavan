import React from 'react';
import {
    CardHeader, Card, CardTitle, CardBody, CardFooter,Badge
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {CamelUi} from "../designer/utils/CamelUi";
import {ElementMeta} from "karavan-core/lib/model/CamelMetadata";

interface Props {
    element: ElementMeta,
    onClickCard: any
}

interface State {
    element: ElementMeta,
}

export class EipCard extends React.Component<Props, State> {

    public state: State = {
        element: this.props.element
    };

    click = (event: React.MouseEvent) => {
        event.stopPropagation()
        this.props.onClickCard.call(this, this.state.element);
    }

    render() {
        const component = this.state.element;
        return (
            <Card isHoverable isCompact key={component.name} className="kamelet-card"
                onClick={event => this.click(event)}
            >
                <CardHeader>
                    <img draggable="false" src={CamelUi.getIconForName(component.className)} className="kamelet-icon" alt=""></img>
                </CardHeader>
                <CardTitle>{CamelUi.titleFromName(component.title)}</CardTitle>
                <CardBody>{component.description}</CardBody>
                <CardFooter>
                        <Badge isRead className="labels">{component.labels}</Badge>
                </CardFooter>
            </Card>
        )
    }
};