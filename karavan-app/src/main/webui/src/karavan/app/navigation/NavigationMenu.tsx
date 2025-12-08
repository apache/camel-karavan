import {AuthApi, getCurrentUser} from "@api/auth/AuthApi";
import React from "react";
import {CamelIcon} from "@features/integration/designer/icons/KaravanIcons";
import {SvgNavigationIcon} from "@shared/icons/SvgNavigationIcon";
import {KubernetesIcon} from "@features/integration/designer/icons/ComponentIcons";
import DockerIcon from "@patternfly/react-icons/dist/esm/icons/docker-icon";

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

export function getNavigationMenu(environment: string, infrastructure: string): MenuItem[] {
    const iconInfra = infrastructure === 'kubernetes' ? KubernetesIcon("infra-icon-k8s") : <DockerIcon className='infra-icon-docker'/>;

    const pages: MenuItem[] = [
        new MenuItem("integrations", "Integrations", <CamelIcon />),
    ]
    // if (environment === 'dev') {
    //     pages.push(new MenuItem("services", "Services", <ServicesIcon/>))
    // }

    if (getCurrentUser()?.roles?.includes('platform-admin')) {
        pages.push(new MenuItem("system", "System", iconInfra));
    }

    if (AuthApi.authType === 'session') {
        pages.push(new MenuItem("acl", "Access", SvgNavigationIcon({icon: 'access', width: 24, height: 24})));
    }
    if (environment === 'dev') {
        pages.push(new MenuItem("documentation", "Docs", SvgNavigationIcon({icon: 'documentation', width: 24, height: 24})));
    }
    return pages;
}

