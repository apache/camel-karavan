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
import {AuthApi, getCurrentUser} from "@api/auth/AuthApi";
import React from "react";
import {SvgNavigationIcon} from "@shared/icons/SvgNavigationIcon";
import {KubernetesIcon} from "@features/project/designer/icons/ComponentIcons";
import {DockerIcon} from "@patternfly/react-icons";

export class MenuItem {
    pageId: string = '';
    name: string = '';
    icon: any;

    constructor(pageId: string, name: string, icon: any) {
        this.pageId = pageId;
        this.name = name;
        this.icon = icon;
    }
}

export function getNavigationFirstMenu(): MenuItem[] {
    return [
        new MenuItem("projects", "Projects", SvgNavigationIcon({icon: 'apps'})),
        new MenuItem("settings", "Settings", SvgNavigationIcon({icon: 'settings'})),
    ]
}


export function getNavigationSecondMenu(environment: string, infrastructure: string): MenuItem[] {
    const iconInfra = infrastructure === 'kubernetes' ? KubernetesIcon("infra-icon-k8s") : <DockerIcon className='infra-icon-docker'/>;

    const pages: MenuItem[] = []

    if (environment === 'dev') {
        pages.push(new MenuItem("documentation", "Learn", SvgNavigationIcon({icon: 'documentation'})));
    }

    if (getCurrentUser()?.roles?.includes('platform-admin')) {
        pages.push(new MenuItem("system", "System", iconInfra));
    }

    if (AuthApi.authType === 'session') {
        pages.push(new MenuItem("acl", "Access", SvgNavigationIcon({icon: 'access'})));
    }

    pages.push(new MenuItem("logout", "Logout", SvgNavigationIcon({icon: 'logout'})));

    return pages;
}

