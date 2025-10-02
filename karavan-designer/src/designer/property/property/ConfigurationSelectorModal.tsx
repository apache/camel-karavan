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
import React, {useEffect, useState} from 'react';
import {Badge, Button, capitalize, Flex, FlexItem, Modal, Text, TextContent, TextInput, ToggleGroup, ToggleGroupItem,} from '@patternfly/react-core';
import '../../karavan.css';
import {InnerScrollContainer, OuterScrollContainer, Table, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import {InfrastructureAPI} from "../../utils/InfrastructureAPI";
import {useDesignerStore} from "../../DesignerStore";
import {shallow} from "zustand/shallow";
import {ExpressionEditor} from "../expression/ExpressionEditor";

const SYNTAX_EXAMPLES = [
    {key: 'property:', value: 'group.property', description: 'Application property'},
    {key: 'env:', value: 'env:ENV_NAME', description: 'OS environment variable'},
    {key: 'sys:', value: 'sys:JvmPropertyName', description: 'JVM system property'},
    {key: 'bean:', value: 'bean:beanName.method', description: 'Bean’s method'}
]

interface Props {
    onSelect: (value: string) => void,
    onClose: () => void,
    isOpen: boolean,
    name: string,
    defaultTabIndex: string,
    customCode: any,
    onSave: (fieldId: string, value: string | number | boolean | any) => void,
    title: string,
    dslLanguage?: [string, string, string],
    hideEditor?: boolean
    dark: boolean,
    expressionEditor: React.ComponentType<any>;
}

export function ConfigurationSelectorModal(props: Props) {
    const ExEditor = props.expressionEditor ?? ExpressionEditor;
    const {onSelect, onClose, isOpen, name, defaultTabIndex, customCode, onSave, title, dslLanguage, hideEditor, dark} = props;

    const defaultTabs = InfrastructureAPI.infrastructure === 'kubernetes' ? ['properties', 'configMap', 'secret', 'services', 'examples', 'editor'] : ['properties', 'examples', 'services', 'editor'];
    const [propertyPlaceholders] = useDesignerStore((s) => [s.propertyPlaceholders], shallow)
    const [tabs, setTabs] = useState<string[]>([]);
    const [tabIndex, setTabIndex] = useState<string | number>();
    const [filter, setFilter] = useState<string>();


    useEffect(() => {
        const newTabs = hideEditor ? defaultTabs.filter(tab => tab !== 'editor') : defaultTabs;
        setTabs(newTabs)
        setTabIndex(newTabs.includes(defaultTabIndex) ? defaultTabIndex : newTabs[0])
    }, [])

    function checkFilter(name: string): boolean {
        if (filter !== undefined && name) {
            return name.toLowerCase().includes(filter.toLowerCase())
        } else {
            return true;
        }
    }

    function searchInput() {
        return (
            <TextInput className="text-field" type="text" id="search" name="search" autoComplete="off"
                       value={filter}
                       isDisabled={tabIndex === 'editor'}
                       onChange={(_, value) => setFilter(value)}/>
        )
    }

    function getConfigMapTable() {
        const configMaps = InfrastructureAPI.configMaps;
        return (
            <OuterScrollContainer>
                <InnerScrollContainer>
                    <Table variant='compact' borders={false} isStickyHeader>
                        <Thead>
                            <Tr>
                                <Th/>
                                <Th key='name'>Name</Th>
                                <Th key='data'>Data</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {configMaps
                                .filter(name => checkFilter(name))
                                .map((name, idx: number) => {
                                    const configMapName = name.split("/")[0];
                                    const data = name.split("/")[1];
                                    return (
                                        <Tr key={name}>
                                            <Td noPadding isActionCell>
                                                <Badge>CM</Badge>
                                            </Td>
                                            <Td noPadding>
                                                {configMapName}
                                            </Td>
                                            <Td noPadding>
                                                <Button style={{padding: '6px'}} variant={"link"} onClick={
                                                    e => onSelect?.("configmap:" + name)}>
                                                    {data}
                                                </Button>
                                            </Td>
                                        </Tr>
                                    )
                                })}
                        </Tbody>
                    </Table>
                </InnerScrollContainer>
            </OuterScrollContainer>
        )
    }

    function getSecretsTable() {
        const secrets = InfrastructureAPI.secrets;
        return (
            <OuterScrollContainer>
                <InnerScrollContainer>
                    <Table variant='compact' borders={false}>
                        <Thead>
                            <Tr>
                                <Th/>
                                <Th key='name'>Name</Th>
                                <Th key='data'>Data</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {secrets
                                .filter(name => checkFilter(name))
                                .map((name, idx: number) => {
                                    const configMapName = name.split("/")[0];
                                    const data = name.split("/")[1];
                                    return (
                                        <Tr key={name}>
                                            <Td noPadding isActionCell>
                                                <Badge>S</Badge>
                                            </Td>
                                            <Td noPadding>
                                                {configMapName}
                                            </Td>
                                            <Td noPadding>
                                                <Button style={{padding: '6px'}} variant={"link"} onClick={
                                                    e => onSelect?.("secret:" + name)}>
                                                    {data}
                                                </Button>
                                            </Td>
                                        </Tr>
                                    )
                                })}
                        </Tbody>
                    </Table>
                </InnerScrollContainer>
            </OuterScrollContainer>
        )
    }

    function getServicesTable() {
        const services = InfrastructureAPI.services;
        return (
            <Table variant='compact' borders={false}>
                <Thead>
                    <Tr>
                        <Th/>
                        <Th key='name'>Name</Th>
                        {/*<Th key='hostPort'>Host:Port</Th>*/}
                        <Th key='host'>Host</Th>
                        <Th key='port'>Port</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {services
                        .filter(name => checkFilter(name))
                        .map((name, idx: number) => {
                            const serviceName = name.split("|")[0];
                            const hostPort = name.split("|")[1];
                            const host = hostPort.split(":")[0];
                            const port = hostPort.split(":")[1];
                            return (
                                <Tr key={name}>
                                    <Td noPadding isActionCell>
                                        <Badge>S</Badge>
                                    </Td>
                                    {/*<Td noPadding>*/}
                                    {/*    {serviceName}*/}
                                    {/*</Td>*/}
                                    <Td noPadding>
                                        <Button style={{padding: '6px'}} variant={"link"} onClick={
                                            e => onSelect?.(hostPort)}>
                                            {serviceName}
                                        </Button>
                                    </Td>
                                    <Td noPadding>
                                        <Button style={{padding: '6px'}} variant={"link"} onClick={
                                            e => onSelect?.(host)}>
                                            {host}
                                        </Button>
                                    </Td>
                                    <Td noPadding>
                                        <Button style={{padding: '6px'}} variant={"link"} onClick={
                                            e => onSelect?.(port)}>
                                            {port}
                                        </Button>
                                    </Td>
                                </Tr>
                            )
                        })}
                </Tbody>
            </Table>
        )
    }

    function getPropertiesTable() {
        return (
            <Table variant='compact' borders={false}>
                <Thead>
                    <Tr>
                        <Th/>
                        <Th key='name'>Name</Th>
                        <Th key='port'>Value</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {propertyPlaceholders
                        .filter(pp => checkFilter(pp[0]))
                        .map((pp, index) => {
                            return (
                                <Tr key={pp[0]}>
                                    <Td noPadding isActionCell>
                                        <Badge>P</Badge>
                                    </Td>
                                    <Td noPadding>
                                        <Button style={{padding: '6px'}} variant={"link"} onClick={
                                            e => onSelect?.(`{{${pp[0]}}}`)}>
                                            {pp[0]}
                                        </Button>
                                    </Td>
                                    <Td noPadding>
                                        {pp[1]}
                                    </Td>
                                </Tr>
                            )
                        })}
                </Tbody>
            </Table>
        )
    }

    function getExamplesTable() {
        return (
            <Table variant='compact' borders={false}>
                <Thead>
                    <Tr>
                        <Th/>
                        <Th key='port'>Value</Th>
                        <Th key='port'>Description</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {SYNTAX_EXAMPLES
                        .filter(se => checkFilter(se.value))
                        .map(se => {
                            return (
                                <Tr key={se.key}>
                                    <Td noPadding isActionCell>
                                        <Badge>Syntax</Badge>
                                    </Td>
                                    <Td noPadding>
                                        <Button style={{padding: '6px'}} variant={"link"} onClick={
                                            e => onSelect?.(`{{${se.value}}}`)}>
                                            {se.value}
                                        </Button>
                                    </Td>
                                    <Td noPadding>
                                        {se.description}
                                    </Td>
                                </Tr>
                            )
                        })}
                </Tbody>
            </Table>
        )
    }


    return (
        <Modal
            aria-label="Set property"
            width={"99%"}
            height={"99%"}
            className='dsl-modal'
            isOpen={isOpen}
            onClose={onClose}
            header={
                <Flex direction={{default: "row"}} justifyContent={{default: "justifyContentSpaceBetween"}} style={{width: '90%'}}>
                    <FlexItem flex={{default: 'flex_2'}}>
                        <TextContent>
                            <Text component={'h3'}>{'Set from'}</Text>
                        </TextContent>
                    </FlexItem>
                    <FlexItem>
                        <ToggleGroup>
                            {tabs.map(tab =>
                                <ToggleGroupItem buttonId={tab} key={tab} text={capitalize(tab)} isSelected={tab === tabIndex} onClick={() => setTabIndex(tab)}/>
                            )}
                        </ToggleGroup>
                    </FlexItem>
                    <FlexItem>
                        {searchInput()}
                    </FlexItem>
                </Flex>
            }
            actions={{}}>
            <React.Fragment>
                {tabIndex === 'configMap' && getConfigMapTable()}
                {tabIndex === 'secret' && getSecretsTable()}
                {tabIndex === 'services' && getServicesTable()}
                {tabIndex === 'properties' && getPropertiesTable()}
                {tabIndex === 'examples' && getExamplesTable()}
                {tabIndex === 'editor' && !hideEditor && <ExEditor dark={dark} customCode={customCode} name={name} onClose={onClose} onSave={onSave} title={title} dslLanguage={dslLanguage}/>}
            </React.Fragment>
        </Modal>
    )
}