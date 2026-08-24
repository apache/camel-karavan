import React from "react";
import {Badge, Label} from "@patternfly/react-core";
import PlatformLogo from "@compass/navigation/PlatformLogo";
import {CamelIcon, KaravanIcon} from "@designer/icons/KaravanIcons";
import './PlatformLogos.css'

export const KARAVAN_PLATFORM_VERSION = "4.22.0";
export const CAMEL_VERSION = "4.22.0";

interface PlatformVersionProps {
    environment: string
    short?: boolean
}

export function PlatformVersion(props: PlatformVersionProps) {
    const {environment, short} = props;
    const full = short !== true;
    const badgeClassName = environment === 'dev' ? 'environment-dev'
        : (environment === 'prod' ? 'environment-prod' : 'var(environment-default)');

    return (
        <div className="platform-versions">
            <Label variant='outline' color='blue'>
                <div className='platform-versions-item'>
                    {full && PlatformLogo("platform-small-logo")}
                    <p className='platform-version'>{KARAVAN_PLATFORM_VERSION}</p>
                    {full && CamelIcon()}
                    <p className='platform-version'>{CAMEL_VERSION}</p>
                    <Badge className={badgeClassName}>{environment || ''}</Badge>
                </div>
            </Label>
        </div>
    )
}

export function PlatformVersions() {
    return (
        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: "center", gap: 6}}>
            <div className='platform-versions-item'>
                {PlatformLogo("platform-small-logo")}
                <p style={{fontSize: '12px', color: 'var(--pf-t--global--text--color--subtle)'}}>{KARAVAN_PLATFORM_VERSION}</p>
            </div>
            <div className='platform-versions-item'>
                {CamelIcon()}
                <p style={{fontSize: '12px', color: 'var(--pf-t--global--text--color--subtle)'}}>{CAMEL_VERSION}</p>
            </div>
        </div>
    )
}

export function PlatformNameForToolbar() {
    const brand = (
        <div className={"platform-name-toolbar-wrapper"}>
            <div className={"platform-name-toolbar"}>
                {KaravanIcon()}
            </div>
        </div>
    )

    return (<div style={{
        padding: '0',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'end',
    }}>
        {brand}
    </div>)
}

export function PlatformNameForLogin() {
    return (<div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '3px',
    }}>
        {KaravanIcon()}
    </div>)
}

