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
import {PropertyMeta} from "core/model/CamelMetadata";
import {ComponentProperty} from "core/model/ComponentModels";
import {Property} from "core/model/KameletModels";

export class PropertyUtil {

    static hasDslPropertyValueChanged(property: PropertyMeta, value: any): boolean {
        const isSet = value !== undefined && !['id', 'uri', 'nodePrefixId'].includes(property.name);
        const defaultValue = property.type === 'boolean' ? property.defaultValue?.toString() || 'false' : property.defaultValue;
        const isDefault = defaultValue !== undefined && value?.toString() === defaultValue?.toString();
        return isSet && !isDefault;
    }

    static hasComponentPropertyValueChanged(property: ComponentProperty, value: any): boolean {
        const isSet = value !== undefined;
        const defaultValue = property.type === 'boolean' ? property.defaultValue?.toString() || 'false' : property.defaultValue;
        const isDefault = defaultValue !== undefined && value?.toString() === defaultValue?.toString();
        return isSet && !isDefault;
    }

    static hasKameletPropertyValueChanged(property: Property, value: any): boolean {
        const isSet = value !== undefined;
        const isDefault = property.default !== undefined && value?.toString() === property.default?.toString();
        return isSet && !isDefault;
    }
}