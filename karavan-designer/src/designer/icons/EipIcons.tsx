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
import React from 'react';

export function LoadBalanceIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="icon" width="32px" height="32px">
            <path
                d="M4 26h4v4H4zM14 26h4v4h-4zM24 26h4v4h-4zM25 16h-8v-2h-2v2H7a2.002 2.002 0 0 0-2 2v6h2v-6h8v6h2v-6h8v6h2v-6a2.002 2.002 0 0 0-2-2ZM9 2v10h14V2Zm2 2h2v6h-2Zm10 6h-6V4h6Z"/>
            <path
                d="M0 0h32v32H0z"
                data-name="&lt;Transparent Rectangle&gt;"
                style={{
                    fill: "none",
                }}
            />
        </svg>
    );
}

export function AggregateIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 700" className="icon" width="32px" height="32px">
            <path
                d="M496.2 417.71l-130.22 101.1c-.19.14-.39.29-.59.42a28.39 28.39 0 01-30.77 0c-.21-.13-.4-.28-.59-.42L203.8 417.71h292.4z"></path>
            <path
                d="M516.1 426.23v202.1c0 4.12-3.34 7.46-7.45 7.46H191.36c-4.11 0-7.46-3.34-7.46-7.46V426.22l138.52 107.53c.68.53 1.31.98 1.94 1.38 7.79 5.04 16.72 7.55 25.66 7.55s17.86-2.52 25.66-7.55c.62-.4 1.25-.85 1.94-1.38l138.5-107.52zM247.14 358.45l-12.91 30.22-.03.06v.03c-.11.21-.21.43-.32.64s-.23.42-.36.61c-.08.14-.17.27-.27.4-.08.11-.16.21-.24.31-.1.13-.21.25-.31.36-.08.09-.16.18-.24.25-.05.06-.1.11-.16.15l-.27.25c-.17.15-.33.29-.51.42-.15.13-.3.23-.47.33-.19.13-.39.25-.59.36s-.42.22-.63.31c-.22.1-.44.18-.66.26-.25.09-.49.17-.75.23-.2.05-.4.09-.61.13-.72.12-1.46.15-2.2.08-.19-.01-.36-.04-.55-.07-.04 0-.08-.02-.11-.02l-32.43-5.52a8.494 8.494 0 01-6.95-9.81 8.5 8.5 0 019.81-6.95l15.17 2.58-34.61-63.46a8.494 8.494 0 013.39-11.53c4.12-2.25 9.28-.73 11.53 3.39l34.61 63.46 6.04-14.15a8.508 8.508 0 0111.16-4.48c4.31 1.85 6.32 6.84 4.48 11.16zM452.86 358.45l12.91 30.22.03.06v.03c.11.21.21.43.32.64s.23.42.36.61c.08.14.17.27.27.4.08.11.16.21.24.31.1.13.21.25.31.36.08.09.16.18.24.25.05.06.1.11.16.15l.27.25c.17.15.33.29.51.42.15.13.3.23.47.33.19.13.39.25.59.36s.42.22.63.31c.22.1.44.18.66.26.25.09.49.17.75.23.2.05.4.09.61.13.72.12 1.46.15 2.2.08.19-.01.36-.04.55-.07.04 0 .08-.02.11-.02l32.43-5.52a8.494 8.494 0 006.95-9.81 8.5 8.5 0 00-9.81-6.95l-15.17 2.58 34.61-63.46c2.25-4.13.73-9.28-3.39-11.53s-9.28-.73-11.53 3.39l-34.61 63.46-6.04-14.15a8.508 8.508 0 00-11.16-4.48c-4.31 1.85-6.32 6.84-4.48 11.16zM260.53 145.6l-76.07 57.24c-5.52 4.16-13.24 4.16-18.76 0L89.62 145.6h170.91z"></path>
            <path
                d="M277.46 154.15V264.2c0 5.52-4.48 10-10 10H82.69c-5.52 0-10-4.48-10-10V154.14l82.79 62.29c5.77 4.34 12.69 6.51 19.6 6.51s13.83-2.17 19.6-6.51l82.78-62.28z"></path>
            <g>
                <path d="M610.57 145.6l-76.07 57.24c-5.52 4.16-13.24 4.16-18.76 0l-76.08-57.24h170.91z"></path>
                <path
                    d="M627.5 154.15V264.2c0 5.52-4.48 10-10 10H432.73c-5.52 0-10-4.48-10-10V154.14l82.79 62.29c5.77 4.34 12.69 6.51 19.6 6.51s13.83-2.17 19.6-6.51l82.78-62.28z"></path>
            </g>
        </svg>
    );
}

export function ToIcon(classname: string = '') {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={800}
            height={800}
            viewBox="0 0 32 32"
            className={classname ? "icon " + classname : "icon"}
        >
            <path d="m12.103 11.923 2.58 2.59H2.513v2h12.17l-2.58 2.59 1.41 1.41 5-5-5-5z"/>
            <path
                d="M9.513 23.013v-.5h2v.5a4.504 4.504 0 0 0 9 .36v-.86l.82-.1a7 7 0 0 0 0-13.88l-.82-.02v-.86a4.504 4.504 0 0 0-9 .36v.5h-2v-.5a6.5 6.5 0 0 1 12.86-1.3 9 9 0 0 1 0 17.6 6.5 6.5 0 0 1-12.86-1.3z"/>
            <path
                d="M0 0h32v32H0z"
                data-name="&lt;Transparent Rectangle&gt;"
                style={{
                    fill: "none",
                }}
            />
        </svg>
    );
}

export function PollIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={800}
            height={800}
            viewBox="0 0 32 32"
            className="icon"
        >
            <title>{"cloud--download"}</title>
            <path
                d="M10.013 23.513v-.5h2v.5a4.504 4.504 0 0 0 9 .36v-.86l.82-.1a7 7 0 0 0 0-13.88l-.82-.02v-.86a4.504 4.504 0 0 0-9 .36v.5h-2v-.5a6.5 6.5 0 0 1 12.86-1.3 9 9 0 0 1 0 17.6 6.5 6.5 0 0 1-12.86-1.3z"/>
            <path d="M18.013 17.013v-2H5.843l2.58-2.59-1.41-1.41-5 5 5 5 1.41-1.41-2.58-2.59z"/>
            <path
                d="M0 0h32v32H0z"
                data-name="&lt;Transparent Rectangle&gt;"
                style={{
                    fill: "none",
                }}
            />
        </svg>
    );
}

export function ChoiceIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 700" className="icon" width="32px" height="32px">
            <path
                d="M407.33 113.97V609.2c0 2.75-1.9 5-4.22 5H291.55c-2.33 0-4.22-2.25-4.22-5V113.97c0-2.76 1.89-5 4.22-5h111.56c2.32 0 4.22 2.24 4.22 5zM27.1 437.55l60.87-57.64c.95-.9 2.32-1.41 3.76-1.41H258.2c2.76 0 5 1.87 5 4.17v111.65c0 2.3-2.24 4.17-5 4.17H91.54c-1.38 0-2.7-.48-3.65-1.32L27.2 443.15c-1.77-1.58-1.81-3.99-.1-5.61zM667.57 285.62l-60.87 57.64c-.95.9-2.32 1.41-3.76 1.41H436.47c-2.76 0-5-1.87-5-4.17V228.85c0-2.3 2.24-4.17 5-4.17h166.66c1.38 0 2.7.48 3.65 1.32l60.69 54.02c1.77 1.58 1.81 3.99.1 5.61z"></path>
        </svg>
    );
}


export function SplitIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 700" className="icon" width="32px" height="32px">
            <path
                d="M496.2 83.65l-130.22 101.1c-.19.14-.39.29-.59.42a28.39 28.39 0 01-30.77 0c-.21-.13-.4-.28-.59-.42L203.8 83.65h292.4z"></path>
            <path
                d="M516.1 92.17v202.1c0 4.12-3.34 7.46-7.45 7.46H191.36c-4.11 0-7.46-3.34-7.46-7.46V92.16l138.52 107.53c.68.53 1.31.98 1.94 1.38 7.79 5.04 16.72 7.55 25.66 7.55s17.86-2.52 25.66-7.55c.62-.4 1.25-.85 1.94-1.38l138.5-107.52zM524.34 397.22l-12.91 30.22-.03.06v.03c-.11.21-.21.43-.32.64s-.23.42-.36.61c-.08.14-.17.27-.27.4-.08.11-.16.21-.24.31-.1.13-.21.25-.31.36-.08.09-.16.18-.24.25-.05.06-.1.11-.16.15l-.27.25c-.17.15-.33.29-.51.42-.15.13-.3.23-.47.33-.19.13-.39.25-.59.36s-.42.22-.63.31c-.22.1-.44.18-.66.26-.25.09-.49.17-.75.23-.2.05-.4.09-.61.13-.72.12-1.46.15-2.2.08-.19-.01-.36-.04-.55-.07-.04 0-.08-.02-.11-.02l-32.43-5.52a8.494 8.494 0 01-6.95-9.81 8.5 8.5 0 019.81-6.95l15.17 2.58-34.61-63.46a8.494 8.494 0 013.39-11.53c4.12-2.25 9.28-.73 11.53 3.39l34.61 63.46 6.04-14.15a8.508 8.508 0 0111.16-4.48c4.31 1.85 6.32 6.84 4.48 11.16zM175.66 399.19l12.91 30.22.03.06v.03c.11.21.21.43.32.64s.23.42.36.61c.08.14.17.27.27.4.08.11.16.21.24.31.1.13.21.25.31.36.08.09.16.18.24.25.05.06.1.11.16.15l.27.25c.17.15.33.29.51.42.15.13.3.23.47.33.19.13.39.25.59.36s.42.22.63.31c.22.1.44.18.66.26.25.09.49.17.75.23.2.05.4.09.61.13.72.12 1.46.15 2.2.08.19-.01.36-.04.55-.07.04 0 .08-.02.11-.02l32.43-5.52a8.494 8.494 0 006.95-9.81 8.5 8.5 0 00-9.81-6.95l-15.17 2.58 34.61-63.46c2.25-4.13.73-9.28-3.39-11.53s-9.28-.73-11.53 3.39l-34.61 63.46-6.04-14.15a8.508 8.508 0 00-11.16-4.48c-4.31 1.85-6.32 6.84-4.48 11.16zM260.43 467.71l-76.07 57.24c-5.52 4.16-13.24 4.16-18.76 0l-76.08-57.24h170.91z"></path>
            <path
                d="M277.36 476.26v110.05c0 5.52-4.48 10-10 10H82.59c-5.52 0-10-4.48-10-10V476.25l82.79 62.29c5.77 4.34 12.69 6.51 19.6 6.51s13.83-2.17 19.6-6.51l82.78-62.28z"></path>
            <g>
                <path d="M610.48 467.71l-76.07 57.24c-5.52 4.16-13.24 4.16-18.76 0l-76.08-57.24h170.91z"></path>
                <path
                    d="M627.41 476.26v110.05c0 5.52-4.48 10-10 10H432.64c-5.52 0-10-4.48-10-10V476.25l82.79 62.29c5.77 4.34 12.69 6.51 19.6 6.51s13.83-2.17 19.6-6.51l82.78-62.28z"></path>
            </g>
        </svg>
    );
}

export function SagaIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 700" className="icon" width="32px" height="32px">
            <path
                d="M626.41 255.77c-.56-4.77-2.95-9.03-6.71-11.99l-46.46-36.64-1.06-1.09-.8-.28c-.81-.52-1.67-.98-2.56-1.36-.43-.19-.85-.36-1.25-.5-.47-.16-.96-.31-1.51-.45-.47-.11-.96-.22-1.45-.3-.49-.08-.97-.14-1.43-.18-.96-.08-1.95-.08-2.91-.01-.41.03-.83.08-1.23.14-.41.06-.82.14-1.25.23l-.58.14c-.1.03-.2.05-.31.08-.11.03-.21.06-.3.09-.29.08-.57.18-.86.28-.49.17-.99.37-1.53.61l-.16.08c-.32.15-.65.31-.97.49-.49.26-.93.53-1.34.81-.39.26-.76.52-1.12.8l-46.96 37.05a17.823 17.823 0 00-6.72 12c-.57 4.77.76 9.47 3.72 13.21 3.42 4.36 8.56 6.86 14.12 6.86 4.01 0 7.96-1.37 11.12-3.87l17.82-14.05V438.9c0 25.31-10.5 49.83-28.8 67.29-18.09 17.26-41.65 26.13-66.35 24.99-47.06-2.21-84.23-39.8-86.39-86.44 20.51-3.9 39.27-14.42 53.46-30.11 16.07-17.77 24.91-40.72 24.91-64.63s-8.84-46.86-24.91-64.63c-14.24-15.74-33.09-26.28-53.7-30.15-1.52-32.97-15.83-64.54-39.77-87.4-25.27-24.1-58.24-36.49-92.84-34.88-67.7 3.16-120.74 58.77-120.74 126.63l.46 174.43c-20.98 7.36-35.58 27.43-35.58 50.14 0 29.27 23.81 53.08 53.08 53.08s53.09-23.81 53.09-53.08c0-22.71-14.6-42.79-35.59-50.14l.46-174.45c0-48.61 37.99-88.46 86.49-90.73 24.71-1.15 48.28 7.73 66.36 24.99 16.9 16.13 27.14 38.27 28.61 61.47-20.48 3.92-39.21 14.43-53.38 30.09-16.07 17.77-24.92 40.72-24.92 64.63s8.85 46.86 24.92 64.63c14.23 15.73 33.06 26.27 53.64 30.14 2.2 65.86 54.41 119.19 120.65 122.28 1.86.09 3.82.14 6 .14 32.35 0 63.19-12.44 86.84-35.02 25.37-24.21 39.91-58.2 39.91-93.27V257.92l17.82 14.06c7.78 6.13 19.09 4.79 25.22-2.98 2.98-3.76 4.31-8.46 3.74-13.23zm-290.7 132.81c-3.31 0-6.49-1.32-8.83-3.66l-24.76-24.75c-4.88-4.89-4.88-12.8 0-17.68 4.88-4.88 12.8-4.88 17.68 0l15.91 15.91 39.92-39.91c4.88-4.88 12.79-4.88 17.68 0 4.88 4.88 4.88 12.79 0 17.68l-48.76 48.75a12.504 12.504 0 01-8.84 3.66z"></path>
        </svg>
    );
}

export function TransformIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 700" className="icon" width="32px" height="32px">
            <path
                d="M441.77 277.51l-82.73 64.23c-.07.05-.13.09-.19.13-5.37 3.48-12.33 3.48-17.69.01-.07-.05-.13-.09-.18-.13l-82.76-64.24h183.54z"></path>
            <path
                d="M462.2 287.02V420.7c0 .98-.79 1.77-1.77 1.77H239.57c-.98 0-1.77-.79-1.77-1.77V287.02l90.91 70.56c.54.44 1.06.8 1.57 1.12 5.99 3.88 12.86 5.81 19.72 5.81s13.73-1.94 19.73-5.81c.49-.32 1.01-.68 1.58-1.13l90.89-70.55zM622.28 330.68l-35.89 31.78a1.48 1.48 0 01-1.98 0l-35.89-31.78c-.3-.26-.48-.63-.51-1.03-.02-.4.11-.79.38-1.09l11.28-12.73c.55-.61 1.49-.67 2.11-.12l12.44 11.02c-5.24-51.26-28.18-99.47-64.84-136.12-35.82-35.82-81.13-58.05-131.04-64.27-.1 0-.19-.03-.28-.06v.09s-9.35-.94-9.42-9.69c-.05-5.85 3.31-10.87 9.61-10.42.15-.03.3-.04.45-.02 55.19 6.39 105.27 30.67 144.83 70.23 40.9 40.89 66.02 94.81 70.96 152.11l14.54-12.87c.29-.27.68-.41 1.08-.38.4.03.77.21 1.03.51l11.27 12.73c.55.62.49 1.56-.13 2.11zM362.48 115.58l-31.79 35.89c-.26.3-.63.48-1.03.51-.4.02-.79-.11-1.08-.38l-12.72-11.27a1.49 1.49 0 01-.13-2.11l11.02-12.45c-51.25 5.24-99.47 28.18-136.13 64.84-32.4 32.41-53.91 73.12-62.2 117.73-.04.2-.11.38-.21.54-.42 2.15-2.28 8.68-9.58 8.74-5.75.05-10.7-3.2-10.43-9.3v-.02c-.03-.16-.03-.33 0-.49 8.58-49.85 32.19-95.26 68.28-131.34 40.9-40.9 94.82-66.03 152.11-70.97l-12.86-14.53a1.49 1.49 0 01.13-2.11l12.72-11.27c.62-.55 1.56-.49 2.11.12l31.79 35.89c.51.56.51 1.42 0 1.98zM331.08 583.33c.05 5.85-3.31 10.87-9.61 10.42h-.17c-55.19-6.39-105.27-30.67-144.83-70.23-44.17-44.16-69.56-102.59-71.72-164.84l-13.78 12.2c-.29.27-.68.41-1.08.38-.4-.03-.77-.21-1.03-.51l-11.27-12.73a1.49 1.49 0 01.13-2.11l35.89-31.78c.56-.5 1.42-.5 1.98 0l35.88 31.78c.62.55.68 1.49.13 2.11l-11.27 12.73c-.26.3-.63.48-1.03.51-.39.03-.79-.11-1.08-.38l-13.44-11.9c2.21 56.78 25.51 110.07 65.83 150.4 35.82 35.82 81.14 58.05 131.05 64.27 0 0 9.35.94 9.42 9.69zM593.75 378.68c-6.39 55.2-30.67 105.28-70.22 144.83-40.9 40.9-94.82 66.03-152.11 70.97l12.86 14.53c.55.62.49 1.56-.13 2.11l-12.73 11.28c-.27.25-.62.38-.99.38h-.09c-.4-.03-.77-.21-1.03-.51l-31.78-35.89c-.51-.56-.51-1.42 0-1.98l31.78-35.89c.55-.63 1.49-.68 2.11-.13l12.73 11.27c.3.26.48.63.51 1.03.02.4-.11.79-.38 1.08l-11.02 12.45c51.26-5.24 99.47-28.18 136.12-64.84 35.82-35.83 58.05-81.14 64.27-131.05.02-.14.05-.26.1-.38h-.13s.94-9.34 9.69-9.42c5.85-.04 10.87 3.32 10.42 9.61h-.03c.06.18.07.36.05.55z"></path>
        </svg>
    );
}

export function FilterIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" id="a" viewBox="0 0 700 700" className="icon" width="32px" height="32px">
            <path
                d="M565.62 156.56L413.36 350.33a10.032 10.032 0 00-2.14 6.18v190.52c0 19.05-25.01 34.49-55.86 34.49s-55.86-15.44-55.86-34.49V356.51c0-2.24-.75-4.42-2.14-6.18L145.1 156.56c-5.15-6.56-.48-16.18 7.87-16.18h404.79c8.34 0 13.02 9.62 7.86 16.18z"></path>
        </svg>
    );
}

export function SetExchangePatternIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            className="icon" width="32px" height="32px">
            <title>{"data-share"}</title>
            <path
                d="M5 25v-9.172l-3.586 3.586L0 18l6-6 6 6-1.414 1.414L7 15.828V25h12v2H7a2.002 2.002 0 0 1-2-2ZM24 22h4a2.002 2.002 0 0 1 2 2v4a2.002 2.002 0 0 1-2 2h-4a2.002 2.002 0 0 1-2-2v-4a2.002 2.002 0 0 1 2-2Zm4 6v-4h-4.002L24 28ZM4.226 1.135h4a2.002 2.002 0 0 1 2 2v4a2.002 2.002 0 0 1-2 2h-4a2.002 2.002 0 0 1-2-2v-4a2.002 2.002 0 0 1 2-2zm4 6v-4H4.225l.001 4zM27 6v9.172l3.586-3.586L32 13l-6 6-6-6 1.414-1.414L25 15.172V6H13V4h12a2.002 2.002 0 0 1 2 2Z"/>
            <path
                d="M0 0h32v32H0z"
                data-name="&lt;Transparent Rectangle&gt;"
                style={{
                    fill: "none",
                }}
            />
        </svg>
    );
}

export function SortIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 700" className="icon" width="32px" height="32px">
            <defs>
                <style>{".b{stroke-linejoin: round;}.b,.c {stroke-linecap: round;}.b,.c,.d {fill: none;stroke: #000;stroke-width: 35px;}.c,.d {stroke-miterlimit: 10;}"}</style>
            </defs>
            <path d="M160.63 168.63L160.63 531.37" className="d"></path>
            <path d="M576.31 170.27L269.3 170.27" className="c"></path>
            <path d="M517.53 290.64L269.3 290.64" className="c"></path>
            <path d="M458.75 411L269.3 411" className="c"></path>
            <path d="M399.97 531.37L269.3 531.37" className="c"></path>
            <path d="M197.7 197.95L160.63 168.71 123.55 197.95" className="b"></path>
            <path d="M123.55 502.12L160.62 531.37 197.7 502.12" className="b"></path>
        </svg>
    );
}

export function OnCompletion() {
    return (
        <svg
            className="icon" width="32px" height="32px"
            xmlns="http://www.w3.org/2000/svg"
            id="icon"
            fill="#000"
            viewBox="0 0 32 32"
        >
            <defs>
                <style>{".cls-1 { fill: none; }"}</style>
            </defs>
            <path d="M22 26.59L19.41 24 18 25.41 22 29.41 30 21.41 28.59 20 22 26.59z"></path>
            <circle cx="16" cy="16" r="2"></circle>
            <path d="M16 22a6 6 0 116-6 6.007 6.007 0 01-6 6zm0-10a4 4 0 104 4 4.005 4.005 0 00-4-4z"></path>
            <path d="M28 16a12 12 0 10-12 12v-2a10 10 0 1110-10z"></path>
            <path
                id="_Transparent_Rectangle_"
                d="M0 0H32V32H0z"
                className="cls-1"
                data-name="&lt;Transparent Rectangle&gt;"
            ></path>
        </svg>
    );
}

export function Intercept() {
    return (
        <svg
            className="icon" width="32px" height="32px"
            xmlns="http://www.w3.org/2000/svg"
            id="icon"
            fill="#000"
            viewBox="0 0 32 32"
        >
            <defs>
                <style>{".cls-1 {    fill: none; }"}</style>
            </defs>
            <path d="M15 4H17V28H15z"></path>
            <path
                d="M10 7v18H4V7h6m0-2H4a2 2 0 00-2 2v18a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2zM28 7v18h-6V7h6m0-2h-6a2 2 0 00-2 2v18a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2z"></path>
            <path
                id="_Transparent_Rectangle_"
                d="M0 0H32V32H0z"
                className="cls-1"
                data-name="&lt;Transparent Rectangle&gt;"
            ></path>
        </svg>
    );
}

export function InterceptFrom() {
    return (
        <svg
            className="icon" width="32px" height="32px"
            xmlns="http://www.w3.org/2000/svg"
            id="icon"
            fill="#000"
            viewBox="0 0 32 32"
        >
            <defs>
                <style>{".cls-1 {    fill: none; }"}</style>
            </defs>
            <path d="M26 30H14a2 2 0 01-2-2v-3h2v3h12V4H14v3h-2V4a2 2 0 012-2h12a2 2 0 012 2v24a2 2 0 01-2 2z"></path>
            <path d="M14.59 20.59L18.17 17 4 17 4 15 18.17 15 14.59 11.41 16 10 22 16 16 22 14.59 20.59z"></path>
            <path
                id="_Transparent_Rectangle_"
                d="M0 0H32V32H0z"
                className="cls-1"
                data-name="&lt;Transparent Rectangle&gt;"
            ></path>
        </svg>
    );
}

export function InterceptSendToEndpoint() {
    return (
        <svg
            className="icon" width="32px" height="32px"
            xmlns="http://www.w3.org/2000/svg"
            id="icon"
            fill="#000"
            viewBox="0 0 32 32"
        >
            <defs>
                <style>{".cls-1 {    fill: none; }"}</style>
            </defs>
            <path
                d="M6 30h12a2.002 2.002 0 002-2v-3h-2v3H6V4h12v3h2V4a2.002 2.002 0 00-2-2H6a2.002 2.002 0 00-2 2v24a2.002 2.002 0 002 2z"></path>
            <path
                d="M20.586 20.586L24.172 17 10 17 10 15 24.172 15 20.586 11.414 22 10 28 16 22 22 20.586 20.586z"></path>
            <path
                id="_Transparent_Rectangle_"
                d="M0 0H32V32H0z"
                className="cls-1"
                data-name="&lt;Transparent Rectangle&gt;"
            ></path>
        </svg>
    );
}