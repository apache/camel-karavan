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
import {Badge, Button, capitalize, Content, Modal, ModalBody, ModalFooter, ModalHeader, TextInput, ToggleGroup, ToggleGroupItem} from '@patternfly/react-core';
import {InnerScrollContainer, OuterScrollContainer, Table, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import {InfrastructureAPI} from "../../utils/InfrastructureAPI";
import {useDesignerStore} from "../../DesignerStore";
import {shallow} from "zustand/shallow";
import {ExpressionEditor} from "../expression/ExpressionEditor";
import './ConfigurationSelectorModal.css'
import {useCodeStore} from "@features/project/designer/CodeStore";

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
    const [code, setCode] = useCodeStore((s) => [s.code, s.setCode], shallow);

    useEffect(() => {
        const newTabs = hideEditor ? defaultTabs.filter(tab => tab !== 'editor') : defaultTabs;
        setTabs(newTabs)
        setTabIndex(newTabs.includes(defaultTabIndex) ? defaultTabIndex : newTabs[0])
        setCode(customCode);
    }, [])

    useEffect(() => {
        setCode(customCode);
    }, [customCode])

    function checkFilter(name: string): boolean {
        if (filter !== undefined && name) {
            return name.toLowerCase().includes(filter.toLowerCase())
        } else {
            return true;
        }
    }

    function searchInput() {
        return (
            <TextInput type="text" id="search" name="search" autoComplete="off"
                       value={filter}
                       onChange={(_, value) => setFilter(value)}/>
        )
    }

    function getConfigMapTable() {
        const configMaps = InfrastructureAPI.configMaps;
        return (
            <OuterScrollContainer>
                <InnerScrollContainer>
                    <Table variant='compact' isStickyHeader>
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
                    <Table variant='compact' isStickyHeader>
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
            <OuterScrollContainer>
                <InnerScrollContainer>
                    <Table variant='compact' isStickyHeader>
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
                </InnerScrollContainer>
            </OuterScrollContainer>
        )
    }

    function getPropertiesTable() {
        return (
            <OuterScrollContainer>
                <InnerScrollContainer>
                    <Table variant='compact' isStickyHeader>
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
                </InnerScrollContainer>
            </OuterScrollContainer>
        )
    }

    function getExamplesTable() {
        return (
            <OuterScrollContainer>
                <InnerScrollContainer>
                    <Table variant='compact' isStickyHeader>
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
                </InnerScrollContainer>
            </OuterScrollContainer>
        )
    }

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
            event.preventDefault();
            onSave(props.name, code);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
        }
    }

    return (
        <Modal
            aria-label="Set property"
            width={"99%"}
            height={"99%"}
            className='configuration-selector-modal'
            isOpen={isOpen}
            onClose={onClose}
            position='top'
            elementToFocus="#modal-special-focus"
            onKeyDown={handleKeyDown}
        >
            <ModalHeader>
                <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8}}>
                    <div style={{flexGrow: 2, width: '100%'}}>
                        <Content component={'h3'}>{'Set from'}</Content>
                    </div>
                    <div style={{width: '300px'}}>
                        {tabIndex !== 'editor' && searchInput()}
                    </div>
                    <ToggleGroup>
                        {tabs.map(tab =>
                            <ToggleGroupItem buttonId={tab} key={tab} text={capitalize(tab)} isSelected={tab === tabIndex} onClick={() => setTabIndex(tab)}/>
                        )}
                    </ToggleGroup>
                </div>
            </ModalHeader>
            <ModalBody>
                {tabIndex === 'configMap' && getConfigMapTable()}
                {tabIndex === 'secret' && getSecretsTable()}
                {tabIndex === 'services' && getServicesTable()}
                {tabIndex === 'properties' && getPropertiesTable()}
                {tabIndex === 'examples' && getExamplesTable()}
                {tabIndex === 'editor' && !hideEditor &&
                    <ExEditor dark={dark} customCode={customCode} name={name} onChange={setCode} title={title} dslLanguage={dslLanguage}/>}
            </ModalBody>
            <ModalFooter>
                <Button key="save" variant="primary"
                        onClick={e => onSave(props.name, code)}>Save</Button>
                <Button key="cancel" variant="secondary"
                        onClick={e => onClose()}>Close</Button>
            </ModalFooter>
        </Modal>
    )
}