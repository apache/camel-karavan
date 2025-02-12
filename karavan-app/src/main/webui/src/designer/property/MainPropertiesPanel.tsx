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

import React, {useEffect, useState} from 'react';
import {Tab, Tabs, TabTitleIcon, TabTitleText,} from '@patternfly/react-core';
import "@patternfly/patternfly/patternfly.css";
import './DslProperties.css';
import {DslProperties} from "./DslProperties";
import {getDesignerIcon} from "../icons/KaravanIcons";
import {useDesignerStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";

export function MainPropertiesPanel() {

    const [tab] = useDesignerStore((s) =>  [s.tab], shallow)

    const [lastStatus, setLastStatus] = useState<boolean>(false);
    const [activeTabKey, setActiveTabKey] = React.useState<string | number>();
    const handleTabClick = (event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent, tabIndex: string | number) => {
        setActiveTabKey(tabIndex);
    };

    useEffect(() => {
        if (!lastStatus) {
            setActiveTabKey('properties');
            setLastStatus(true);
        }
    }, [])

    function getTab(title: string, icon: string, error: boolean = false) {
        const color = error ? "red" : "initial";
        return (
            <div className="top-menu-item" style={{color: color}}>
                <TabTitleIcon>{getDesignerIcon(icon)}</TabTitleIcon>
                <TabTitleText>{title}</TabTitleText>
            </div>
        )
    }

    function getPropertiesPanelTabs() {
        return (
            <div className={"main-tabs-wrapper"}>
                <Tabs className="main-tabs"
                      activeKey={activeTabKey}
                      onSelect={handleTabClick}
                      isFilled
                      aria-label="PropertyTypes"
                      role="proeprty-type"
                >
                    <Tab eventKey={'properties'} title={getTab('Properties', 'properties')} aria-label="Properties"/>
                </Tabs>
            </div>
        )
    }

    function getPropertiesPanel() {
        if (tab === "routes") {
            return <DslProperties designerType={"routes"}/>
        } else if (tab === "rest") {
            return <DslProperties designerType={"rest"}/>
        } else if (tab === "beans") {
            return <DslProperties designerType={"beans"}/>
        } else {
            return <></>
        }
    }

    return (
        <div className='main-properties'>
            {getPropertiesPanelTabs()}
            {activeTabKey === 'properties' && getPropertiesPanel() }
        </div>
    )
}
