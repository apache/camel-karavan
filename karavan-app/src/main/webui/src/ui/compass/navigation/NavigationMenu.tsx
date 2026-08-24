import {AuthApi, getCurrentUser} from "@api/auth/AuthApi";
import React from "react";
import {SvgNavigationIcon} from "@shared/icons/SvgNavigationIcon";
import {DockerIcon} from "@patternfly/react-icons";
import {LogoKubernetes} from "@carbon/icons-react";

export class MenuItem {
    pageId: string = '';
    name: string = '';
    icon: any;
    preview: boolean = false;
    hideInNonDev: boolean = false;

    constructor(pageId: string, name: string, icon: any, preview: boolean = false, hideInNonDev: boolean = false) {
        this.pageId = pageId;
        this.name = name;
        this.icon = icon;
        this.preview = preview;
        this.hideInNonDev = hideInNonDev;
    }
}

export function getNavigationFirstMenu(): MenuItem[] {
    return [
        new MenuItem("projects", "Projects", SvgNavigationIcon({icon: 'apps'})),
        new MenuItem("settings", "Settings", SvgNavigationIcon({icon: 'settings'}), false, true)
    ];
}


export function getNavigationSecondMenu(environment: string, infrastructure: string): MenuItem[] {
    const iconInfra = infrastructure === 'kubernetes' ? <LogoKubernetes className={"infra-icon-k8s"}/> : <DockerIcon className='infra-icon-docker'/>;

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

