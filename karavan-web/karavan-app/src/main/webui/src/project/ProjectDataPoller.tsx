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

import React, {useEffect} from 'react';

import {KaravanApi} from "../api/KaravanApi";
import '../designer/karavan.css';
import {useAppConfigStore, useProjectStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {CamelStatus} from "../api/ProjectModels";

export function ProjectDataPoller() {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [project, setCamelStatuses, setCamelTraces, refreshTrace, setImages] = useProjectStore((s) =>
        [s.project, s.setCamelStatuses, s.setCamelTraces, s.refreshTrace, s.setImages], shallow);

    useEffect(() => {
        const interval = setInterval(() => onRefreshStatus(), 1000);
        return () => {
            clearInterval(interval)
        };
    }, [project, refreshTrace]);

    function onRefreshStatus() {
        const projectId = project.projectId;
        KaravanApi.getProjectCamelStatuses(projectId, config.environment, (res) => {
            if (res.status === 200) {
                setCamelStatuses(res.data);
            } else {
                setCamelStatuses([]);
            }
        })
        KaravanApi.getImages(project.projectId, (res: any) => {
            setImages(res)
        });
        if (refreshTrace) {
            KaravanApi.getProjectCamelTraces(projectId, config.environment, res => {
                if (res.status === 200) {
                    setCamelTraces(res.data);
                } else {
                    setCamelTraces([]);
                }
            })
        }
    }

    return (<></>)
}