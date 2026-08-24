import React from 'react';
import {CompassContent, CompassHeader, Panel, PanelMain, PanelMainBody} from '@patternfly/react-core';

import "./AppMain.css"
import {MainRoutes} from "@compass/navigation/MainRoutes";
import {AppNavigation} from "./AppNavigation";
import {AppFooter} from "@compass/AppFooter";

export const AppMain: React.FunctionComponent = () => {

    return (
        <>
            <CompassHeader logo={<AppNavigation/>}/>
            <CompassContent>
                <Panel isScrollable isAutoHeight isGlass style={{overflow: "hidden", border: "1px solid var(--pf-t--global--background--color--primary--default)"}}>
                    <PanelMain style={{height:'100%'}}>
                        <PanelMainBody style={{height:'100%'}}>
                            <MainRoutes/>
                        </PanelMainBody>
                    </PanelMain>
                </Panel>
            </CompassContent>
            <AppFooter/>
        </>
    );
};