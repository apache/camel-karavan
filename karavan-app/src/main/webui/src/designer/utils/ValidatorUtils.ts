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
    return value
        // snake_case → kebab
        .replace(/_/g, '-')
        // camelCase → kebab
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        // collapse multiple dashes
        .replace(/-+/g, '-')
        // lowercase everything
        .toLowerCase();
}


export function toCamelCase(input: string): string {
    return input.trim()
        .toLowerCase()
        .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''));
}

export function fromCamelCase(input: string): string {
    return input
        // Insert a space before all caps (but not at the start)
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        // Handle sequences of capitals (like "ID" or "HTML")
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        // Lowercase first letter if you want a fully normalized sentence
        .trim();
}

export function toSpecialRouteId(input: string): string {
    // 1. Normalize to lowercase
    let name = input.toLowerCase();

    // 2. Replace spaces and underscores with dashes
    name = name.replace(/[\s_]+/g, '-');

    // 3. Remove invalid characters (keep a-z, 0-9, dash, dot)
    name = name.replace(/[^a-z0-9.-]/g, '');

    // 4. Collapse multiple dashes
    name = name.replace(/-+/g, '-');

    // 5. Trim leading/trailing dashes or dots
    name = name.replace(/^[-.]+|[-.]+$/g, '');

    // 6. Enforce length limit (32 chars max)
    if (name.length > 32) {
        name = name.slice(0, 32);
    }
    // 7. Ensure last char is alphanumeric
    name = name.replace(/[^a-z0-9]+$/g, '');
    return name;
}


