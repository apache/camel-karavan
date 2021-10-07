import React from 'react';
import {
    CardHeader, Card, CardTitle, CardBody, CardActions, CardFooter,Badge
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {Kamelet} from "../designer/model/KameletModels";
import {CamelUi} from "../designer/api/CamelUi";

interface Props {
    kamelet: Kamelet,
    onClickCard: any
}

interface State {
    kamelet: Kamelet,
}

export class KameletCard extends React.Component<Props, State> {

    public state: State = {
        kamelet: this.props.kamelet
    };

    click = (event: React.MouseEvent) => {
        event.stopPropagation()
        this.props.onClickCard.call(this, this.state.kamelet);
    }

    render() {
        return (
            <Card isHoverable isCompact key={this.state.kamelet.metadata.name} className="kamelet-card"
                onClick={event => this.click(event)}
            >
                <CardHeader>
                    <img draggable="false" src={this.state.kamelet.icon()} className="kamelet-icon" alt=""></img>
                    <CardActions>
                        <Badge className="badge" isRead> {this.state.kamelet.metadata.labels["camel.apache.org/kamelet.type"].toLowerCase()}</Badge>
                    </CardActions>
                </CardHeader>
                <CardTitle>{CamelUi.titleFromName(this.state.kamelet.metadata.name)}</CardTitle>
                <CardBody>{this.state.kamelet.spec.definition.description}</CardBody>
                <CardFooter>

                </CardFooter>
            </Card>
        );
    }
};