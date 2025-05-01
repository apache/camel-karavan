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

import "./ElementIcon.css"
import React from 'react'

export function EnableStepIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="copy-button-icon"
            fill="none"
            viewBox="0 0 27 27"
        >
            <circle cx="13.5" cy="13.5" r="12" stroke="var(--pf-v5-global--primary-color--100)" strokeWidth="2"/>
            <polygon
                points="11,9 11,18 18,13.5"
                fill="var(--pf-v5-global--primary-color--100)"
            />
        </svg>
    )
}
export function DisableStepIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="copy-button-icon"
            fill="none"
            viewBox="0 0 27 27"
        >
            <circle cx="13.5" cy="13.5" r="12" stroke="var(--pf-v5-global--primary-color--100)" strokeWidth="2"/>
            <rect x="9" y="8" width="2.5" height="11" rx="1" fill="var(--pf-v5-global--primary-color--100)"/>
            <rect x="15.5" y="8" width="2.5" height="11" rx="1" fill="var(--pf-v5-global--primary-color--100)"/>
        </svg>
    )
}

export function CopyElementIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="copy-button-icon"
            fill="none"
            viewBox="0 0 27 27"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                style={{ stroke: "var(--pf-v5-global--primary-color--100)" }}
                d="M10.76 2.67a11.375 11.375 0 0 1 10.99 2.946c4.444 4.444 4.444 11.635 0 16.079s-11.635 4.444-16.079 0a11.375 11.375 0 0 1-2.946-10.99M17.14 10.29v6.86m0 0h-6.86m6.86 0L5.71 5.71"
            />
        </svg>
    )
}

export function DeleteElementIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlSpace="preserve"
            viewBox="0 0 32 32"
            className="delete-button-icon"
        >
            <circle cx="16" cy="16" r="14" stroke="var(--pf-v5-global--danger-color--100)" stroke-width="2" fill="none"/>
            <path d="M21.4 23 16 17.6 10.6 23 9 21.4l5.4-5.4L9 10.6 10.6 9l5.4 5.4L21.4 9l1.6 1.6-5.4 5.4 5.4 5.4z"></path>
        </svg>
    )
}

export function AddElementIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlSpace="preserve"
            viewBox="0 0 32 32"
            className="add-button-icon"
        >
            <path
                d="M16 4c6.6 0 12 5.4 12 12s-5.4 12-12 12S4 22.6 4 16 9.4 4 16 4m0-2C8.3 2 2 8.3 2 16s6.3 14 14 14 14-6.3 14-14S23.7 2 16 2z"/>
            <path d="M24 15h-7V8h-2v7H8v2h7v7h2v-7h7z"/>
            <path
                d="M0 0h32v32H0z"
                style={{
                    fill: "none",
                }}
            />
        </svg>
    )
}

export function InsertElementIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlSpace="preserve"
            viewBox="0 0 32 32"
            className="insert-button-icon"
        >
            <path d="m16 8-1.43 1.393L20.15 15H8v2h12.15l-5.58 5.573L16 24l8-8-8-8z" />
            <circle cx="16" cy="16" r="14" stroke="var(--pf-v5-global--primary-color--100)" stroke-width="2" fill="none"/>
        </svg>
    )
}