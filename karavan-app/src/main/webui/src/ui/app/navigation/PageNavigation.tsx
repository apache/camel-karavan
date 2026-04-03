import React, {useContext, useState} from 'react';
import {Button,} from '@patternfly/react-core';
import './PageNavigation.css';
import {useAppConfigStore, useDevModeStore, useFileStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {useLocation, useNavigate} from "react-router-dom";
import {SsoApi} from "@api/auth/SsoApi";
import {UserPopupOidc} from "../login/UserPopupOidc";
import {BUILD_IN_PROJECTS} from "@models/ProjectModels";
import DarkModeToggle from "@app/theme/DarkModeToggle";
import {AuthApi} from "@api/auth/AuthApi";
import {getNavigationFirstMenu, getNavigationSecondMenu, MenuItem} from "@app/navigation/NavigationMenu";
import {AuthContext} from "@api/auth/AuthProvider";
import {PlatformLogoBase64} from "@app/navigation/PlatformLogo";
import {PlatformVersions} from "@shared/ui/PlatformLogos";
import {useBrandStore} from "@stores/BrandStore";

function PageNavigation() {

    const [config] = useAppConfigStore((s) => [s.config], shallow)
    const {customLogo} = useBrandStore();
    const [setFile] = useFileStore((state) => [state.setFile], shallow)
    const [setStatus, setPodName] = useDevModeStore((state) => [state.setStatus, state.setPodName], shallow)
    const [pageId, setPageId] = useState<string>();
    const navigate = useNavigate();
    const location = useLocation();
    const {reload} = useContext(AuthContext);
    const firstMenu = getNavigationFirstMenu(config.environment, config.infrastructure);
    const secondMenu = getNavigationSecondMenu(config.environment, config.infrastructure);

    React.useEffect(() => {
        var page = location.pathname?.split("/").filter(Boolean)[0];
        if (page === 'projects') {
            var projectId = location.pathname?.split("/").filter(Boolean)[1];
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

    function onClick(page: MenuItem) {
        if (page.pageId === 'logout') {
            if (AuthApi.authType === 'oidc') {
                SsoApi.logout(() => {
                });
            } else if (AuthApi.authType === 'session') {
                AuthApi.logout().then(() => reload());
                // reload();
            }
        } else {
            setFile('none', undefined);
            setPodName(undefined);
            setStatus("none");
            setPageId(page.pageId);
            navigate(page.pageId);
        }
    }

    function getMenu(menu: MenuItem[]) {
        return (
            menu.map((page, index) => {
                let className = "nav-button";
                const isSelected = pageId === page.pageId;
                className = className.concat(isSelected ? " nav-button-selected" : "");
                return (
                    <div key={page.pageId} className={isSelected ? "nav-button-selected nav-button-wrapper" : "nav-button-wrapper"}>
                        <Button id={page.pageId}
                                style={{width: '100%'}}
                                variant={"link"}
                                className={className}
                            // countOptions={badge}
                                onClick={_ => onClick(page)}
                        >
                            <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px'}}>
                                {page.icon}
                                {page.name}
                            </div>
                        </Button>
                    </div>
                )
            })
        )
    }

    const Logo = (svgString: string) => {
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        return <img src={url} className="logo" alt="logo" />;
    };

    return (
        <div className="nav-buttons pf-v6-theme-dark">
            <div className='nav-button-part-wrapper'>
                {!customLogo && <img src={PlatformLogoBase64()} className="logo" alt='logo'/>}
                {customLogo && Logo(customLogo)}
            </div>
            <div style={{alignSelf: 'center'}} className='environment-wrapper'>
            </div>
            {getMenu(firstMenu)}
            <div style={{flex: 2}}/>
            {getMenu(secondMenu)}
            {AuthApi.authType === 'oidc' &&
                <div className='nav-button-part-wrapper'>
                    <UserPopupOidc/>
                </div>
            }
            <div className={"dark-mode-toggle"}>
                <DarkModeToggle/>
            </div>
            <PlatformVersions/>
        </div>
    )
}

export default PageNavigation