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
    Card, CardBody, CardFooter, CardHeader, Form, FormGroup, Gallery, Modal, PageSection,
    Tab, Tabs, TabTitleText,
    Text, TextInput,
} from '@patternfly/react-core';
import '../karavan.css';
import {CamelUi} from "../api/CamelUi";
import {DslMetaModel} from "../model/DslMetaModel";
import {CamelApi} from "../api/CamelApi";

interface Props {
    show: boolean,
    onDslSelect: any
    onClose: any
    parentId: string
    parentType: string
    dark: boolean
}

interface State {
    show: boolean
    tabIndex: string | number
    filter?: string
}

export class DslSelector extends React.Component<Props, State> {

    public state: State = {
        show: this.props.show,
        tabIndex: CamelUi.getSelectorLabels(this.props.parentType)[0][0],
    };


    selectTab = (evt: React.MouseEvent<HTMLElement, MouseEvent>, eventKey: string | number) => {
        this.setState({tabIndex: eventKey})
    }

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevState.show !== this.props.show) {
            this.setState({show: this.props.show, filter:''});
        }
        if (prevProps.parentType !== this.props.parentType) {
            this.setState({tabIndex: CamelUi.getSelectorLabels(this.props.parentType)[0][0]});
        }
    }

    selectDsl = (evt: React.MouseEvent, dsl: any) => {
        evt.stopPropagation()
        this.setState({show: false})
        this.props.onDslSelect.call(this, dsl, this.props.parentId);
    }

    checkFilter = (dsl: DslMetaModel): boolean => {
        if (this.state.filter != undefined){
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

    getIcon = (dsl: DslMetaModel): string => {
        if (dsl.dsl && dsl.dsl === "kamelet") {
            return CamelUi.getKameletIconByName(dsl.name);
        } else if (dsl.dsl && dsl.dsl === "from" && dsl.uri?.startsWith("kamelet")){
            return CamelUi.getKameletIconByUri(dsl.uri);
        } else {
            return CamelUi.getIconForName(dsl.dsl);
        }
    }

    render() {
        return (
            <Modal
                title={this.props.parentType === undefined ? "Select source/from" : "Select step"}
                width={'90%'}
                className='dsl-modal'
                isOpen={this.state.show}
                onClose={() => this.props.onClose.call(this)}
                actions={{}}>
                <PageSection variant={this.props.dark ? "darker" : "light"}>
                    {this.searchInput()}
                    <Tabs style={{overflow: 'hidden'}} activeKey={this.state.tabIndex} onSelect={this.selectTab}>
                        {CamelUi.getSelectorLabels(this.props.parentType).map((label, index) => (
                            <Tab eventKey={label[0]} key={"tab-" + label[0]}
                                 title={<TabTitleText>{CamelApi.capitalizeName(label[0])}</TabTitleText>}
                                 translate={undefined} onAuxClick={undefined} onAuxClickCapture={undefined}>
                                <Gallery key={"gallery-" + label[0]} hasGutter className="dsl-gallery">
                                    {CamelUi.sortSelectorModels(CamelUi.getSelectorModels(label[0], label[1], this.props.parentType))
                                        .filter(dsl =>this.checkFilter(dsl))
                                        .map((dsl, index) => (
                                            <Card key={dsl.dsl + index} isHoverable isCompact className="dsl-card"
                                                  onClick={event => this.selectDsl(event, dsl)}>
                                                <CardHeader>
                                                    <img draggable={false}
                                                         src={this.getIcon(dsl)}
                                                         style={dsl.dsl === 'choice' ? {height: "18px"} : {}}  // find better icon
                                                         className="icon" alt="icon"></img>
                                                    <Text>{dsl.title}</Text>
                                                </CardHeader>
                                                <CardBody>
                                                    <Text>{dsl.description}</Text>
                                                </CardBody>
                                                <CardFooter>
                                                    <Text className="version">{dsl.version}</Text>
                                                </CardFooter>
                                            </Card>
                                        ))}
                                </Gallery>
                            </Tab>
                        ))}
                    </Tabs>
                </PageSection>
            </Modal>
        );
    }
}