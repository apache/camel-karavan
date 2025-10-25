import DashboardIcon from "@patternfly/react-icons/dist/esm/icons/tachometer-alt-icon";
import IntegrationsIcon from "@patternfly/react-icons/dist/esm/icons/middleware-icon";
import EventsIcon from "@patternfly/react-icons/dist/esm/icons/stream-icon";
import ResourcesIcon from "@patternfly/react-icons/dist/esm/icons/blueprint-icon";
import ServicesIcon from "@patternfly/react-icons/dist/esm/icons/tools-icon";
import {AuthApi, getCurrentUser} from "@/auth/AuthApi";
import EnvironmentIcon from "@patternfly/react-icons/dist/esm/icons/cogs-icon";
import AccessIcon from "@patternfly/react-icons/dist/esm/icons/users-icon";
import DiagnosticIcon from "@patternfly/react-icons/dist/esm/icons/stethoscope-icon";
import DocumentationIcon from "@patternfly/react-icons/dist/esm/icons/book-open-icon";
import React from "react";

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

export function getNavigationMenu(environment: string): MenuItem[] {
    const pages: MenuItem[] = [
        new MenuItem("dashboard", "Dashboard", <DashboardIcon/>),
        new MenuItem("integrations", "Integrations", <IntegrationsIcon/>),
        new MenuItem("events", "Events", <EventsIcon/>),
        new MenuItem("resources", "Resources", <ResourcesIcon/>),
    ]
    if (environment === 'dev') {
        pages.push(new MenuItem("services", "Services", <ServicesIcon/>))
    }

    if (getCurrentUser()?.roles?.includes('platform-admin')) {
        pages.push(new MenuItem("system", "System", <EnvironmentIcon/>));
    }

    if (AuthApi.authType === 'sessionId') {
        pages.push(new MenuItem("acl", "Access", <AccessIcon/>));
    }
    pages.push(new MenuItem("diagnostics", "Diagnostics", <DiagnosticIcon/>));
    if (environment === 'dev') {
        pages.push(new MenuItem("documentation", "Docs", <DocumentationIcon/>));
    }
    return pages;
}

