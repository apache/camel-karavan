import React, {useContext} from 'react';
import {
    ActionGroup,
    Alert,
    Bullseye,
    Button,
    Card,
    CardBody,
    CardTitle,
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
import DarkModeToggle from "./DarkModeToggle";
import {MainToolbar} from "@/components/MainToolbar";
import {AuthContext} from "@/auth/AuthProvider";
import {AuthApi} from "@/auth/AuthApi";
import {KaravanIcon} from "@/integration-designer/icons/KaravanIcons";

export const LoginPage: React.FunctionComponent = () => {

    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [passwordHidden, setPasswordHidden] = React.useState(true);
    const [showError, setShowError] = React.useState(false);
    const [error, setError] = React.useState('');
    const {reload} = useContext(AuthContext);

    function onLoginButtonClick(event: any) {
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

    function onKeyDown(event: React.KeyboardEvent<HTMLFormElement>): void {
        event.stopPropagation();
        if (event.key === 'Enter') {
            event.preventDefault();
            onLoginButtonClick(event);
        }
    }

    function getLoginForm() {
        return (
            <Form onKeyDown={onKeyDown}>
                <FormGroup fieldId="username" label="Username" isRequired>
                    <TextInput className="text-field"
                               type="text"
                               id="username"
                               name="username"
                               value={username}
                               onChange={(_, value) => setUsername(value)}/>
                </FormGroup>
                <FormGroup fieldId="password" label="Password" isRequired>
                    <TextInputGroup>
                        <TextInputGroupMain className="text-field"
                                            type={passwordHidden ? "password" : 'text'}
                                            id="password"
                                            name="password"
                                            value={password}
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
                <ActionGroup>
                    <Button variant="primary"
                            style={{width: '100%'}}
                            onClick={onLoginButtonClick}
                    >
                        Login
                    </Button>
                </ActionGroup>
                {showError && (
                    <FormAlert>
                        <Alert variant="danger" title={<div>{error?.toString()}</div>} aria-live="polite" isInline/>
                    </FormAlert>
                )}
            </Form>
        )
    }

    return (
        <div className='login-page'>
            <div className="logo-panel">
                <MainToolbar title={<></>} toolsStart={<></>} tools={
                    <div id="toolbar-group-types" style={{height: '65px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px'}}>
                        <Content component='h3' style={{color: 'var(--pf-t--global--border--color--nonstatus--orange--default)'}}>Apache Camel Karavan</Content>
                        {KaravanIcon()}
                    </div>
                }/>
            </div>
            <Bullseye>
                <Card className="login">
                    <CardTitle>
                        <Content component="h2">Login</Content>
                    </CardTitle>
                    <CardBody>
                        {getLoginForm()}
                    </CardBody>
                </Card>
            </Bullseye>
            <div style={{padding: 16}}>
                <DarkModeToggle/>
            </div>
        </div>
    )
}