import React, {useState} from 'react';
import {capitalize, Content, Nav, NavItem, NavList} from '@patternfly/react-core';
import {DashboardToolbar} from "./DashboardToolbar";
import {RightPanel} from "@shared/ui/RightPanel";
import DashboardDevelopmentTab from "@features/dashboard/development/DashboardDevelopmentTab";

export const DashboardMenus = ['development', 'operations'] as const;
export type DashboardMenu = typeof DashboardMenus[number];

export function DashboardPage() {

    const [currentMenu, setCurrentMenu] = useState<DashboardMenu>(DashboardMenus[0]);

    const onNavSelect = (_: any, selectedItem: {
                             groupId: number | string;
                             itemId: number | string;
                             to: string;
                         }) => setCurrentMenu(selectedItem.itemId as DashboardMenu);

    function title() {
        return (
            <Content component="h2">Dashboard</Content>
        );
    }

    function getNavigation() {
        return (
            <Nav onSelect={onNavSelect} aria-label="Nav" variant="horizontal">
                <NavList>
                    {DashboardMenus.map((item, i) =>
                        <NavItem key={item} preventDefault itemId={item} isActive={currentMenu === item} to="#">
                            {capitalize(item)}
                        </NavItem>
                    )}
                </NavList>
            </Nav>
        )
    }

    return (
        <RightPanel
            title={title()}
            toolsStart={getNavigation()}
            tools={<DashboardToolbar/>}
            mainPanel={
                <div className="right-panel-card">
                    {currentMenu === 'development' && <DashboardDevelopmentTab/>}
                </div>
            }
        />
    )

}