import React from 'react';
import './DashboardDevelopment.css'
import {DashboardDevelopmentRefresher} from "@features/dashboard/development/DashboardDevelopmentRefresher";
import {Drawer, DrawerContent, DrawerContentBody, Grid, GridItem} from "@patternfly/react-core";
import {DashboardDevelopmentCardStart} from "@features/dashboard/development/DashboardDevelopmentCardStart";
import {DashboardDevelopmentTopPanel} from "@features/dashboard/development/DashboardDevelopmentTopPanel";
import {ErrorBoundaryWrapper} from "@shared/ui/ErrorBoundaryWrapper";
import {DashboardDevelopmentDrawerPanel} from "@features/dashboard/development/DashboardDevelopmentDrawerPanel";
import {useDashboardStore} from "@stores/DashboardStore";
import {DashboardDevelopmentCardProjects} from "@features/dashboard/development/DashboardDevelopmentCardProjects";
import {DashboardDevelopmentCardCommits} from "@features/dashboard/development/DashboardDevelopmentCardCommits";
import {DashboardDevelopmentCardTeam} from "@features/dashboard/development/DashboardDevelopmentCardTeam";


function DashboardDevelopmentTab() {
    const {showSideBar} = useDashboardStore();

    return (
        <Drawer isExpanded={showSideBar !== null} position="end" onExpand={_ => {}}>
            <DrawerContent panelContent={<DashboardDevelopmentDrawerPanel/>}>
                <DrawerContentBody>
                    <ErrorBoundaryWrapper onError={error => console.error(error)}>
                        <div className="integration-development-panel">
                            <DashboardDevelopmentRefresher />
                            <Grid hasGutter className="integration-development-grid">
                                <GridItem span={7}>
                                    <DashboardDevelopmentTopPanel/>
                                </GridItem>
                                <GridItem span={5}>
                                    <DashboardDevelopmentCardStart/>
                                </GridItem>
                                <GridItem span={9} rowSpan={3}>
                                    <DashboardDevelopmentCardProjects/>
                                </GridItem>
                                <GridItem span={3} rowSpan={2}>
                                    <DashboardDevelopmentCardTeam/>
                                </GridItem>
                                <GridItem span={3} rowSpan={1}>
                                    <DashboardDevelopmentCardCommits/>
                                </GridItem>
                            </Grid>
                        </div>
                    </ErrorBoundaryWrapper>
                </DrawerContentBody>
            </DrawerContent>
        </Drawer>
    )
}

export default DashboardDevelopmentTab