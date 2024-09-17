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
import React, {useState} from 'react';
import '../designer/karavan.css';
import {
    Badge,
    Flex,
    FlexItem,
    PageSection,
    Switch,
    Tab,
    Tabs,
    Text,
    TextContent,
    TextInput,
    Toolbar,
    ToolbarContent
} from "@patternfly/react-core";
import {MainToolbar} from "../designer/MainToolbar";
import {KameletsTab} from "./kamelets/KameletsTab";
import {EipTab} from "./eip/EipTab";
import {ComponentsTab} from "./components/ComponentsTab";
import {useKnowledgebaseStore} from "./KnowledgebaseStore";
import {shallow} from "zustand/shallow";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import {KameletModel} from "karavan-core/lib/model/KameletModels";
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";
import {CamelModelMetadata, ElementMeta} from "karavan-core/lib/model/CamelMetadata";

interface Props {
    dark: boolean,
    changeBlockList: (type: string, name: string, checked: boolean) => void,
    showBlockCheckbox?: boolean,
}

export const KnowledgebasePage = (props: Props) => {

    const [setShowBlockCheckbox] = useKnowledgebaseStore((s) => [s.setShowBlockCheckbox], shallow)
    const [tab, setTab] = useState<string | number>("components");
    const [filter, setFilter] = useState<string>("");
    const [customOnly, setCustomOnly] = useState<boolean>(false);


    React.useEffect(() => {
        setShowBlockCheckbox(props.showBlockCheckbox === true)
    }, []);

    function title() {
        return <TextContent>
            <Text component="h2">Knowledgebase</Text>
        </TextContent>
    }

    function getTools() {
        return <Toolbar id="toolbar-group-types">
            <ToolbarContent>
                <Flex>
                {tab === 'kamelets' && <FlexItem>
                    <Switch
                        label="Custom only"
                        isChecked={customOnly}
                        onChange={(_event, checked) => setCustomOnly(checked)}
                    />
                </FlexItem>}
                <FlexItem>
                    <TextInput className="text-field" type="search" id="search" name="search"
                               value={filter}
                               onChange={(_event, value) => setFilter(value)}
                               autoComplete="off"
                               placeholder="Search by name"/>
                </FlexItem>
                </Flex>
            </ToolbarContent>
        </Toolbar>
    }

    let kameletList: KameletModel[] = KameletApi.getKamelets().filter(kamelet =>
            kamelet.spec.definition.title.toLowerCase().includes(filter.toLowerCase()));
    if (customOnly) kameletList = kameletList.filter(k => KameletApi.getCustomKameletNames().includes(k.metadata.name));

    const components = ComponentApi.getComponents().filter(c => {
        return c.component.name.toLowerCase().includes(filter.toLowerCase())
            || c.component.title.toLowerCase().includes(filter.toLowerCase())
            || c.component.description.toLowerCase().includes(filter.toLowerCase())
    }).sort((a, b) => (a.component.title?.toLowerCase() > b.component.title?.toLowerCase() ? 1 : -1)) ;

    const elements= CamelModelMetadata
        .filter(c => c.name.toLowerCase().includes(filter.toLowerCase())).sort((a: ElementMeta, b: ElementMeta) => a.name > b.name ? 1 : -1);

    return (
        <PageSection className="knowledgebase-section" padding={{default: 'noPadding'}}>
            <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                <MainToolbar title={title()} tools={getTools()}/>
            </PageSection>
            <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                <Flex direction={{default: "column"}} spaceItems={{default: "spaceItemsNone"}}>
                    <FlexItem>
                        <Tabs activeKey={tab} onSelect={(event, tabIndex) => setTab(tabIndex)}>
                            <Tab eventKey="components" title={<div style={{display: 'flex', gap:'6px'}}>Components<Badge className='label-component'>{components.length}</Badge></div>}/>
                            <Tab eventKey="eip" title={<div style={{display: 'flex', gap:'6px'}}>Integration Patterns<Badge className='label-eip'>{elements.length}</Badge></div>}/>
                            <Tab eventKey="kamelets" title={<div style={{display: 'flex', gap:'6px'}}>Kamelets<Badge className='label-kamelet'>{kameletList.length}</Badge></div>}/>
                        </Tabs>
                    </FlexItem>
                </Flex>
            </PageSection>
            <>
                {tab === 'kamelets' && <KameletsTab dark={props.dark}
                                                    kameletList={kameletList}
                                                    onChange={(name: string, checked: boolean) => props.changeBlockList('kamelet', name, checked)} />
                }
                {tab === 'eip' && <EipTab dark={props.dark} elements={elements}/>
                }
                {tab === 'components' && <ComponentsTab dark={props.dark}
                                                        components={components}
                                                        onChange={(name: string, checked: boolean) => props.changeBlockList('component', name, checked)} />
                }
            </>
        </PageSection>
    )

}