import React from "react";
import {Badge, Content, Label} from "@patternfly/react-core";
import PlatformLogo from "@app/navigation/PlatformLogo";
import './PlatformLogos.css'

export const KARAVAN_PLATFORM_VERSION = "4.18.0";

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
                    <Badge className={badgeClassName}>{environment || ''}</Badge>
                </div>
            </Label>
        </div>
    )
}

export function PlatformVersions() {
    return (
        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: "center", gap: 6, paddingBottom: 6}}>
            <div className='platform-versions-item'>
                {PlatformLogo("platform-small-logo")}
                <p style={{fontSize: '12px', color: 'var(--pf-t--color--gray--30)'}}>{KARAVAN_PLATFORM_VERSION}</p>
            </div>
        </div>
    )
}

export function PlatformVersionWithName() {
    const brand = (
        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <div>
                {PlatformName(20)}
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

export function PlatformNameForToolbar() {
    return (<div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '3px',
    }}>
        {PlatformName()}
    </div>)
}

export const PlatformName = (height: number | string = 20, width: number | string = 292.797) => (
    <Content component={'h1'}>KARAVAN</Content>
)
