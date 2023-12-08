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
import {
    Button,
    Modal,
    FormGroup,
    ModalVariant,
    Form,
    ToggleGroupItem, ToggleGroup, FormHelperText, HelperText, HelperTextItem, TextInput,
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {Integration, KameletTypes, MetadataLabels} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {useFilesStore, useFileStore, useProjectStore} from "../../api/ProjectStore";
import {ProjectFile, ProjectFileTypes} from "../../api/ProjectModels";
import {CamelUi} from "../../designer/utils/CamelUi";
import {ProjectService} from "../../api/ProjectService";
import {shallow} from "zustand/shallow";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import {TypeaheadSelect, Value} from "../../designer/ui/TypeaheadSelect";

interface Props {
    types: string[],
    isKameletsProject: boolean
}

export function CreateFileModal(props: Props) {

    const [project] = useProjectStore((s) => [s.project], shallow);
    const [files] = useFilesStore((s) => [s.files], shallow);
    const [operation, setFile, designerTab] = useFileStore((s) => [s.operation, s.setFile, s.designerTab], shallow);
    const [name, setName] = useState<string>('');
    const [nameAvailable, setNameAvailable] = useState<boolean>(true);
    const [fileType, setFileType] = useState<string>();
    const [kameletType, setKameletType] = useState<KameletTypes>('source');
    const [selectedKamelet, setSelectedKamelet] = useState<string>();

    useEffect(() => {
        if (props.types.length > 0) {
            setFileType(props.types[0]);
        }
    }, [props]);

    function cleanValues() {
        setName("");
        setFileType(props.types.at(0) || 'INTEGRATION');
    }

    function closeModal() {
        setFile("none");
        cleanValues();
    }

    function getCode(): string {
        if (fileType === 'INTEGRATION') {
            return CamelDefinitionYaml.integrationToYaml(Integration.createNew(name, 'plain'));
        } else if (fileType === 'KAMELET') {
            const kameletName = name + (isKamelet ? '-' + kameletType : '');
            const integration = Integration.createNew(kameletName, 'kamelet');
            const meta: MetadataLabels = new MetadataLabels({"camel.apache.org/kamelet.type": kameletType});
            integration.metadata.labels = meta;
            if (selectedKamelet !== undefined && selectedKamelet !== '') {
                const kamelet= KameletApi.getKamelets().filter(k => k.metadata.name === selectedKamelet).at(0);
                if (kamelet) {
                    (integration as any).spec = kamelet.spec;
                    (integration as any).metadata.labels = kamelet.metadata.labels;
                    (integration as any).metadata.annotations = kamelet.metadata.annotations;
                    const i = CamelUtil.cloneIntegration(integration);
                    return CamelDefinitionYaml.integrationToYaml(i);
                }
            }
            return CamelDefinitionYaml.integrationToYaml(integration);
        } else {
            return '';
        }
    }

    function confirmAndCloseModal() {
        const code = getCode();
        const fullFileName = getFullFileName(name, fileType);
        const file = new ProjectFile(fullFileName, project.projectId, code, Date.now());
        ProjectService.createFile(file);
        cleanValues();
        if (code) {
            setFile('select', file, designerTab);
        } else {
            setFile("none");
        }
    }

    function getExistingFilenames(): string[] {
        return files.map(f => f.name);
    }

    function fileNameCheck(title: string) {
        return title.replace(/[^0-9a-zA-Z.]+/gi, "-").toLowerCase();
    }

    const isKamelet = props.isKameletsProject;

    const listOfValues: Value[] = KameletApi.getKamelets()
        .filter(k => k.metadata.labels["camel.apache.org/kamelet.type"] === kameletType)
        .map(k => {
            const v: Value = {value: k.metadata.name, children: k.spec.definition.title}
            return v;
        })

    function getFullFileName(name: string, type?: string) {
        let extension = ProjectFileTypes.filter(value => value.name === type)[0]?.extension;
        extension = extension === '*' ? '' : '.' + extension;
        const filename = (extension !== 'java')
            ? fileNameCheck(name)
            : CamelUi.javaNameFromTitle(name);
        return filename + (isKamelet ? '-' + kameletType : '') + extension;
    }

    function update(value: string, type?: string) {
        setName(value);
        const exists = getExistingFilenames().findIndex(f => f === getFullFileName(value, type)) === -1;
        setNameAvailable(exists);
        setFileType(type);
    }

    return (
        <Modal
            title={"Create " + (isKamelet ? "Kamelet" : "")}
            variant={ModalVariant.small}
            isOpen={["create", "copy"].includes(operation)}
            onClose={closeModal}
            actions={[
                <Button key="confirm" variant="primary" isDisabled={!nameAvailable || name === undefined || name.trim().length === 0}
                        onClick={event => confirmAndCloseModal()}>Save</Button>,
                <Button key="cancel" variant="secondary" onClick={event => closeModal()}>Cancel</Button>
            ]}
        >
            <Form autoComplete="off" isHorizontal className="create-file-form">
                {!isKamelet && <FormGroup label="Type" fieldId="type" isRequired>
                    <ToggleGroup aria-label="Type" isCompact>
                        {ProjectFileTypes.filter(p => props.types.includes(p.name))
                            .map(p => {
                                const title = p.title + ' (' + p.extension + ')';
                                return <ToggleGroupItem key={title} text={title} buttonId={p.name}
                                                        isSelected={fileType === p.name}
                                                        onChange={(_, selected) => {
                                                            update(name, p.name);
                                                        }}/>
                            })}
                    </ToggleGroup>
                </FormGroup>}
                {isKamelet && <FormGroup label="Type" fieldId="kameletType" isRequired>
                    <ToggleGroup aria-label="Kamelet Type">
                        {['source', 'action', 'sink'].map((type) => {
                            const title = CamelUtil.capitalizeName(type);
                            return <ToggleGroupItem key={type} text={title} buttonId={type}
                                                    isSelected={kameletType === type}
                                                    onChange={(_, selected) => {
                                                        setKameletType(type as KameletTypes);
                                                        setSelectedKamelet(undefined)
                                                    }}/>
                        })}
                    </ToggleGroup>
                </FormGroup>}
                <FormGroup label="Name" fieldId="name" isRequired>
                    <TextInput id="name"
                               aria-label="name"
                               value={name}
                               onChange={(_, value) => update(value, fileType)}/>
                    <FormHelperText>
                        <HelperText id="helper-text1">
                            <HelperTextItem variant={nameAvailable ? 'default' : 'error'}>
                                {!nameAvailable ? 'File ': ''}{getFullFileName(name, fileType)}{!nameAvailable ? ' already exists': ''}
                            </HelperTextItem>
                        </HelperText>
                    </FormHelperText>
                </FormGroup>
                {isKamelet && <FormGroup label="Copy from" fieldId="kamelet">
                    <TypeaheadSelect listOfValues={listOfValues} onSelect={value => {
                        setSelectedKamelet(value)
                    }}/>
                </FormGroup>}
            </Form>
        </Modal>
    )
}