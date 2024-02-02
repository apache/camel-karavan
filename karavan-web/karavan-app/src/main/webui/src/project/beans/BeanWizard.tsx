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
    Badge,
    capitalize,
    Flex,
    Form, FormGroup,
    Modal,
    ModalVariant,
    Radio, Text, TextInput,
    Wizard,
    WizardHeader,
    WizardStep
} from '@patternfly/react-core';
import {KaravanApi} from "../../api/KaravanApi";
import {RegistryBeanDefinition} from "karavan-core/lib/model/CamelDefinition";
import {CodeUtils} from "../../util/CodeUtils";
import {ProjectFile, ProjectType} from "../../api/ProjectModels";
import {useWizardStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {ProjectService} from "../../api/ProjectService";

const BEAN_TEMPLATE_SUFFIX_FILENAME = "-bean-template.camel.yaml";

export function BeanWizard() {

    const [showWizard, setShowWizard] = useWizardStore((s) => [s.showWizard, s.setShowWizard], shallow)
    const [files, setFiles] = useState<ProjectFile[]>([]);
    const [templateNames, setTemplateNames] = useState<string[]>([]);
    const [templateName, setTemplateName] = useState<string>('');
    const [beanName, setBeanName] = useState<string>('');

    useEffect(() => {
        if (showWizard) {
            KaravanApi.getBeanTemplatesFiles(files => {
                const templateNames = files.map(file => file.name.replace(BEAN_TEMPLATE_SUFFIX_FILENAME, ''));
                setFiles(prevState => {
                    return [...files];
                });
                setTemplateNames(prevState => {
                    return [...templateNames];
                });
                setTemplateName('');
                setBeanName('');
            });
        }
    }, [showWizard]);


    function getRegistryBeanDefinitions():RegistryBeanDefinition[] {
        const fs = files
            .filter(f => f.name === templateName.concat(BEAN_TEMPLATE_SUFFIX_FILENAME));
        return CodeUtils.getBeans(fs);
    }

    const getBeans = useMemo(() => getRegistryBeanDefinitions(), [templateName]);

    return (
        <Modal title={"Bean"} onClose={_ => setShowWizard(false)}
               variant={ModalVariant.medium} isOpen={showWizard} onEscapePress={() => setShowWizard(false)}>
            <Wizard height={600} title="Bean configuration" onClose={() => setShowWizard(false)}>
                <WizardStep name={"Type"} id="type"
                            footer={{ isNextDisabled: !templateNames.includes(templateName) }}
                >
                    <Flex direction={{default:"column"}} gap={{default:'gapLg'}}>
                        {templateNames.map(n => <Radio id={n} label={capitalize(n)} name={n} isChecked={n === templateName}
                                                       onChange={_ => setTemplateName(n)} />)}
                    </Flex>
                </WizardStep>
                <WizardStep name={"Template"} id="template"
                            isDisabled={templateName.length == 0}
                            footer={{ isNextDisabled: !getBeans.map(b=> b.name).includes(beanName) }}
                >
                    <Flex direction={{default:"column"}} gap={{default:'gapLg'}}>
                    {getBeans.map(b => <Radio id={b.name} label={b.name} name={b.name} isChecked={b.name === beanName}
                                               onChange={_ => setBeanName(b.name)} />)}
                    </Flex>
                </WizardStep>
                <WizardStep name="Properties" id="properties"
                            isDisabled={templateName.length == 0 || beanName.length == 0}
                            footer={{ nextButtonText: 'Add bean' }}
                >
                    <Form>
                        {getBeans.filter(b=> b.name === beanName).map(b => (
                           <>
                               {Object.getOwnPropertyNames(b.properties).map(prop => (
                                   <FormGroup label={prop} fieldId={prop}>
                                       <TextInput
                                           value={b.properties[prop]}
                                           id={prop}
                                           aria-describedby={prop}
                                           onChange={(_, value) => {}}
                                       />
                                   </FormGroup>
                               ))}
                           </>
                        ))}
                    </Form>
                </WizardStep>
            </Wizard>
        </Modal>
    )
}