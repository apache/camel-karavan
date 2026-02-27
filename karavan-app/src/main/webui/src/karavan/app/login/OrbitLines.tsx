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

const OrbitLines = () => {
    return (
        <svg
            className="orbit-lines-svg"
            viewBox="0 0 400 400"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                {/* The Magic Gradient: Orange to Transparent to Blue */}
                <linearGradient id="orbit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ec7a08" stopOpacity="1" />
                    <stop offset="50%" stopColor="#f97316" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#0066cc" stopOpacity="1" />
                </linearGradient>

                {/* The Glow Effect */}
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Outer Ring (Matches your icon radius of 150px) */}
            <circle
                cx="200" cy="200" r="170"
                fill="none"
                stroke="url(#orbit-grad)"
                strokeWidth="2"
                filter="url(#glow)"
                opacity="1"
            />

            {/* Inner Decorative Ring (Smaller, thinner) */}
            <circle
                cx="200" cy="200" r="130"
                fill="none"
                stroke="url(#orbit-grad)"
                strokeWidth="1"
                strokeDasharray="10 10" /* Makes it dashed/techy */
                filter="url(#glow)"
                opacity="0.5"
            />
        </svg>
    );
};

export default OrbitLines;