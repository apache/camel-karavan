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
