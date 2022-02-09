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
import {
    Button, Card, CardActions, CardBody, CardFooter, CardHeader, CardTitle, Gallery, Modal,
    PageSection, Text
} from '@patternfly/react-core';
import './karavan.css';
import {Bean, CamelElement, Integration} from "karavan-core/lib/model/CamelDefinition";
import {CamelUi} from "./utils/CamelUi";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";

interface Props {
    onSave?: (integration: Integration) => void
    integration: Integration
    borderColor: string
    borderColorSelected: string
    dark: boolean
}

interface State {
    integration: Integration
    showDeleteConfirmation: boolean
    selectedBean?: Bean
    key: string
}

export class BeansDesigner extends React.Component<Props, State> {

    public state: State = {
        integration: this.props.integration,
        showDeleteConfirmation: false,
        key: "",
    };

    componentDidMount() {
        window.addEventListener('resize', this.handleResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    }

    handleResize = () => {
        this.setState({key: Math.random().toString()});
    }

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevState.key !== this.state.key) {
            this.props.onSave?.call(this, this.state.integration);
        }
    }

    showDeleteConfirmation = (bean: Bean) => {
        this.setState({selectedBean: bean, showDeleteConfirmation: true});
    }

    onIntegrationUpdate = (i: Integration) => {
        this.setState({integration: i, showDeleteConfirmation: false, key: Math.random().toString()});
    }

    deleteBean = () => {
        const i = CamelDefinitionApiExt.deleteBeanFromIntegration(this.state.integration, this.state.selectedBean);
        this.setState({
            integration: i,
            showDeleteConfirmation: false,
            key: Math.random().toString(),
            selectedBean: undefined
        });
    }

    getDeleteConfirmation() {
        return (<Modal
            className="modal-delete"
            title="Confirmation"
            isOpen={this.state.showDeleteConfirmation}
            onClose={() => this.setState({showDeleteConfirmation: false})}
            actions={[
                <Button key="confirm" variant="primary" onClick={e => this.deleteBean()}>Delete</Button>,
                <Button key="cancel" variant="link"
                        onClick={e => this.setState({showDeleteConfirmation: false})}>Cancel</Button>
            ]}
            onEscapePress={e => this.setState({showDeleteConfirmation: false})}>
            <div>
                Delete bean from integration?
            </div>
        </Modal>)
    }

    getCard(bean: Bean, index: number) {
        return (
            <Card key={bean.dslName + index} isHoverable isCompact className="bean-card" onClick={event => {
            }}>
                <CardHeader>
                    <svg className="icon" viewBox="0 0 536.243 536.242">
                        <g>
                            <path d="M471.053,197.07c-94.2-101.601-284-183.601-423.5-154.2c-9.2,1.8-12.9,9.2-12.2,16.5c-86.9,47.7,9.2,213,45.9,261.3
                         c72.2,96.1,200.701,203.2,329.901,173.8c60-13.5,103.399-69.8,120-126.1C550.053,304.77,513.253,242.37,471.053,197.07z
                          M393.353,465.17c-102.199,23.3-210.5-75.9-271.7-145c-61.2-70.4-108.3-155.4-71-243c83.8,151.8,253.4,269.3,414.9,321.899
                         c19.601,6.101,28.2-24.5,8.601-31.199C318.753,315.27,166.353,209.97,73.953,72.27c111.4-13.5,238.701,45.9,326.201,107.101
                         c50.199,35.5,98.5,87.5,102.8,151.8C505.954,394.17,451.454,451.67,393.353,465.17z"/>
                        </g>
                    </svg>
                    <CardActions>
                        <Button variant="link" className="delete-button" onClick={e => this.showDeleteConfirmation(bean)}><DeleteIcon/></Button>
                    </CardActions>
                </CardHeader>
                <CardTitle>{bean.name}</CardTitle>
                <CardBody>{bean.type}</CardBody>
                <CardFooter className="">
                </CardFooter>
            </Card>
        )
    }

    render() {
        const beans = CamelUi.getBeans(this.state.integration);
        return (
            <PageSection className="beans-page" isFilled padding={{default: 'noPadding'}}>
                <div className="beans-page-columns">
                    <Gallery hasGutter className="beans-gallery">
                        <Button icon={<PlusIcon/>} variant="secondary" onClick={e => {
                        }} className="add-button">Add new bean</Button>
                        {beans.map((bean: Bean, index: number) => this.getCard(bean, index))}
                    </Gallery>
                </div>
                {this.getDeleteConfirmation()}
            </PageSection>
        );
    }
}
