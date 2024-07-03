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

const Templates: Map<string, string> = new Map<string, string>();
const JavaCode: Map<string, string> = new Map<string, string>();

export class TemplateApi {
    private constructor() {}

    static saveTemplates = (templates: Map<string, string>, clean: boolean = false): void => {
        if (clean) Templates.clear();
        templates.forEach((value, key) => Templates.set(key, value));
    };

    static saveTemplate = (name: string, code: string): void => {
        Templates.set(name, code);
    };

    static getTemplate = (name: string): string | undefined => {
        return Templates.get(name);
    };

    static generateCode = (name: string, beanName: string): string | undefined => {
        let template: string | undefined = TemplateApi.getTemplate(name);
        if (template) {
            return template.replaceAll('${NAME}', beanName);
        } else {
            throw new Error('Template not found');
        }
    };

    static saveJavaCodes = (javaCode: Map<string, string>, clean: boolean = false): void => {
        if (clean) JavaCode.clear();
        javaCode.forEach((value, key) => JavaCode.set(key, value));
    };

    static saveJavaCode = (name: string, code: string): void => {
        JavaCode.set(name, code);
    };

    static getJavaCode = (name: string): string | undefined => {
        return JavaCode.get(name);
    };
}
