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

export function decapitalize(input: string) {
    return input[0].toLowerCase() + input.substring(1);
}

export function isEmpty(str: string) {
    return !str?.trim();
}

export function isValidFileName(input: string): boolean {
    const pattern =/^[a-zA-Z0-9._-]+$/;
    return pattern.test(input);
}

export function isValidProjectId(input: string): boolean {
    const pattern = /^[a-z][a-z0-9-]*$/;
    return pattern.test(input);
}

export function splitByBraces(input: string): string[] {
    const regex = /{[^{}]*}|[^{}]+/g;
    return input.match(regex) ?? [];
}

export function getPathParams(input: string): string[] {
    return splitByBraces(input).filter(p => p.startsWith('{')).map(p => p.replace('{', '').replace('}', ''));
}

export function getShortCommit(commitId: string): string {
    return commitId ? commitId?.substring(0, 7) : "-";
}

export function hasLowercase(password: string): boolean {
    const pattern = /[a-z]/;
    return pattern.test(password);
}

export function hasUppercase(password: string): boolean {
    const pattern = /[A-Z]/;
    return pattern.test(password);
}

export function hasDigit(password: string): boolean {
    const pattern = /\d/;
    return pattern.test(password);
}

export function hasSpecialCharacter(password: string): boolean {
    const pattern = /[@$!%*?&]/;
    return pattern.test(password);
}

export function hasMinimumLength(password: string, minLength: number = 8): boolean {
    return password.length >= minLength;
}

export function isValidPassword(password: string): boolean {
    return hasLowercase(password) &&
        hasUppercase(password) &&
        hasDigit(password) &&
        hasSpecialCharacter(password) &&
        hasMinimumLength(password);
}

export function getMegabytes(bytes?: number): number {
    return (bytes ? (bytes / 1024 / 1024) : 0);
}

export function nameToProjectId(str: string): string {
    let kebab = str
        .replace(/([a-z])([A-Z])/g, '$1-$2')     // handle camelCase to kebab
        .replace(/[^a-zA-Z0-9]+/g, '-')           // replace non-alphanumeric with dash
        .toLowerCase()
        .replace(/^-+|-+$/g, '');                 // trim leading/trailing dashes

    // Ensure the first character is a letter
    if (!/^[a-z]/.test(kebab)) {
        kebab = 't-' + kebab;
    }
    return kebab;
}

export function pathAndMethodToDescription(path: string, method: string = 'get'): string {
    // Define verbs for HTTP methods
    const verbs: Record<string, string> = {
        get: 'Get',
        post: 'Create',
        put: 'Update',
        patch: 'Update',
        delete: 'Delete'
    };

    // Remove leading/trailing slashes and split into parts
    const parts = path.replace(/^\/|\/$/g, '').split('/');
    // Separate out resource parts and parameters
    const resourceParts: string[] = [];
    const params: string[] = [];

    for (const part of parts) {
        if (part.startsWith('{') && part.endsWith('}')) {
            params.push(part.slice(1, -1));
        } else {
            resourceParts.push(part);
        }
    }

    // Capitalize each resource part and join as a phrase
    const isPlural = method === 'get' && path.endsWith('/{id}');
    let resource =
        resourceParts
            .map(word => word.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
            .join(' ');

    if (isPlural && resource.endsWith('s')) {
        resource = resource.slice(0, -1);
    }
    // Prepare the params phrase
    const paramStr = params.length ? ' by ' + params.join(' and ') : '';

    // Final verb
    const verb = verbs[method.toLowerCase()] || 'Access';

    return `${verb} ${resource}${paramStr}`;
}

export function dataTypeAndMethodToDescription(
    dataType: string,
    method: string,
    isList: boolean = false
): string {
    const pluralize = (word: string) => word.endsWith('s') ? word : word + 's';
    const typeWord = isList ? pluralize(dataType) : dataType;
    const typeWordLower = typeWord.charAt(0).toLowerCase() + typeWord.slice(1);

    switch (method.toUpperCase()) {
        case 'GET':
            return isList
                ? `List all ${typeWordLower}`
                : `Get a ${typeWordLower} by ID`;
        case 'POST':
            return `Create a new ${typeWordLower}`;
        case 'PUT':
            return `Replace a ${typeWordLower} by ID`;
        case 'PATCH':
            return `Update part of a ${typeWordLower} by ID`;
        case 'DELETE':
            return `Delete a ${typeWordLower} by ID`;
        default:
            return `${method} ${typeWordLower}`;
    }
}

function toTitleCase(str: string): string {
    return str
        .replace(/([A-Z])/g, ' $1') // add space before capital letters (for camelCase)
        .replace(/[_-]/g, ' ')      // replace _ and - with space
        .replace(/\s+/g, ' ')       // collapse multiple spaces
        .replace(/^./, s => s.toUpperCase()) // capitalize first letter
        .replace(/ ([a-z])/g, s => s.toUpperCase()); // capitalize after space
}

function singularize(word: string): string {
    // Simple plural to singular, you can improve this with a library if needed
    if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
    if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
    return word;
}

export function pathToDescription(path: string): string {
    const parts = path.replace(/^\/|\/$/g, '').split('/');

    const resourceParts: string[] = [];
    const paramParts: string[] = [];

    for (const part of parts) {
        if (part.startsWith('{') && part.endsWith('}')) {
            // parameter, e.g. {userId}
            const paramName = part.slice(1, -1);
            paramParts.push(
                toTitleCase(
                    paramName
                        .replace(/([a-z])([A-Z])/g, '$1 $2') // split camelCase
                        .replace(/_/g, ' ')
                )
            );
        } else {
            resourceParts.push(singularize(toTitleCase(part)));
        }
    }

    let description = resourceParts.join(' ');
    if (paramParts.length) {
        description += ' by ' + paramParts.join(' and ');
    }

    return description.trim();
}
export function calculateDuration(start: string, end: string): string {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    if (isNaN(startTime) || isNaN(endTime)) {
        return('');
    }
    let durationMs = endTime - startTime;
    return durationToString(durationMs);
}

export function durationToString(durationMs: number): string {
    if (durationMs < 0) {
        return 'Invalid duration';
    }

    const ms = durationMs % 1000;
    const seconds = Math.floor((durationMs / 1000) % 60);
    const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
    const hours = Math.floor((durationMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
    if (ms > 0 || parts.length === 0) parts.push(`${ms}ms`);

    return parts.join(' ');
}

export function toFakeUTCISOString(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const sec = String(date.getSeconds()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}T${hh}:${min}:${sec}Z`;
}

export function extractTitleFromMarkdown(markdown: string): string | null {
    // Step 1: Try to find title in the rehype ignore block
    const rehypeRegex = /<!--rehype:ignore:start-->([\s\S]*?)<!--rehype:ignore:end-->/;
    const rehypeMatch = markdown.match(rehypeRegex);

    if (rehypeMatch) {
        const titleTagRegex = /title:\s*(.+)/i;
        const titleMatch = rehypeMatch[1].match(titleTagRegex);
        if (titleMatch) {
            return titleMatch[1].trim();
        }
    }

    // Step 2: Fallback to first level-1 heading
    const headingRegex = /^#\s+(.+)$/m;
    const headingMatch = markdown.match(headingRegex);

    if (headingMatch) {
        return headingMatch[1].trim();
    }

    // If no title found
    return null;
}

export function convertAnyToString(value: any): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";

    // If it's already a string, check if it might be JSON
    if (typeof value === "string") {
        const trimmed = value.trim();

        // Try parsing directly (normal JSON string)
        try {
            const parsed = JSON.parse(trimmed);
            return JSON.stringify(parsed, null, 2);
        } catch {
            // Try parsing escaped JSON string
            try {
                const unescaped = trimmed.replace(/\\"/g, '"');
                const parsed = JSON.parse(unescaped);
                return JSON.stringify(parsed, null, 2);
            } catch {
                // Not JSON, return as-is
                return value;
            }
        }
    }

    // Handle objects and arrays
    if (typeof value === "object") {
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            // Circular reference or unserializable object
            return Object.prototype.toString.call(value);
        }
    }

    // Fallback for primitives (number, boolean, symbol, bigint, function)
    try {
        return String(value);
    } catch {
        return "[Unstringifiable value]";
    }
}

const placeholderRegexp = /\{\{\s*([^}:]+?)\s*\}\}/g;
export function replacePlaceholders(code: string, placeholders: Record<string, string>){
    return code.replace(placeholderRegexp, (match, rawKey) => {
        const key = rawKey.trim();
        return key in placeholders ? placeholders[key] : match;
    });
}

export function findPlaceholders(code: string): string[] {
    const regex = placeholderRegexp;
    const results: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(code)) !== null) {
        results.push(match[1].trim());
    }
    return [...new Set(results)];
}