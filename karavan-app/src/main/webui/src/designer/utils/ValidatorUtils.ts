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

export function isSensitiveFieldValid(field: string): boolean {
    if (field === undefined || field.trim() === "") {
        return true;
    }
    if (field.startsWith("{{") && field.endsWith("}}")) {
        const content = field.slice(2, -2).trim();
        return content !== "";
    }
    if (field.startsWith("${") && field.endsWith("}")) {
        const content = field.slice(2, -1).trim();
        return content !== "";
    }
    return false;
}

export function toKebabCase(value: string): string {
    if (value.includes('_')) {
        // Convert snake_case to kebab-case
        return value.replace(/_/g, '-');
    } else if (/[a-z][A-Z]/.test(value)) {
        // Convert camelCase to kebab-case
        return value.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }
    // Assume already in kebab-case or other format, return as-is
    return value;
}


