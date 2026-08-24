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
import '@designer/karavan.css';
import {ContainerLogTab} from "../logs/ContainerLogTab";
import {ProjectContainersContextProvider} from "../ProjectContainersContextProvider";
import {ContainerLogToolbar} from "../logs/ContainerLogToolbar";
import {useProjectPageStore} from "../ProjectPageStore";


export function BuildTab() {

    const setShowSideBar = useProjectPageStore(state => state.setShowSideBar);

    useEffect(() => {
        return () => {
            setShowSideBar(null);
        }
    }, [])

    const toolbar = (
        <div style={{display: "flex", flexWrap: "wrap", gap: 12}}>
            <ContainerLogToolbar/>
        </div>
    )

    return (
        <div style={{display: 'flex', flexDirection: 'column', height: "100%"}}>
            <div style={{flexGrow: 1, overflowY: 'auto'}}>
                <ProjectContainersContextProvider>
                    <ContainerLogTab additionalTools={toolbar} hideContainersToggle/>
                </ProjectContainersContextProvider>
            </div>
        </div>
    )
}
