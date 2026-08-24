import React from 'react';
import {CompassNavContent, CompassNavMain, Divider, Panel, PanelMain, PanelMainBody} from '@patternfly/react-core';
import {useCompassStore} from "./useCompassStore";
import {shallow} from "zustand/shallow";
import DarkModeToggle from "./theme/DarkModeToggle";

export const AppNavigation: React.FunctionComponent = () => {

    const [pageNav, pageTools] = useCompassStore((s) => [
        s.pageNav,
        s.pageTools
    ], shallow);

    return (
        <Panel isGlass>
            <PanelMain>
                <PanelMainBody>
                    <CompassNavContent style={{justifyContent: 'space-between'}}>
                        <CompassNavMain>
                            {pageNav}
                        </CompassNavMain>
                        <CompassNavMain>
                            {pageTools && (
                                <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 6, paddingTop: 6, gap: 6 }}>
                                    {pageTools}
                                    <Divider orientation={{default: 'vertical'}}/>
                                    <DarkModeToggle/>
                                </div>
                            )}
                        </CompassNavMain>
                    </CompassNavContent>
                </PanelMainBody>
            </PanelMain>
        </Panel>
    );
};