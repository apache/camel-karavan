import React from 'react';
import {
    CardHeader, Card, CardTitle, CardBody, Button, CardActions, CardFooter,
} from '@patternfly/react-core';
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import '../designer/karavan.css';
import {CamelUi} from "../designer/utils/CamelUi";
import {getDesignerIcon} from "../designer/utils/KaravanIcons";

interface Props {
    name: string,
    type: 'integration' | 'openapi',
    status?: string,
    onClick: (filename: string, type: 'integration' | 'openapi') => void
    onDelete: (name: string, type: 'integration' | 'openapi') => void
}

interface State {
}

export class IntegrationCard extends React.Component<Props, State> {

    public state: State = {
    };

    private click(evt: React.MouseEvent) {
        evt.stopPropagation();
        this.props.onClick.call(this, this.props.name, this.props.type)
    }

    private delete(evt: React.MouseEvent) {
        evt.stopPropagation();
        this.props.onDelete.call(this, this.props.name, this.props.type);
    }

    render() {
        return (
            <Card isCompact key={this.props.name} className="integration-card" onClick={event => this.click(event)}>
                <CardHeader>
                    {getDesignerIcon(this.props.type === 'integration' ? 'routes' : 'rest')}
                    <CardActions>
                        <Button variant="link" className="delete-button" onClick={e => this.delete(e)}><DeleteIcon/></Button>
                    </CardActions>
                </CardHeader>
                <CardTitle>{this.props.type === 'integration' ? 'Integration' : 'OpenAPI'}</CardTitle>
                <CardTitle>{CamelUi.titleFromName(this.props.name)}</CardTitle>
                <CardBody>{this.props.name}</CardBody>
                <CardFooter className={this.props.status === 'Running' ? 'running' : (this.props.status === 'Error' ? 'error' : 'normal')}>
                    {this.props.status}
                </CardFooter>
            </Card>
        );
    }
}