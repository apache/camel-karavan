import React from 'react';
import {
    CardHeader, Card, CardTitle, CardBody, CardActions, CardFooter,Badge
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {KameletModel} from "karavan-core/lib/model/KameletModels";
import {CamelUi} from "../designer/utils/CamelUi";

interface Props {
    kamelet: KameletModel,
    onClickCard: any
}

interface State {
    kamelet: KameletModel,
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
        const kamelet = this.state.kamelet;
        return (
            <Card isHoverable isCompact key={kamelet.metadata.name} className="kamelet-card"
                onClick={event => this.click(event)}
            >
                <CardHeader>
                    <img draggable="false" src={kamelet.icon()} className="kamelet-icon" alt=""></img>
                </CardHeader>
                <CardTitle>{CamelUi.titleFromName(kamelet.metadata.name)}</CardTitle>
                <CardBody>{kamelet.spec.definition.description}</CardBody>
                <CardFooter>
                    {/*<div style={{justifyContent: "space-between"}}>*/}
                        <Badge isRead className="labels">{kamelet.metadata.labels["camel.apache.org/kamelet.type"].toLowerCase()}</Badge>
                        <Badge isRead className="version">{kamelet.metadata.annotations["camel.apache.org/catalog.version"].toLowerCase()}</Badge>
                    {/*</div>*/}
                </CardFooter>
            </Card>
        );
    }
};