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
    Badge,
    Card, CardBody, CardFooter, CardHeader, Flex, FlexItem, Form, FormGroup, Gallery, Label, Modal, PageSection,
    Tab, Tabs, TabTitleText,
    Text, TextInput, ToggleGroup, ToggleGroupItem,
} from '@patternfly/react-core';
import '../karavan.css';
import {CamelUi} from "../utils/CamelUi";
import {DslMetaModel} from "../utils/DslMetaModel";

interface Props {
    onDslSelect: (dsl: DslMetaModel, parentId: string, position?: number | undefined) => void,
    onClose?: () => void,
    parentId: string,
    parentDsl?: string,
    showSteps: boolean,
    dark: boolean,
    isOpen: boolean,
    position?: number
    tabIndex?: string | number
}

interface State {
    tabIndex: string | number
    filter: string;
    selectedLabels: string []
}

export class DslSelector extends React.Component<Props, State> {

    public state: State = {
        tabIndex: this.props.tabIndex ? this.props.tabIndex : (this.props.parentDsl ? 'eip' : 'kamelet'),
        filter: '',
        selectedLabels: []
    }

    selectTab = (evt: React.MouseEvent<HTMLElement, MouseEvent>, eventKey: string | number) => {
        this.setState({tabIndex: eventKey});
    }

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevProps.parentDsl !== this.props.parentDsl) {
            this.setState({tabIndex: CamelUi.getSelectorModelTypes(this.props.parentDsl, this.props.showSteps)[0][0]});
        }
    }

    selectDsl = (evt: React.MouseEvent, dsl: any) => {
        evt.stopPropagation();
        this.setState({filter: ""});
        this.props.onDslSelect.call(this, dsl, this.props.parentId, this.props.position);
    }

    searchInput = () => {
        return (
            <Form isHorizontal className="search" autoComplete="off">
                <FormGroup fieldId="search">
                    <TextInput className="text-field" type="text" id="search" name="search" 
                            value={this.state.filter}
                            onChange={(_, value) => this.setState({filter: value})}/>
                </FormGroup>
            </Form>
        )
    }

    getCard(dsl: DslMetaModel, index: number) {
        const labels = dsl.labels !== undefined ? dsl.labels.split(",").filter(label => label !== 'eip') : [];
        return (
            <Card key={dsl.dsl + index} isCompact className="dsl-card"
                  onClick={event => this.selectDsl(event, dsl)}>
                <CardHeader className="header-labels">
                    <Badge isRead className="support-level labels">{dsl.supportLevel}</Badge>
                    {['kamelet', 'component'].includes(dsl.navigation.toLowerCase()) &&
                        <Badge isRead className="version labels">{dsl.version}</Badge>
                    }
                </CardHeader>
                <CardHeader>
                    {CamelUi.getIconForDsl(dsl)}
                    <Text>{dsl.title}</Text>
                </CardHeader>
                <CardBody>
                    <Text>{dsl.description}</Text>
                </CardBody>
                <CardFooter className="footer-labels">
                    <div style={{display: "flex", flexDirection: "row", justifyContent: "start"}}>
                        {labels.map(label => <Badge key={label} isRead className="labels">{label}</Badge>)}
                    </div>

                </CardFooter>
            </Card>
        )
    }

    close = () => {
        this.setState({filter: ""});
        this.props.onClose?.call(this);
    }

    selectLabel = (eipLabel: string) => {
        if (!this.state.selectedLabels.includes(eipLabel)) {
            this.setState((state) => {
                state.selectedLabels.push(eipLabel);
                return state
            })
        } else {
            this.setState((state) => {
                const index = state.selectedLabels.findIndex((label) => label === eipLabel);
                state.selectedLabels.splice(index, 1);
                return state;
            })
        }
    }

    render() {
        const isEip = this.state.tabIndex === 'eip';
        const {parentDsl, isOpen} = this.props;
        const title = parentDsl === undefined ? "Select source" : "Select step";
        const navigation: string = this.state.tabIndex ? this.state.tabIndex.toString() : "";
        const elements = CamelUi.getSelectorModelsForParentFiltered(parentDsl, navigation, this.props.showSteps);
        const eipLabels = [...new Set(elements.map(e => e.labels).join(",").split(",").filter(e => e !== 'eip'))];
        const filteredElement = elements
            .filter((dsl: DslMetaModel) => CamelUi.checkFilter(dsl, this.state.filter))
            .filter((dsl: DslMetaModel) => {
                if (!isEip || this.state.selectedLabels.length === 0) {
                    return true;
                } else {
                    return dsl.labels.split(",").some(r => this.state.selectedLabels.includes(r));
                }
            });

        return (
            <Modal
                aria-label={title}
                width={'90%'}
                className='dsl-modal'
                isOpen={this.props.isOpen}
                onClose={() => this.close()}
                header={
                    <Flex direction={{default: "column"}}>
                        <FlexItem>
                            <h3>{title}</h3>
                            {this.searchInput()}
                        </FlexItem>
                        <FlexItem>
                            <Tabs style={{overflow: 'hidden'}} activeKey={this.state.tabIndex}
                                  onSelect={this.selectTab}>
                                {parentDsl !== undefined &&
                                    <Tab eventKey={"eip"} key={"tab-eip"}
                                         title={<TabTitleText>Integration Patterns</TabTitleText>}>
                                    </Tab>
                                }
                                <Tab eventKey={'kamelet'} key={"tab-kamelet"}
                                     title={<TabTitleText>Kamelets</TabTitleText>}>
                                </Tab>
                                <Tab eventKey={'component'} key={'tab-component'}
                                     title={<TabTitleText>Components</TabTitleText>}>
                                </Tab>
                            </Tabs>
                        </FlexItem>
                    </Flex>
                }
                actions={{}}>
                <PageSection padding={{default:"noPadding"}} variant={this.props.dark ? "darker" : "light"}>
                    {isEip && <ToggleGroup aria-label="Labels" isCompact>
                        {eipLabels.map(eipLabel => <ToggleGroupItem
                            key={eipLabel}
                            text={eipLabel}
                            buttonId={eipLabel}
                            isSelected={this.state.selectedLabels.includes(eipLabel)}
                            onChange={selected => this.selectLabel(eipLabel)}
                        />)}
                    </ToggleGroup>}
                    <Gallery key={"gallery-" + navigation} hasGutter className="dsl-gallery">
                        {isOpen && filteredElement.map((dsl: DslMetaModel, index: number) => this.getCard(dsl, index))}
                    </Gallery>
                </PageSection>
            </Modal>
        )
    }
}