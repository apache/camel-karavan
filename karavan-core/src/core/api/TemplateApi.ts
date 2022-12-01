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

export const TemplateApi = {

    saveTemplates: (templates: Map<string, string>, clean: boolean = false) => {
        if (clean) Templates.clear();
        templates.forEach((value, key) => Templates.set(key, value));
    },

    saveTemplate: (name: string, code: string) => {
        Templates.set(name, code);
    },

    getTemplate: (name: string): string | undefined => {
        return Templates.get(name);
    },

    generateCode: (name: string, beanName: string): string | undefined => {
        return Templates.get(name)?.replaceAll("NAME", beanName);
    },


    saveJavaCodes: (javaCode: Map<string, string>, clean: boolean = false) => {
        if (clean) JavaCode.clear();
        javaCode.forEach((value, key) => JavaCode.set(key, value));
    },

    saveJavaCode: (name: string, code: string) => {
        JavaCode.set(name, code);
    },

    getJavaCode: (name: string): string | undefined => {
        return JavaCode.get(name);
    },
}