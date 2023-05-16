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
    Card, CardBody, CardFooter, CardHeader, Flex, FlexItem, Form, FormGroup, Gallery, Modal, PageSection,
    Tab, Tabs, TabTitleText,
    Text, TextInput,
} from '@patternfly/react-core';
import '../karavan.css';
import {CamelUi} from "../utils/CamelUi";
import {DslMetaModel} from "../utils/DslMetaModel";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";

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
}

export class DslSelector extends React.Component<Props, State> {

    getDefaultTabIndex = () => {
        const x = CamelUi.getSelectorModelTypes(this.props.parentDsl, this.props.showSteps);
        if (x.length > 0) return x[0][0]
        else return '';
    }

    public state: State = {
        tabIndex: this.props.tabIndex ? this.props.tabIndex : this.getDefaultTabIndex(),
        filter: ''
    }

    selectTab = (evt: React.MouseEvent<HTMLElement, MouseEvent>, eventKey: string | number) => {
        this.setState({tabIndex: eventKey})
    }

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevProps.parentDsl !== this.props.parentDsl) {
            this.setState({tabIndex: CamelUi.getSelectorModelTypes(this.props.parentDsl, this.props.showSteps)[0][0]});
        }
    }

    selectDsl = (evt: React.MouseEvent, dsl: any) => {
        evt.stopPropagation();
        this.setState({filter:""});
        this.props.onDslSelect.call(this, dsl, this.props.parentId, this.props.position);
    }

    searchInput = () => {
        return (
            <Form isHorizontal className="search" autoComplete="off">
                <FormGroup fieldId="search">
                    <TextInput className="text-field" type="text" id="search" name="search" iconVariant='search'
                               value={this.state.filter}
                               onChange={e => this.setState({filter: e})}/>
                </FormGroup>
            </Form>
        )
    }

    getCard(dsl: DslMetaModel, index: number) {
        return (
            <Card key={dsl.dsl + index} isHoverable isCompact className="dsl-card"
                  onClick={event => this.selectDsl(event, dsl)}>
                <CardHeader className="header-labels">
                    {dsl.supportType === 'Supported' && <Badge isRead className="support-type labels">{dsl.supportType}</Badge>}
                    <Badge isRead className="support-level labels">{dsl.supportLevel}</Badge>
                </CardHeader>
                <CardHeader>
                    {CamelUi.getIconForDsl(dsl)}
                    <Text>{dsl.title}</Text>
                </CardHeader>
                <CardBody>
                    <Text>{dsl.description}</Text>
                </CardBody>
                    {dsl.navigation.toLowerCase() === "kamelet"
                        && <CardFooter className="footer-labels">
                            <Badge isRead className="labels">{dsl.labels}</Badge>
                            <Badge isRead className="version labels">{dsl.version}</Badge>
                        </CardFooter>}
                    {dsl.navigation.toLowerCase() === "component"
                        && <CardFooter className="footer-labels">
                            <Badge isRead className="labels">{dsl.labels}</Badge>
                            <Badge isRead className="version labels">{dsl.version}</Badge>
                        </CardFooter>
                    }
            </Card>
        )
    }

    close = () => {
        this.setState({filter:""});
        this.props.onClose?.call(this);
    }

    render() {
        const {parentDsl, isOpen} = this.props;
        const title = parentDsl === undefined ? "Select source/from" : "Select step";
        const labelText: string = this.state.tabIndex ? this.state.tabIndex.toString() : "";
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
                                {CamelUi.getSelectorModelTypes(parentDsl, this.props.showSteps,this.state.filter).map((label: [string, number], index: number) => {
                                    const labelText = label[0];
                                    const count = label[1];
                                    const title = ['kamelet', 'component'].includes(labelText.toLowerCase()) ? labelText + "s (" + count + ")" : labelText;
                                    return (
                                        <Tab eventKey={labelText} key={"tab-" + labelText}
                                             title={<TabTitleText>{CamelUtil.capitalizeName(title)}</TabTitleText>}>
                                        </Tab>
                                    )
                                })}
                            </Tabs>
                        </FlexItem>
                    </Flex>
                }
                actions={{}}>
                <PageSection variant={this.props.dark ? "darker" : "light"}>
                    <Gallery key={"gallery-" + labelText} hasGutter className="dsl-gallery">
                        {isOpen && CamelUi.getSelectorModelsForParentFiltered(parentDsl, labelText, this.props.showSteps)
                            .filter((dsl: DslMetaModel) => CamelUi.checkFilter(dsl, this.state.filter))
                            .map((dsl: DslMetaModel, index: number) => this.getCard(dsl, index))}
                    </Gallery>
                </PageSection>
            </Modal>
        )
    }
}