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
import {Button, Content, Divider, DrawerHead, DrawerPanelBody, DrawerPanelContent,} from '@patternfly/react-core';
import {TimesIcon} from "@patternfly/react-icons";
import {useFilesStore} from "@stores/ProjectStore";

export function SourcesDrawerPanel() {

    const {title, setShowSideBar} = useFilesStore();

    return (
        <DrawerPanelContent className='async-drawer-panel' maxSize={'1000px'} defaultSize={'500px'} minSize={'500px'} isResizable>
            <DrawerHead>
                <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 16px 16px'}}
                     onClick={e => e.stopPropagation()}>
                    <Content style={{flex: 1}} component={'h6'}>{title}</Content>
                    <Button variant="link" icon={<TimesIcon/>} onClick={() => {
                        setShowSideBar(null);
                    }}></Button>
                </div>
            </DrawerHead>
            <DrawerPanelBody>
                    <Divider style={{marginTop: 0}}/>
                    <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '16px 16px 16px 16px'}}
                         onClick={e => e.stopPropagation()}>
                    </div>
            </DrawerPanelBody>
        </DrawerPanelContent>
    )
}