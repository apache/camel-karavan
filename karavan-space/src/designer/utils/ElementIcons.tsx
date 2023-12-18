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

export function DeleteElementIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlSpace="preserve"
            viewBox="0 0 32 32"
            className="delete-button-icon"
        >
            <path d="M16 2C8.2 2 2 8.2 2 16s6.2 14 14 14 14-6.2 14-14S23.8 2 16 2zm0 26C9.4 28 4 22.6 4 16S9.4 4 16 4s12 5.4 12 12-5.4 12-12 12z" />
            <path
                d="M0 0h32v32H0z"
                style={{
                    fill: "none",
                }}
            />
            <path d="M21.4 23 16 17.6 10.6 23 9 21.4l5.4-5.4L9 10.6 10.6 9l5.4 5.4L21.4 9l1.6 1.6-5.4 5.4 5.4 5.4z" />
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
            <path d="M16 30a14 14 0 1 1 14-14 14.016 14.016 0 0 1-14 14Zm0-26a12 12 0 1 0 12 12A12.014 12.014 0 0 0 16 4Z" />
            <path
                d="M0 0h32v32H0z"
                data-name="&lt;Transparent Rectangle&gt;"
                style={{
                    fill: "none",
                }}
            />
        </svg>
    )
}