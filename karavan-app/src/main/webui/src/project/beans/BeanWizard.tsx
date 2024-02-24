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
import React, {useEffect, useMemo, useState} from 'react';
import {
    capitalize,
    Flex,
    Form, FormGroup, FormHelperText, HelperText, HelperTextItem, InputGroup, InputGroupItem,
    Modal,
    ModalVariant,
    Radio, Text, TextInput,
    Wizard,
    WizardStep
} from '@patternfly/react-core';
import {KaravanApi} from "../../api/KaravanApi";
import {RegistryBeanDefinition} from "karavan-core/lib/model/CamelDefinition";
import {CodeUtils} from "../../util/CodeUtils";
import {ProjectFile} from "../../api/ProjectModels";
import {useFilesStore, useFileStore, useProjectStore, useWizardStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import {useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";
import * as yup from "yup";
import {ProjectService} from "../../api/ProjectService";
import {EventBus} from "../../designer/utils/EventBus";
import {useResponseErrorHandler} from "../../shared/error/UseResponseErrorHandler";
import {Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {BeanFilesDropdown} from "./BeanFilesDropdown";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";

const CAMEL_YAML_EXT = ".camel.yaml";
const EMPTY_BEAN = "empty";
const BEAN_TEMPLATE_SUFFIX_FILENAME = "-bean-template.camel.yaml";

export function BeanWizard() {

    const formValidationSchema = yup.object().shape({
        filename: yup
            .string()
            .matches(/^[a-zA-Z0-9_\-.]+$/, 'Incorrect filename')
            .required("File name is required"),
    });

    const {
        register,
        setError,
        handleSubmit,
        formState: {errors},
        reset,
        setValue
    } = useForm({
        resolver: yupResolver(formValidationSchema),
        mode: "onChange",
        defaultValues: {filename: ''}
    });

    const responseToFormErrorFields = new Map<string, string>([
        ["filename", "filename"]
    ]);

    const [project] = useProjectStore((s) => [s.project], shallow);
    const [operation, setFile, designerTab] = useFileStore((s) => [s.operation, s.setFile, s.designerTab], shallow);
    const [files] = useFilesStore((s) => [s.files], shallow);
    const [showWizard, setShowWizard] = useWizardStore((s) => [s.showWizard, s.setShowWizard], shallow)
    const [templateFiles, setTemplateFiles] = useState<ProjectFile[]>([]);
    const [templateNames, setTemplateNames] = useState<string[]>([]);
    const [templateName, setTemplateName] = useState<string>('');
    const [templateBeanName, setTemplateBeanName] = useState<string>('');
    const [bean, setBean] = useState<RegistryBeanDefinition | undefined>();
    const [filename, setFilename] = useState<string>('');
    const [beanName, setBeanName] = useState<string>('');

    const [globalErrors, registerResponseErrors, resetGlobalErrors] = useResponseErrorHandler(
        responseToFormErrorFields,
        setError
    );

    function handleOnFormSubmitSuccess(file: ProjectFile) {
        const message = "File successfully created.";
        EventBus.sendAlert("Success", message, "success");
        ProjectService.refreshProjectData(file.projectId);
        setFile('select', file, designerTab);
        setShowWizard(false);
    }

    function handleFormSubmit() {
        const file = files.filter(f=> f.name === (filename + CAMEL_YAML_EXT)).at(0);
        if (file && bean !== undefined) {
            const i = CamelDefinitionYaml.yamlToIntegration(file.name, file.code);
            const i2 = CamelDefinitionApiExt.addBeanToIntegration(i, bean);
            const file2 = {...file} as ProjectFile;
            file2.code = CamelDefinitionYaml.integrationToYaml(i2);
            ProjectService.updateFile(file2, false);
            handleOnFormSubmitSuccess(file2);
        } else {
            let code = '{}';
            if (bean !== undefined && templateName !== EMPTY_BEAN) {
                const i = Integration.createNew("temp");
                const i2 = CamelDefinitionApiExt.addBeanToIntegration(i, bean);
                code = CamelDefinitionYaml.integrationToYaml(i2);
            }
            const fullFileName = filename + CAMEL_YAML_EXT;
            const file = new ProjectFile(fullFileName, project.projectId, code, Date.now());
            return ProjectService.createFile(file)
                .then(() => handleOnFormSubmitSuccess(file))
                .catch((error) => registerResponseErrors(error));
        }
    }

    useEffect(() => {
        if (showWizard) {
            reset({filename: ''})
            setFilename('')
            setTemplateName('');
            setTemplateBeanName('');
            setBean(undefined);
            KaravanApi.getBeanTemplatesFiles(files => {
                const templateNames = files.map(file => file.name.replace(BEAN_TEMPLATE_SUFFIX_FILENAME, ''));
                setTemplateFiles(prevState => {
                    return [...files];
                });
                setTemplateNames(prevState => {
                    return [...templateNames];
                });
            });
        }
    }, [showWizard]);

    useEffect(() => {
        setBeanName(templateBeanName);
        getBeans.filter(b => b.name === templateBeanName).forEach(b => {
            Object.getOwnPropertyNames(b.properties).forEach(prop => {
                setBean(new RegistryBeanDefinition({...b}))
            })
        });
    }, [templateBeanName]);


    function getRegistryBeanDefinitions(): RegistryBeanDefinition[] {
        const fs = templateFiles
            .filter(f => f.name === templateName.concat(BEAN_TEMPLATE_SUFFIX_FILENAME));
        return CodeUtils.getBeans(fs);
    }

    const getBeans = useMemo(() => getRegistryBeanDefinitions(), [templateName]);

    return (
        <Modal title={"Bean"} onClose={_ => setShowWizard(false)}
               variant={ModalVariant.medium} isOpen={showWizard} onEscapePress={() => setShowWizard(false)}>
            <Wizard className="bean-wizard" height={600} onClose={() => setShowWizard(false)} onSubmit={event => handleFormSubmit()}>
                <WizardStep name={"Type"} id="type"
                            footer={{isNextDisabled: !templateNames.includes(templateName) && templateName !== EMPTY_BEAN}}
                >
                    <Flex direction={{default: "column"}} gap={{default: 'gapLg'}}>
                        <Radio key={EMPTY_BEAN} id={EMPTY_BEAN} label={capitalize(EMPTY_BEAN)} name={EMPTY_BEAN}
                               isChecked={EMPTY_BEAN === templateName} onChange={_ => setTemplateName(EMPTY_BEAN)}/>
                        {templateNames.map(n => <Radio key={n} id={n} label={capitalize(n)} name={n}
                                                       isChecked={n === templateName}
                                                       onChange={_ => setTemplateName(n)}/>)}
                    </Flex>
                </WizardStep>
                <WizardStep name={"Template"} id="template"
                            isHidden={templateName === EMPTY_BEAN}
                            isDisabled={templateName.length == 0}
                            footer={{isNextDisabled: !getBeans.map(b => b.name).includes(templateBeanName)}}
                >
                    <Flex direction={{default: "column"}} gap={{default: 'gapLg'}}>
                        {getBeans.map(b => <Radio key={b.name} id={b.name} label={b.name} name={b.name}
                                                  isChecked={b.name === templateBeanName}
                                                  onChange={_ => setTemplateBeanName(b.name)}/>)}
                    </Flex>
                </WizardStep>
                <WizardStep name="Properties" id="properties"
                            isHidden={templateName === EMPTY_BEAN}
                            isDisabled={templateName.length == 0 || templateBeanName.length == 0}
                >
                    <Form autoComplete="off">
                        <FormGroup key={"beanName"} label={"Name"} fieldId={"beanName"}>
                            <TextInput
                                value={beanName}
                                id={"beanName"}
                                aria-describedby={'beanName'}
                                onChange={(_, value) => setBeanName(value)}
                            />
                        </FormGroup>
                        <FormGroup label="Properties:" fieldId="properties"/>
                        {getBeans.filter(b => b.name === templateBeanName).map(b => (
                            <div key={b.name}>
                                {Object.getOwnPropertyNames(b.properties).map(prop => (
                                    <FormGroup key={prop} label={prop} fieldId={prop}>
                                        <TextInput
                                            value={bean?.properties[prop] || ''}
                                            id={prop}
                                            aria-describedby={prop}
                                            onChange={(_, value) => {
                                                const b = new RegistryBeanDefinition({...bean});
                                                b.properties[prop] = value;
                                                setBean(b);
                                            }}
                                        />
                                    </FormGroup>
                                ))}
                            </div>
                        ))}
                    </Form>
                </WizardStep>
                <WizardStep name={"File"} id={"file"}
                            footer={{nextButtonText: 'Save', onNext: handleSubmit(handleFormSubmit)}}
                            isDisabled={(templateName.length == 0 || templateBeanName.length == 0) && templateName !== EMPTY_BEAN}
                >
                    <Form autoComplete="off">
                        <FormGroup label="Filename" fieldId="filename" isRequired>
                            <InputGroup>
                                <InputGroupItem isFill>
                                    <TextInput className="text-field" type="text" id="filename"
                                               aria-label="filename"
                                               value={filename}
                                               customIcon={<Text>{CAMEL_YAML_EXT}</Text>}
                                               validated={!!errors.filename ? 'error' : 'default'}
                                               {...register('filename')}
                                               onChange={(e, value) => {
                                                   setFilename(value);
                                                   register('filename').onChange(e);
                                               }}
                                    />
                                </InputGroupItem>
                                {templateName !== EMPTY_BEAN && <InputGroupItem>
                                    <BeanFilesDropdown {...register('filename')} onSelect={(fn, event) => {
                                        setFilename(fn);
                                        setValue('filename', fn, {shouldValidate: true});
                                    }}/>
                                </InputGroupItem>}
                            </InputGroup>
                            {!!errors.filename && (
                                <FormHelperText>
                                    <HelperText>
                                        <HelperTextItem icon={<ExclamationCircleIcon/>} variant={"error"}>
                                            {errors?.filename?.message}
                                        </HelperTextItem>
                                    </HelperText>
                                </FormHelperText>
                            )}
                        </FormGroup>
                    </Form>
                </WizardStep>
            </Wizard>
        </Modal>
    )
}