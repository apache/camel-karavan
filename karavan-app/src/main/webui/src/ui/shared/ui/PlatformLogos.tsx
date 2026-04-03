import React from "react";
import {Badge, Content, Label} from "@patternfly/react-core";
import {CamelIcon} from "@features/project/designer/icons/KaravanIcons";
import './PlatformLogos.css'
import {useBrandStore} from "@stores/BrandStore";

export const CAMEL_VERSION = "4.18.1";

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
        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: "center", gap: 6, paddingBottom: 6}}>
            <div className='platform-versions-item'>
                {CamelIcon()}
                <p style={{fontSize: '12px', color: 'var(--pf-t--color--gray--30)'}}>{CAMEL_VERSION}</p>
            </div>
        </div>
    )
}

const Logo = (svgString: string) => {
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    return <img src={url} style={{height: '20px'}} alt="logo" />;
};

export function PlatformNameForToolbar() {
    const {customName} = useBrandStore();
    const brand = (
        <div className={"platform-name-toolbar-wrapper"}>
            <div className={"platform-name-toolbar"}>
                {!customName && PlatformName(20)}
                {customName && Logo(customName)}
                {customName && <Content className={"powered-by-badge"}>POWERED BY APACHE CAMEL KARAVAN</Content>}
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
        {PlatformName()}
    </div>)
}

export const PlatformName = (height: number | string = 20, width: number | string = 292.797) => (
    <Content component={'h1'} style={{ color: 'var(--pf-t--global--color--nonstatus--blue--default)'}}>Apache Camel Karavan</Content>
)
