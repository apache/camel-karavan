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

export function getNavigationFirstMenu(masActivated: boolean): MenuItem[] {
    const menus = [
        new MenuItem("dashboard", "Dashboard", SvgNavigationIcon({icon: 'dashboard'})),
        new MenuItem("projects", "Projects", SvgNavigationIcon({icon: 'apps'})),
        new MenuItem("events", "Events", SvgNavigationIcon({icon: 'landscape'})),
        new MenuItem("schemas", "Schemas", SvgNavigationIcon({icon: 'json-schema'})),
        new MenuItem("apis", "APIs", SvgNavigationIcon({icon: 'api'})),

    ]
    if (masActivated) {
        menus.push(
            new MenuItem("mcp", "MCP", SvgNavigationIcon({icon: 'mcp'})),
            new MenuItem("agents", "Agents", SvgNavigationIcon({icon: 'agents'}))
        )
    }
    menus.push(
        new MenuItem("settings", "Settings", SvgNavigationIcon({icon: 'settings'}))
    )
    return menus;
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

