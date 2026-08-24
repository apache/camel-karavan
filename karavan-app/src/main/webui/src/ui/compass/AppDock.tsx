import React, {useContext, useRef} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {
    Badge,
    Brand,
    Button,
    CompassDockMain,
    Divider,
    Masthead,
    MastheadBrand,
    MastheadContent,
    MastheadLogo,
    MastheadMain,
    MastheadToggle,
    Nav,
    NavItem,
    NavList,
    Toolbar,
    ToolbarContent,
    ToolbarGroup,
    ToolbarItem,
    Tooltip
} from '@patternfly/react-core';
import logo from '../shared/icons/logo.svg';
import {AuthContext} from "@api/auth/AuthProvider";
import {getNavigationFirstMenu, getNavigationSecondMenu, MenuItem} from "@compass/navigation/NavigationMenu";
import {useAppConfigStore, useDevModeStore, useFileStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {BUILD_IN_PROJECTS} from "@models/ProjectModels";
import {useUIStore} from "@stores/useUIStore";
import {useCompassStore} from "./useCompassStore";
import "./AppDock.css"
import {useTheme} from "@compass/theme/ThemeContext";
import {useAppConfig} from "@compass/useConfig";

interface NavOnSelectProps {
    groupId: number | string;
    itemId: number | string;
    to: string;
}

export const AppDock: React.FunctionComponent = () => {

    const config = useAppConfigStore((s) => s.config);
    const {isDark} = useTheme();
    const {pageId, setPageId} = useUIStore();
    const [setFile] = useFileStore((state) => [state.setFile], shallow)
    const [setStatus, setPodName] = useDevModeStore((state) => [state.setStatus, state.setPodName], shallow)
    const {isDockExpanded, isDockTextExpanded, setIsDockTextExpanded} = useCompassStore();
    const {isDev} = useAppConfig();
    const navigate = useNavigate();
    const location = useLocation();
    const {logout} = useContext(AuthContext);
    const firstMenu = getNavigationFirstMenu()
    const secondMenu = getNavigationSecondMenu(config.environment, config.infrastructure);

    React.useEffect(() => {
        const page = location.pathname?.split("/").filter(Boolean)[0];
        if (page === 'projects') {
            const projectId = location.pathname?.split("/").filter(Boolean)[1];
            if (BUILD_IN_PROJECTS.includes(projectId)) {
                setPageId('settings');
            } else {
                setPageId(page);
            }
        } else if (page !== undefined) {
            setPageId(page);
        } else if (config.environment === 'dev') {
            setPageId('projects');
        } else {
            setPageId('dashboard');
        }
    }, [location]);


    // Intercept PatternFly Nav selections and route via React Router
    const onNavSelect = (_event: React.FormEvent<HTMLInputElement>, selectedItem: NavOnSelectProps) => {
        if (selectedItem.to) {
            navigate(selectedItem.to);
        }
    };

    function onClick(page: MenuItem) {
        if (page.pageId === 'logout') {
            logout();
        } else {
            setFile('none', undefined);
            setPodName(undefined);
            setStatus("none");
            setPageId(page.pageId);
            navigate(page.pageId);
        }
    }

    const dockedToggleRef = useRef<HTMLButtonElement>(null);

    const onToggleDock = () => {
        setIsDockTextExpanded(!isDockTextExpanded);
    };

    function getMenu(menu: MenuItem[]) {
        return (
            menu.filter(menuItem => isDev || (!menuItem.hideInNonDev && !isDev))
                .map((menuItem, index) => {
                const isSelected = pageId === menuItem.pageId;
                const notExpanded = !isDockTextExpanded && !isDockExpanded;
                const navItem =
                    <NavItem
                        key={menuItem.pageId}
                        preventDefault
                        id={menuItem.pageId}
                        itemId={menuItem.pageId}
                        isActive={isSelected}
                        icon={menuItem.icon}
                        aria-label={menuItem.name}
                        onClick={() => onClick(menuItem)}
                    >
                        {isDockTextExpanded && menuItem.name}
                    </NavItem>
                if (notExpanded) {
                    return <Tooltip key={menuItem.pageId} aria="none" aria-live="off" content={menuItem.name}>
                        {navItem}
                    </Tooltip>
                } else {
                    return (
                        <div style={{position: "relative"}}>
                            {navItem}
                            {menuItem.preview && <Badge className='nav-button-badge'>Preview</Badge>}
                        </div>
                    )
                }
            })
        )
    }

    return (
        <CompassDockMain>
            <Masthead display={{ default: 'inline' }} id="docked-masthead" variant="docked" className={isDark ? "" : "light-theme-dock"}>
                <MastheadMain style={{display: 'flex', flexDirection: isDockTextExpanded ? 'row' : 'column'}}>
                    <MastheadToggle>
                        <Button
                            ref={dockedToggleRef}
                            variant="plain"
                            isHamburger
                            onClick={onToggleDock}
                            aria-label="Global navigation"
                            isExpanded={isDockTextExpanded}
                        />
                    </MastheadToggle>
                    <MastheadBrand>
                        <MastheadLogo isCompact>
                        </MastheadLogo>
                        <MastheadLogo>
                            <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
                                width: !isDockTextExpanded ? '100%' : '5em'
                            }}>
                                <Brand src={logo} alt="Karavan" heights={{default: '37px'}}/>
                            </div>
                        </MastheadLogo>
                    </MastheadBrand>
                </MastheadMain>
                <Divider />
                <MastheadContent>
                    <Toolbar id="toolbar" isVertical>
                        <ToolbarContent>
                            <ToolbarItem>
                                <Nav variant="docked" aria-label="First" ouiaId="IconNavFirst">
                                    <NavList>
                                        {getMenu(firstMenu)}
                                    </NavList>
                                </Nav>
                            </ToolbarItem>
                            <ToolbarGroup
                                variant="action-group-plain"
                                align={{ default: 'alignEnd' }}
                                gap={{ default: 'gapNone', md: 'gapMd' }}
                            >
                                <ToolbarItem>
                                    <Nav variant="docked" aria-label="Second" ouiaId="IconNavSecond">
                                        <NavList>
                                            {getMenu(secondMenu)}
                                        </NavList>
                                    </Nav>
                                </ToolbarItem>
                            </ToolbarGroup>
                        </ToolbarContent>
                    </Toolbar>
                </MastheadContent>
            </Masthead>
        </CompassDockMain>
    );
};