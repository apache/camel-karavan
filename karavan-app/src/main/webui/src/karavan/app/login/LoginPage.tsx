import React, {useContext, useEffect} from 'react';
import {
    Alert,
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Checkbox,
    Content,
    Form,
    FormAlert,
    FormGroup,
    TextInput,
    TextInputGroup,
    TextInputGroupMain,
    TextInputGroupUtilities
} from '@patternfly/react-core';
import './LoginPage.css'
import EyeIcon from '@patternfly/react-icons/dist/esm/icons/eye-icon';
import EyeSlashIcon from '@patternfly/react-icons/dist/esm/icons/eye-slash-icon';
import {AuthContext} from "@api/auth/AuthProvider";
import {AuthApi} from "@api/auth/AuthApi";
import {CamelIcon, KaravanIcon, OpenApiIcon} from "@features/project/designer/icons/KaravanIcons";
import {SvgIcon} from "@shared/icons/SvgIcon";
import jibLogo from '@shared/icons/jib.png';
import {PlatformNameForToolbar, PlatformVersion} from "@shared/ui/PlatformLogos";
import PlatformLogo from "@app/navigation/PlatformLogo";
import OrbitLines from "@app/login/OrbitLines";
import {useReadinessStore} from "@stores/ReadinessStore";

export const LoginPage: React.FunctionComponent = () => {

    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [passwordHidden, setPasswordHidden] = React.useState(true);
    const [showError, setShowError] = React.useState(false);
    const [error, setError] = React.useState('');
    const {reload} = useContext(AuthContext);
    const { readiness } = useReadinessStore();

    const [titleSvg, setTitleSvg] = React.useState<string>();

    useEffect(() => {
    }, []);

    function onLoginButtonClick(event: any) {
        if (!getButtonDisabled()) {
            event.preventDefault();
            AuthApi.login(username, password, (ok, res) => {
                if (!ok) {
                    setError(res?.response?.data);
                    setShowError(true);
                } else {
                    setError('');
                    setShowError(false);
                    reload();
                }
            })
        }
    }

    function getButtonDisabled(): boolean {
        return (username?.length < 3 || password?.length < 3);
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLFormElement>): void {
        event.stopPropagation();
        if (event.key === 'Enter') {
            event.preventDefault();
            onLoginButtonClick(event);
        }
    }


    function getLogos() {
        return [
            <div className="powered-by-logo counter-rotator">
                <a href="https://github.com/apache/camel-karavan" target="_blank">{KaravanIcon("logo")}</a>
            </div>,
            <div className="powered-by-logo counter-rotator">
                <a href="https://www.openapis.org/" target="_blank"><OpenApiIcon className={"logo"}/></a>
            </div>,
            <div className="powered-by-logo counter-rotator">
                <a href="https://www.asyncapi.com/" target="_blank">{SvgIcon({icon: 'asyncapi', className: 'asyncapi-logo'})}</a>
            </div>,
            <div className="powered-by-logo counter-rotator">
                <a href="https://json-schema.org/" target="_blank">
                    {SvgIcon({icon: 'json-schema-dark', className: 'json-schema-logo'})}
                </a>
            </div>,
            // <div className="powered-by-logo counter-rotator">
            //     <a href="https://groovy-lang.org/" target="_blank">{SvgIcon({icon: 'groovy', className: 'groovy-logo'})}</a>
            // </div>,
            <div className="powered-by-logo counter-rotator">
                <a href="https://github.com/GoogleContainerTools/jib" target="_blank">
                    <img src={jibLogo} alt="Logo" className="jib-logo"/>
                </a>
            </div>,
            <div className="powered-by-logo counter-rotator">
                <a href="https://camel.apache.org/" target="_blank">{CamelIcon()}</a>
            </div>,
            <div className="powered-by-logo counter-rotator">
                <a href="https://www.patternfly.org/" target={'_blank'}>
                    {SvgIcon({icon: 'patternfly', className: 'patternfly-logo'})}
                </a>
            </div>,
            <div className="powered-by-logo counter-rotator">
                <a href="https://eclipse.dev/jkube/" target="_blank">
                    {SvgIcon({icon: 'jkube', className: 'jkube-logo'})}
                </a>
            </div>,
            <div className="powered-by-logo counter-rotator">
                <a href="https://www.keycloak.org/" target="_blank">
                    {SvgIcon({icon: 'keycloak', className: 'patternfly-logo'})}
                </a>
            </div>
        ];
    }

    const LOGOS = getLogos();

    function getLoginForm() {
        return (
            <Form onKeyDown={onKeyDown}>
                <FormGroup fieldId="username">
                    <TextInput className="text-field"
                               type="text"
                               id="username"
                               name="username"
                               value={username}
                               placeholder={"Username"}
                               onChange={(_, value) => setUsername(value)}/>
                </FormGroup>
                <FormGroup fieldId="password">
                    <TextInputGroup>
                        <TextInputGroupMain className="text-field"
                                            type={passwordHidden ? "password" : 'text'}
                                            id="password"
                                            name="password"
                                            value={password}
                                            placeholder={"Password"}
                                            onChange={(_, value) => setPassword(value)}
                        />
                        <TextInputGroupUtilities>
                            <Button
                                variant="plain"
                                onClick={() => setPasswordHidden(!passwordHidden)}
                                aria-label={passwordHidden ? 'Show password' : 'Hide password'}
                            >
                                {passwordHidden ? <EyeIcon/> : <EyeSlashIcon/>}
                            </Button>
                        </TextInputGroupUtilities>
                    </TextInputGroup>
                </FormGroup>
                {showError && (
                    <FormAlert>
                        <Alert variant="danger" title={<div>{error?.toString()}</div>} aria-live="polite" isInline/>
                    </FormAlert>
                )}
            </Form>
        )
    }


    function getRightSide() {
        const buttonClassName = getButtonDisabled() ? "button button-disabled" : "button";
        return (
            <div className="karavan-form-panel dark-form">
                <div className="form-wrapper">
                    <Card className="login" isLarge>
                        <CardHeader>
                            <div style={{display: "flex", flexDirection: 'row', justifyContent: 'space-between', alignItems: "center"}}>
                                <Content component='h3' className="login-header">Login</Content>
                                <PlatformVersion environment={readiness?.environment}/>
                            </div>
                        </CardHeader>
                        <CardBody>
                            {getLoginForm()}
                        </CardBody>
                        <CardFooter style={{ textAlign: "center" }}>
                            <Button variant="primary"
                                    className={buttonClassName}
                                    onClick={onLoginButtonClick}
                            >
                                Access Platform
                            </Button>
                        </CardFooter>
                    </Card>
                    {/*<DarkModeToggle/>*/}
                </div>
            </div>
        )
    }

    function getLeftSide() {
        return (
            <div className="karavan-brand-panel">
                <div className="brand-content">
                    <div className="brand-name">
                        <div className="brand-logo-container">
                            {PlatformLogo("logo")}
                            <span className="platform-name-text">{PlatformNameForToolbar()}</span>
                        </div>
                        <div>
                            <div className="tagline1 gradient-text-blue">Accelerate</div>
                            <div className="tagline1 gradient-text-blue-gold">Integration</div>
                            <div className="tagline1 gradient-text-gold">Development</div>
                        </div>
                        <Content component='p' className="tagline2">Unified Design and Runtime for <br/> APIs • Events • Data Pipelines</Content>
                    </div>
                </div>
                <div className="solar-content">
                    <div className="solar-system">
                        <OrbitLines />
                        <div className="static-sun">
                            <a href="" target="_blank">
                                {PlatformLogo("logo")}
                            </a>
                        </div>
                        <div className="orbit-ring">
                            {LOGOS.map((logo, index) => {
                                const total = LOGOS.length;
                                const angle = (360 / total) * index;
                                // Increased radius slightly to make room for the center logo
                                const radius = 150;
                                const style = {'--angle': `${angle}deg`, '--radius': `${radius}px`,} as React.CSSProperties;
                                return (
                                    <div key={index} className="orbit-item" style={style}>
                                        {logo}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="anchor-line"></div>
                        <p className="brand-footer">Powered by</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="karavan-container">
            {getLeftSide()}
            {getRightSide()}
        </div>
    )
}