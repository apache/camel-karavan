import React, {lazy, Suspense, useEffect, useMemo} from 'react';
import {Compass, Drawer, DrawerContent, DrawerContentBody} from '@patternfly/react-core';
import {AppDock} from "./AppDock";
import "./AppCompass.css"
import {useCompassStore} from "./useCompassStore";
import {shallow} from "zustand/shallow";
import {AppMain} from "@compass/AppMain";
import {ErrorBoundaryWrapper} from "@shared/ui/ErrorBoundaryWrapper";
import {useProjectPageStore} from "@page-project/ProjectPageStore";
import {useDashboardStore} from "@stores/DashboardStore";
import {useFilesStore} from "@stores/ProjectStore";
import {useCommandPaletteStore} from "@command-palette/useCommandPaletteStore";

// The palette embeds a Monaco editor, so it is only fetched when actually opened.
const CommandPaletteModal = lazy(() => import("@command-palette/CommandPaletteModal").then(m => ({default: m.CommandPaletteModal})));

const AppCompass: React.FunctionComponent = () => {

    const [
        isDockExpanded,
        isDockTextExpanded,
        isDrawerExpanded,
        drawerPanelContent,
        setIsDrawerExpanded
    ] = useCompassStore((s) => [
        s.isDockExpanded,
        s.isDockTextExpanded,
        s.isDrawerExpanded,
        s.drawerPanel,
        s.setIsDrawerExpanded
    ], shallow);

    const showPalette = useCommandPaletteStore((s) => s.showPalette)

    const showDashboardSideBar = useDashboardStore(s => s.showSideBar, shallow);
    const showProjectSideBar = useProjectPageStore(s => s.showSideBar, shallow);
    const showFilesSidebar = useFilesStore(s => s.showSideBar, shallow);

    useEffect(() => setIsDrawerExpanded(showDashboardSideBar !== null), [showDashboardSideBar]);
    useEffect(() => setIsDrawerExpanded(showProjectSideBar !== null), [showProjectSideBar]);
    useEffect(() => setIsDrawerExpanded(showFilesSidebar !== null), [showFilesSidebar]);

    const memoizedDock = useMemo(() => <AppDock/>, []);
    const memoizedMain = useMemo(() => <AppMain/>, []);

    return (
        <Drawer isExpanded={isDrawerExpanded} position="end" isPill onExpand={_ => {}}>
              <DrawerContent panelContent={drawerPanelContent}>
                  <DrawerContentBody>
                    <ErrorBoundaryWrapper onError={error => console.error(error)}>
                        <>
                            <Compass
                                className={"karavan"}
                                dock={memoizedDock}
                                isDockExpanded={isDockExpanded}
                                isDockTextExpanded={isDockTextExpanded}
                                main={memoizedMain}
                            />
                            {showPalette && <Suspense fallback={null}><CommandPaletteModal/></Suspense>}
                        </>
                    </ErrorBoundaryWrapper>
                  </DrawerContentBody>
              </DrawerContent>
          </Drawer>
    );
};
export default AppCompass