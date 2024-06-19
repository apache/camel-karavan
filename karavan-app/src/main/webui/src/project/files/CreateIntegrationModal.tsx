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
    ToggleGroupItem, ToggleGroup, Alert, FormAlert, capitalize,
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {KameletTypes} from "karavan-core/lib/model/IntegrationDefinition";
import {useFileStore, useProjectStore} from "../../api/ProjectStore";
import {getProjectFileTypeName, ProjectFile} from "../../api/ProjectModels";
import {ProjectService} from "../../api/ProjectService";
import {shallow} from "zustand/shallow";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import {TypeaheadSelect, Value} from "../../designer/ui/TypeaheadSelect";
import {SubmitHandler, useForm} from "react-hook-form";
import {EventBus} from "../../designer/utils/EventBus";
import {isValidFileName} from "../../util/StringUtils";
import {useFormUtil} from "../../util/useFormUtil";
import {KaravanApi} from "../../api/KaravanApi";
import {CodeUtils} from "../../util/CodeUtils";


export function CreateIntegrationModal() {

    const [project] = useProjectStore((s) => [s.project], shallow);
    const [operation, setFile, designerTab] = useFileStore((s) => [s.operation, s.setFile, s.designerTab], shallow);
    const [kameletType, setKameletType] = useState<KameletTypes>('source');
    const [selectedKamelet, setSelectedKamelet] = useState<string>();
    const [isReset, setReset] = React.useState(false);
    const [backendError, setBackendError] = React.useState<string>();
    const formContext = useForm<ProjectFile>({mode: "all"});
    const {getTextFieldSuffix} = useFormUtil(formContext);
    const {
        formState: {errors},
        handleSubmit,
        reset,
        trigger
    } = formContext;

    useEffect(() => {
        reset(new ProjectFile('', project.projectId, '', 0));
        setBackendError(undefined);
        setReset(true);
        setSelectedKamelet(undefined);
        setKameletType('source')
    }, [reset, operation]);

    React.useEffect(() => {
        isReset && trigger();
    }, [trigger, isReset]);

    function closeModal() {
        setFile("none");
    }

    const onSubmit: SubmitHandler<ProjectFile> = (data) => {
        data.projectId = project.projectId;
        data.name = getFullFileName(data.name);
        data.code = CodeUtils.getCodeForNewFile(data.name, getProjectFileTypeName(data), selectedKamelet);
        KaravanApi.saveProjectFile(data, (result, file) => {
            if (result) {
                onSuccess(file);
            } else {
                setBackendError(file?.response?.data);
            }
        })
    }

    function onSuccess(file: ProjectFile) {
        EventBus.sendAlert("Success", "File successfully created", "success");
        ProjectService.refreshProjectData(project.projectId);
        if (file.code) {
            setFile('select', file, designerTab);
        } else {
            setFile("none");
        }
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
        if (event.key === 'Enter') {
            handleSubmit(onSubmit)()
        }
    }

    const isKamelet = designerTab === 'kamelet';

    function listOfValues(type: KameletTypes): Value[] {
        return KameletApi.getKamelets()
            .filter(k => k.metadata.labels["camel.apache.org/kamelet.type"] === type)
            .map(k => {
                const v: Value = {value: k.metadata.name, children: k.spec.definition.title}
                return v;
            })
    }

    function getFileExtension() {
        return designerTab === 'kamelet' ? '.kamelet.yaml' : '.camel.yaml';
    }

    function getFileSuffix() {
        return (isKamelet ? '-' + kameletType : '') + getFileExtension();
    }

    function getFullFileName(name: string) {
        return name + getFileSuffix();
    }

    return (
        <Modal
            title={"Create " + (isKamelet ? "Kamelet" : capitalize(designerTab || ' '))}
            variant={ModalVariant.small}
            isOpen={["create", "copy"].includes(operation)}
            onClose={closeModal}
            onKeyDown={onKeyDown}
            actions={[
                <Button key="confirm" variant="primary" onClick={handleSubmit(onSubmit)}
                        isDisabled={Object.getOwnPropertyNames(errors).length > 0}
                >
                    Save
                </Button>,
                <Button key="cancel" variant="secondary" onClick={closeModal}>Cancel</Button>
            ]}
        >
            <Form autoComplete="off" isHorizontal className="create-file-form">
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
                {getTextFieldSuffix('name', 'Name', getFileSuffix(), {
                    regex: v => isValidFileName(v) || 'Only characters, numbers and dashes allowed',
                    length: v => v.length > 3 || 'File name should be longer that 3 characters',
                    name: v => !['templates', 'kamelets', 'karavan'].includes(v) || "'templates', 'kamelets', 'karavan' can't be used as project",
                })}
                {isKamelet &&
                    <FormGroup label="Copy from" fieldId="kamelet">
                        <TypeaheadSelect key={kameletType} listOfValues={listOfValues(kameletType)} onSelect={value => {
                            setSelectedKamelet(value)
                        }}/>
                    </FormGroup>
                }
                {backendError &&
                    <FormAlert>
                        <Alert variant="danger" title={backendError} aria-live="polite" isInline/>
                    </FormAlert>
                }
            </Form>
        </Modal>
    )
}