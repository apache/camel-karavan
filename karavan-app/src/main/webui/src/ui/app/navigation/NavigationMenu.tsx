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

export function getNavigationFirstMenu(environment: string, infrastructure: string): MenuItem[] {
    const iconInfra = infrastructure === 'kubernetes' ? KubernetesIcon("infra-icon-k8s") : <DockerIcon className='infra-icon-docker'/>;
    const menus = [
        new MenuItem("dashboard", "Dashboard", SvgNavigationIcon({icon: 'dashboard'})),
        new MenuItem("projects", "Projects", SvgNavigationIcon({icon: 'apps'})),

    ]
    menus.push(
        new MenuItem("settings", "Settings", SvgNavigationIcon({icon: 'settings'}))
    )
    if (environment === 'dev') {
        menus.push(new MenuItem("documentation", "Learn", SvgNavigationIcon({icon: 'documentation'})));
    }

    if (getCurrentUser()?.roles?.includes('platform-admin')) {
        menus.push(new MenuItem("system", "System", iconInfra));
    }

    if (AuthApi.authType === 'session') {
        menus.push(new MenuItem("acl", "Access", SvgNavigationIcon({icon: 'access'})));
    }
    return menus;
}


export function getNavigationSecondMenu(environment: string, infrastructure: string): MenuItem[] {
    const iconInfra = infrastructure === 'kubernetes' ? KubernetesIcon("infra-icon-k8s") : <DockerIcon className='infra-icon-docker'/>;

    const pages: MenuItem[] = []
    pages.push(new MenuItem("logout", "Logout", SvgNavigationIcon({icon: 'logout'})));

    return pages;
}

