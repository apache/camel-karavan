import React from 'react';
import {
    CardHeader, Card, CardTitle, CardBody, Button, CardActions, CardFooter,
} from '@patternfly/react-core';
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import '../designer/karavan.css';
import {CamelUi} from "../designer/api/CamelUi";

interface Props {
    name: string,
    status?: string,
    onClick: any
    onDelete: any
}

interface State {
}

export class IntegrationCard extends React.Component<Props, State> {

    public state: State = {
    };

    private click(evt: React.MouseEvent) {
        evt.stopPropagation();
        this.props.onClick.call(this, this.props.name)
    }

    private delete(evt: React.MouseEvent) {
        evt.stopPropagation();
        this.props.onDelete.call(this, this.props.name);
    }

    render() {
        return (
            <Card isHoverable isCompact key={this.props.name} className="integration-card" onClick={event => this.click(event)}>
                <CardHeader>
                    <img src={CamelUi.getIconForName("camel")} alt='icon' className="icon"/>
                    <CardActions>
                        <Button variant="link" className="delete-button" onClick={e => this.delete(e)}><DeleteIcon/></Button>
                    </CardActions>
                </CardHeader>
                <CardTitle>{CamelUi.titleFromName(this.props.name)}</CardTitle>
                <CardBody>{this.props.name}</CardBody>
                <CardFooter className={this.props.status === 'Running' ? 'running' : (this.props.status === 'Error' ? 'error' : 'normal')}>
                    {this.props.status}
                </CardFooter>
            </Card>
        );
    }
}