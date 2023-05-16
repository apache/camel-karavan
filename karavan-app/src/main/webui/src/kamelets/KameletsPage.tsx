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
    Toolbar,
    ToolbarContent,
    Gallery,
    ToolbarItem,
    TextInput,
    PageSection, TextContent, Text, PageSectionVariants, Flex, FlexItem, Badge, Button, Switch
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {KameletCard} from "./KameletCard";
import {KameletModel} from "karavan-core/lib/model/KameletModels";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import {KameletModal} from "./KameletModal";
import RefreshIcon from "@patternfly/react-icons/dist/esm/icons/sync-alt-icon";

interface Props {
    dark: boolean,
    onRefresh?: () => Promise<void>
}

interface State {
    kamelet?: KameletModel;
    isModalOpen: boolean;
    repository: string,
    path: string,
    kamelets: KameletModel[],
    filter: string,
    customOnly: boolean
}

export class KameletsPage extends React.Component<Props, State> {

    public state: State = {
        isModalOpen: false,
        repository: '',
        path: '',
        kamelets: [],
        filter: '',
        customOnly: false
    };

    componentDidMount() {
        this.setState({kamelets: KameletApi.getKamelets()})
    }

    select = (k: KameletModel) => {
        this.setState({kamelet: k, isModalOpen: true})
    }

    search(filter: string) {
        this.setState({ filter: filter, isModalOpen: false})
    }

    render() {
        const {dark, onRefresh} = this.props;
        const {kamelets, kamelet, isModalOpen, customOnly, filter} = this.state;
        let kameletList = kamelets.filter(kamelet => kamelet.spec.definition.title.toLowerCase().includes(filter.toLowerCase()));
        if (customOnly) kameletList = kameletList.filter(k => KameletApi.getCustomKameletNames().includes(k.metadata.name));
        return (
            <PageSection variant={dark ? PageSectionVariants.darker : PageSectionVariants.light}
                         padding={{default: 'noPadding'}} className="kamelet-section">
                <KameletModal key={kamelet?.metadata.name + isModalOpen.toString()}
                              isOpen={isModalOpen} kamelet={kamelet}/>
                <PageSection className="tools-section"
                             variant={dark ? PageSectionVariants.darker : PageSectionVariants.light}>
                    <Flex className="tools" justifyContent={{default: 'justifyContentSpaceBetween'}}>
                        <FlexItem>
                            <TextContent className="header">
                                <Text component="h2">Kamelet Catalog</Text>
                                <Badge isRead className="labels">{kamelets.length}</Badge>
                            </TextContent>
                        </FlexItem>
                        <FlexItem>
                            <Toolbar id="toolbar-group-types">
                                <ToolbarContent>
                                    <ToolbarItem>
                                        <Button icon={<RefreshIcon/>} variant="link"
                                                onClick={e => {
                                                    onRefresh?.call(this).then(value => {
                                                        this.setState({kamelets: KameletApi.getKamelets()});
                                                    })
                                                }}/>
                                    </ToolbarItem>
                                    <ToolbarItem>
                                        <Switch
                                            label="Custom only"
                                            isChecked={customOnly}
                                            onChange={checked => this.setState({customOnly: checked, isModalOpen: false})}
                                        />
                                    </ToolbarItem>
                                    <ToolbarItem>
                                        <TextInput className="text-field" type="search" id="search" name="search"
                                                   value={filter}
                                                   onChange={value => this.search(value)}
                                                   autoComplete="off"
                                                   placeholder="Search by name"/>
                                    </ToolbarItem>
                                </ToolbarContent>
                            </Toolbar>
                        </FlexItem>
                    </Flex>
                </PageSection>
                <PageSection isFilled className="kamelets-page"
                             variant={dark ? PageSectionVariants.darker : PageSectionVariants.light}>
                    <Gallery hasGutter>
                        {kameletList.map(k => (
                            <KameletCard key={k.metadata.name} kamelet={k} onClickCard={this.select}/>
                        ))}
                    </Gallery>
                </PageSection>
            </PageSection>
        );
    }
};