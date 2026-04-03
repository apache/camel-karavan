import React from 'react';
import "./DashboardDevelopmentTopPanel.css"
import {useDashboardHook} from "@features/dashboard/useDashboardHook";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/running-icon";
import {InProgressIcon} from "@patternfly/react-icons";
import {Apps, CategoryNewEach, Gears, Idea, MessageQueue} from "@carbon/icons-react";
import {DashboardDevelopmentTopPanelCard} from "@features/dashboard/development/DashboardDevelopmentTopPanelCard";
import {Card, CardBody} from "@patternfly/react-core";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";

export function DashboardDevelopmentTopPanel() {

    const {
        healthUp,
        routeStateCounts,
        routesCount,
        messagesSucceeded,
        messagesInflight,
        messagesFailed,
        integrationsCount,
        healthDown,
    } = useDashboardHook();

    const className = "toggle-card";

    return (
        <Card isCompact className="dashboard-development-top-card">
            <CardBody>
                <div style={{
                    display: "flex",
                    flexDirection: 'row',
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: 'wrap', // Keeps wrapping enabled
                    width: '100%'     // Ensures it fills the parent
                }}>
                    {DashboardDevelopmentTopPanelCard("Projects", <Apps />, [
                        {label: integrationsCount, tooltip: "Designed", status: "info", icon: <Idea/>},
                        {label: healthUp, tooltip: "Started", status: "success", icon: <UpIcon className={"karavan-container-button-icon-up"}/>},
                        // {label: healthDown, tooltip: "Down", status: "danger", icon: <DownIcon/>},
                    ], className)}
                    {DashboardDevelopmentTopPanelCard("Routes", <CategoryNewEach />, [
                        {label: routesCount, tooltip: "Designed", status: "info", icon: <Idea/>},
                        {label: routeStateCounts["Started"] ?? 0, tooltip: "Started", status: "success", icon: <Gears />},
                        // {label: routeStateCounts["Suspended"] ?? 0, tooltip: "Suspended", status: "warning", icon: getDesignerIcon('routes', 'dashboard-icon-info')},
                        // {label: routeStateCounts["Stopped"] ?? 0, tooltip: "Stopped", status: "danger", icon: getDesignerIcon('routes', 'dashboard-icon-info')},
                        // {label: healthDown, tooltip: "Down", status: "danger", icon: <DownIcon/>},
                    ], className)}
                    {DashboardDevelopmentTopPanelCard("Messages", <MessageQueue />, [
                        {label: messagesSucceeded, tooltip: "Succeeded", status: "success", icon: <CheckCircleIcon/>},
                        {label: messagesFailed, tooltip: "Failed", status: "danger", icon: <ExclamationCircleIcon/>},
                        {label: messagesInflight, tooltip: "InFlight", status: "info", icon: <InProgressIcon/>},
                        // {label: lastFailedTime, tooltip: "Last Failed Time", status: "info", icon: <TimesIcon/>},
                    ], className)}
                </div>
            </CardBody>
        </Card>
    )
}