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
    filter?: string
}

export class DslSelector extends React.Component<Props, State> {

    public state: State = {
        tabIndex: this.props.tabIndex ? this.props.tabIndex : CamelUi.getSelectorModelTypes(this.props.parentDsl, this.props.showSteps)[0][0],
    }


    selectTab = (evt: React.MouseEvent<HTMLElement, MouseEvent>, eventKey: string | number) => {
        console.log(eventKey)
        this.setState({tabIndex: eventKey})
    }

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevProps.parentDsl !== this.props.parentDsl) {
            this.setState({tabIndex: CamelUi.getSelectorModelTypes(this.props.parentDsl, this.props.showSteps)[0][0]});
        }
    }

    selectDsl = (evt: React.MouseEvent, dsl: any) => {
        evt.stopPropagation()
        this.props.onDslSelect.call(this, dsl, this.props.parentId, this.props.position);
    }

    checkFilter = (dsl: DslMetaModel): boolean => {
        if (this.state.filter !== undefined) {
            return dsl.title.toLowerCase().includes(this.state.filter.toLowerCase())
                || dsl.description.toLowerCase().includes(this.state.filter.toLowerCase());
        } else {
            return true;
        }
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
            <Card data-tour={dsl.name} key={dsl.dsl + index} isHoverable isCompact className="dsl-card"
                  onClick={event => this.selectDsl(event, dsl)}>
                <CardHeader>
                    {CamelUi.getIconForDsl(dsl)}
                    <Text>{dsl.title}</Text>
                </CardHeader>
                <CardBody>
                    <Text>{dsl.description}</Text>
                </CardBody>
                <CardFooter>
                    {dsl.navigation.toLowerCase() === "kamelet"
                        && <div className="footer" style={{justifyContent: "space-between"}}>
                            <Badge isRead className="labels">{dsl.labels}</Badge>
                            <Badge isRead className="version">{dsl.version}</Badge>
                        </div>}
                    {dsl.navigation.toLowerCase() === "component"
                        && <div className="footer" style={{justifyContent: "flex-start"}}>
                            {dsl.labels.split(',').map((s: string,  i: number) => <Badge key={s + i} isRead
                                                                                         className="labels">{s}</Badge>)}
                            <Badge isRead className="version">{dsl.version}</Badge>
                        </div>
                    }
                </CardFooter>
            </Card>
        )
    }

    render() {
        const parentDsl = this.props.parentDsl;
        const title = parentDsl === undefined ? "Select source/from" : "Select step";
        const labelText: string = this.state.tabIndex ? this.state.tabIndex.toString() : "";
        return (
            <Modal
                aria-label={title}
                data-tour="selector"
                width={'90%'}
                className='dsl-modal'
                isOpen={this.props.isOpen}
                onClose={this.props.onClose}
                header={
                    <Flex direction={{default: "column"}}>
                        <FlexItem>
                            <h3>{title}</h3>
                            {this.searchInput()}
                        </FlexItem>
                        <FlexItem>
                            <Tabs data-tour="selector-tabs" style={{overflow: 'hidden'}} activeKey={this.state.tabIndex}
                                  onSelect={this.selectTab}>
                                {CamelUi.getSelectorModelTypes(parentDsl, this.props.showSteps).map((label: [string, number], index: number) => {
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
                        {CamelUi.getSelectorModelsForParentFiltered(parentDsl, labelText, this.props.showSteps)
                            .filter((dsl: DslMetaModel) => this.checkFilter(dsl))
                            .map((dsl: DslMetaModel, index: number) => this.getCard(dsl, index))}
                    </Gallery>
                </PageSection>
            </Modal>
        )
    }
}