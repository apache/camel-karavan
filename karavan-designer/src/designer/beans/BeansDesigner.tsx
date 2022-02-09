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
import React, {MouseEventHandler} from 'react';
import {
    Button, Card, CardActions, CardBody, CardFooter, CardHeader, CardTitle, Gallery, Modal, ModalVariant,
    PageSection, Text
} from '@patternfly/react-core';
import '../karavan.css';
import {Bean, Integration} from "karavan-core/lib/model/CamelDefinition";
import {CamelUi} from "../utils/CamelUi";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import {BeanIcon} from "../utils/KaravanIcons";
import {BeanEditor} from "./BeanEditor";

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
    selectedBean: Bean
    key: string
    showBeanEditor: boolean
}

export class BeansDesigner extends React.Component<Props, State> {

    public state: State = {
        integration: this.props.integration,
        showDeleteConfirmation: false,
        key: "",
        showBeanEditor: false,
        selectedBean: new Bean()
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

    showDeleteConfirmation = (e: React.MouseEvent, bean: Bean) => {
        e.stopPropagation();
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
            selectedBean: new Bean()
        });
    }

    changeBean = (bean: Bean) => {
        const i = CamelDefinitionApiExt.addBeanToIntegration(this.state.integration, bean);
        this.setState({
            integration: i,
            key: Math.random().toString(),
            selectedBean: new Bean()
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

    closeBeanEditor = () => {
        this.setState({showBeanEditor: false})
    }

    openBeanEditor = (bean: Bean) => {
        this.setState({showBeanEditor: true, selectedBean: bean})
    }

    getCard(bean: Bean, index: number) {
        return (
            <Card key={bean.dslName + index} isHoverable isCompact className="bean-card" onClick={e => this.openBeanEditor(bean)}>
                <CardHeader>
                    <BeanIcon/>
                    <CardActions>
                        <Button variant="link" className="delete-button" onClick={e => this.showDeleteConfirmation(e, bean)}><DeleteIcon/></Button>
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
                        {beans.map((bean: Bean, index: number) => this.getCard(bean, index))}
                    </Gallery>
                    <div className="add-button-div">
                        <Button icon={<PlusIcon/>} variant={beans.length === 0 ? "primary" : "secondary"} onClick={e => this.openBeanEditor(new Bean())} className="add-button">
                            Add new bean
                        </Button>
                    </div>
                </div>
                <BeanEditor key={this.state.key + this.state.selectedBean.name}
                    bean={this.state.selectedBean}
                    dark={this.props.dark}
                    show={this.state.showBeanEditor}
                    onChange={this.changeBean} />
                {this.getDeleteConfirmation()}
            </PageSection>
        );
    }
}
