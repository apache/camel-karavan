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
    Card, CardBody, CardFooter, CardHeader, Form, FormGroup, Gallery, Modal, PageSection,
    Tab, Tabs, TabTitleText,
    Text, TextInput,
} from '@patternfly/react-core';
import './karavan.css';
import {CamelUi} from "./CamelUi";
import {DslMetaModel} from "karavan-core/lib/model/DslMetaModel";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";

interface Props {
    show: boolean,
    onDslSelect: any
    onClose: any
    parentId: string
    parentDsl?: string,
    showSteps: boolean,
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
        tabIndex: CamelUi.getSelectorModelTypes(this.props.parentDsl, this.props.showSteps)[0],
    };


    selectTab = (evt: React.MouseEvent<HTMLElement, MouseEvent>, eventKey: string | number) => {
        this.setState({tabIndex: eventKey})
    }

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevState.show !== this.props.show) {
            this.setState({show: this.props.show, filter: '', tabIndex: CamelUi.getSelectorModelTypes(this.props.parentDsl, this.props.showSteps)[0]});
        }
        if (prevProps.parentDsl !== this.props.parentDsl) {
            this.setState({tabIndex: CamelUi.getSelectorModelTypes(this.props.parentDsl, this.props.showSteps)[0]});
        }
    }

    selectDsl = (evt: React.MouseEvent, dsl: any) => {
        evt.stopPropagation()
        this.setState({show: false})
        this.props.onDslSelect.call(this, dsl, this.props.parentId);
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

    getIcon = (dsl: DslMetaModel): string => {
        if (dsl.dsl && dsl.dsl === "KameletDefinition") {
            return CamelUi.getKameletIconByName(dsl.name);
        } else if ((dsl.dsl && dsl.dsl === "FromDefinition")
            && dsl.uri?.startsWith("kamelet")) {
            return CamelUi.getKameletIconByUri(dsl.uri);
        } else {
            return CamelUi.getIconForName(dsl.dsl);
        }
    }

    getCard(dsl: DslMetaModel, index: number) {
        return (
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
                {dsl.navigation.toLowerCase() == "kamelet"
                    && <div className="footer" style={{justifyContent: "space-between"}}>
                        <Badge isRead className="labels">{dsl.labels}</Badge>
                        <Badge isRead className="version">{dsl.version}</Badge>
                    </div> }
                {dsl.navigation.toLowerCase() == "component"
                    && <div className="footer" style={{justifyContent: "flex-start"}}>
                        {dsl.labels.split(',').map((s: string) => <Badge isRead className="labels">{s}</Badge>)}
                    </div>}
                </CardFooter>
            </Card>
        )
    }

    render() {
        const parentDsl = this.props.parentDsl;
        return (
            <Modal
                title={parentDsl === undefined ? "Select source/from" : "Select step"}
                width={'90%'}
                className='dsl-modal'
                isOpen={this.state.show}
                onClose={() => this.props.onClose.call(this)}
                actions={{}}>
                <PageSection variant={this.props.dark ? "darker" : "light"}>
                    {this.searchInput()}
                    <Tabs style={{overflow: 'hidden'}} activeKey={this.state.tabIndex} onSelect={this.selectTab}>
                        {CamelUi.getSelectorModelTypes(parentDsl, this.props.showSteps).map((label: any, index: number) => (
                            <Tab eventKey={label} key={"tab-" + label} title={<TabTitleText>{CamelUtil.capitalizeName(label)}</TabTitleText>}>
                                <Gallery key={"gallery-" + label} hasGutter className="dsl-gallery">
                                    {CamelUi.getSelectorModelsForParentFiltered(parentDsl, label, this.props.showSteps)
                                        .filter((dsl: DslMetaModel) => this.checkFilter(dsl))
                                        .map((dsl: DslMetaModel, index: number) => this.getCard(dsl, index))}
                                </Gallery>
                            </Tab>
                        ))}
                    </Tabs>
                </PageSection>
            </Modal>
        );
    }
}