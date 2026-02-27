import React from "react";
import {Badge, Label} from "@patternfly/react-core";
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
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid"
        viewBox="0 0 292 20"
    >
        <path
            d="M44.653 161.954V26.52H0V3.287h114.694V26.52H70.04v135.434Zm68.34 0L174.647 3.287h27.54l63.24 158.667h-28.673l-14.62-37.853h-67.207l-14.054 37.853zm48.507-59.727h53.834l-27.427-69.133Zm126.934 59.727V3.287h25.386v135.32h69.134v23.347zm123.307 0V3.287h25.386v158.667Zm118.433 3.4q-16.433 0-32.186-4.647-15.64-4.76-26.407-13.6l12.467-19.38q5.666 4.874 13.146 8.387 7.594 3.513 16.094 5.44 8.5 1.813 17 1.813 15.526 0 25.046-5.893 9.634-5.893 9.634-17.227 0-8.5-6.574-14.393-6.46-5.893-24.026-10.88l-16.32-4.76q-22.44-6.46-32.754-17.113-10.2-10.654-10.2-26.52 0-10.54 4.194-19.04 4.306-8.5 12.013-14.734 7.82-6.233 18.36-9.52T532.781 0q15.98 0 29.693 4.647 13.714 4.647 22.667 12.467l-12.92 18.813q-4.873-4.42-11.447-7.593-6.46-3.174-13.94-4.874-7.48-1.7-15.186-1.7-9.52 0-16.887 2.834-7.253 2.72-11.333 7.933-4.08 5.213-4.08 12.693 0 5.44 2.72 9.52 2.72 4.08 9.293 7.48 6.687 3.287 18.36 6.687l17.227 5.1q21.986 6.46 32.186 16.887 10.2 10.313 10.2 26.86 0 14.167-7.026 24.933-6.914 10.654-20.174 16.66-13.26 6.007-31.96 6.007zm90.667-3.4V3.287h24.594l64.713 105.287-9.86.113 62.333-105.4h24.14v158.667h-24.82l.34-124.894 4.874 1.7-53.947 88.967h-18.587L639.655 38.76l4.08-1.7.34 124.894zm188.927 0L871.421 3.287h27.54l63.24 158.667h-28.673l-14.62-37.853h-67.207l-14.053 37.853zm48.507-59.727h53.833l-27.426-69.133zm126.933 59.727V3.287h24.254l80.127 115.26V3.287h24.706v158.667h-24.253l-80.013-116.62v116.62Z"
            aria-label="KARAVAN"
            style={{
                fill: "#06c",
                strokeWidth: 5.3487,
            }}
            transform="scale(.12095)"
        />
    </svg>
)
