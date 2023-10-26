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
    ToggleGroupItem, ToggleGroup, FormHelperText, HelperText, HelperTextItem, TextInput, Select,
    SelectOption,
    SelectList, MenuToggleElement, MenuToggle, TextInputGroup, TextInputGroupMain, TextInputGroupUtilities,
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {Integration, KameletTypes, MetadataLabels} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {useFileStore, useProjectStore} from "../../api/ProjectStore";
import {ProjectFile, ProjectFileTypes} from "../../api/ProjectModels";
import {CamelUi} from "../../designer/utils/CamelUi";
import {ProjectService} from "../../api/ProjectService";
import {shallow} from "zustand/shallow";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {KameletApi} from "karavan-core/lib/api/KameletApi";

interface Props {
    types: string[],
    isKameletsProject: boolean
}

export function CreateFileModal(props: Props) {

    const [project] = useProjectStore((s) => [s.project], shallow);
    const [operation, setFile] = useFileStore((s) => [s.operation, s.setFile], shallow);
    const [name, setName] = useState<string>('');
    const [fileType, setFileType] = useState<string>();
    const [kameletType, setKameletType] = useState<KameletTypes>('source');
    const [inputValue, setInputValue] = useState<string>();
    const [selectIsOpen, setSelectIsOpen] = useState<boolean>(false);
    const [selectedKamelet, setSelectedKamelet] = useState<[string, string]>(['', '']);

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
            console.log(selectedKamelet, inputValue);
            const kameletName = name + (isKamelet ? '-' + kameletType : '');
            const integration = Integration.createNew(kameletName, 'kamelet');
            const meta: MetadataLabels = new MetadataLabels({"camel.apache.org/kamelet.type": kameletType});
            integration.metadata.labels = meta;
            return CamelDefinitionYaml.integrationToYaml(integration);
        } else {
            return '';
        }
    }

    function confirmAndCloseModal() {
        const extension = ProjectFileTypes.filter(value => value.name === fileType)[0].extension;
        const filename = (extension !== 'java') ? fileNameCheck(name) : CamelUi.javaNameFromTitle(name);
        const code = getCode();
        if (filename && extension) {
            const fullFileName = filename + (isKamelet ? '-' + kameletType : '') + '.' + extension;
            const file = new ProjectFile(fullFileName, project.projectId, code, Date.now());
            ProjectService.createFile(file);
            cleanValues();
            if (code) {
                setFile('select', file);
            } else {
                setFile("none");
            }
        }
    }

    function fileNameCheck(title: string) {
        return title.replace(/[^0-9a-zA-Z.]+/gi, "-").toLowerCase();
    }

    const isKamelet = props.isKameletsProject;
    const extension = ProjectFileTypes.filter(value => value.name === fileType)[0]?.extension;
    const filename = (extension !== 'java')
        ? fileNameCheck(name)
        : CamelUi.javaNameFromTitle(name);
    const fullFileName = filename + (isKamelet ? '-' + kameletType : '') + '.' + extension;

    const selectOptions: React.JSX.Element[] = []
    KameletApi.getKamelets()
        .filter(k => k.metadata.labels["camel.apache.org/kamelet.type"] === kameletType)
        .filter(k => k.spec.definition.title.toLowerCase().includes(inputValue?.toLowerCase() || ''))
        .forEach((kamelet) => {
        const s = <SelectOption key={kamelet.metadata.name}
                                value={kamelet.metadata.name}
                                description={kamelet.spec.definition.title}
                                isFocused={kamelet.metadata.name === selectedKamelet[0]}
                                onClick={event => {
                                    setSelectedKamelet([kamelet.metadata.name, kamelet.spec.definition.title]);
                                    setSelectIsOpen(false);
                                    setInputValue(kamelet.spec.definition.title)
                                }}
        />;
        selectOptions.push(s);
    })


    const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle variant={"typeahead"}
            isFullWidth
            ref={toggleRef}
            onClick={() => setSelectIsOpen(!selectIsOpen)}
            isExpanded={selectIsOpen}
            isDisabled={false}>
            <TextInputGroup isPlain>
                <TextInputGroupMain
                    value={inputValue}
                    onClick={event => {}}
                    onChange={(event, value) => {
                        setInputValue(value);
                        setSelectIsOpen(true)
                    }}
                    id="typeahead-select-input"
                    autoComplete="off"
                    // innerRef={textInputRef}
                    placeholder="Select Kamelet"
                    role="combobox"
                    isExpanded={selectIsOpen}
                    aria-controls="select-typeahead-listbox"
                />
            </TextInputGroup>
        </MenuToggle>
    );

    return (
        <Modal
            title={"Create " + (isKamelet ? "Kamelet" : "")}
            variant={ModalVariant.small}
            isOpen={["create", "copy"].includes(operation)}
            onClose={closeModal}
            actions={[
                <Button key="confirm" variant="primary" onClick={event => confirmAndCloseModal()}>Save</Button>,
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
                                                            setFileType(p.name);
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
                                                        setSelectedKamelet(['', ''])
                                                    }}/>
                        })}
                    </ToggleGroup>
                </FormGroup>}
                <FormGroup label="Name" fieldId="name" isRequired>
                    <TextInput id="name" aria-label="name" value={name} onChange={(_, value) => setName(value)}/>
                    <FormHelperText>
                        <HelperText id="helper-text1">
                            <HelperTextItem variant={'default'}>{fullFileName}</HelperTextItem>
                        </HelperText>
                    </FormHelperText>
                </FormGroup>
                {isKamelet && <FormGroup label="Copy from" fieldId="kamelet">
                    <Select
                        aria-label={"Kamelet"}
                        onOpenChange={isOpen => setSelectIsOpen(false)}
                        isOpen={selectIsOpen}
                        aria-labelledby={"Kamelets"}
                        toggle={toggle}
                        shouldFocusToggleOnSelect
                    >
                        <SelectList>
                            {selectOptions}
                        </SelectList>
                    </Select>
                </FormGroup>}
            </Form>
        </Modal>
    )
}