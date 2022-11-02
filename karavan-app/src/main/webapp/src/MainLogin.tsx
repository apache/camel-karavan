import React from 'react';
import {
    Bullseye, Card, CardBody, CardTitle, LoginForm, Text
} from '@patternfly/react-core';

interface Props {
    config: any,
    onLogin: (username: string, password: string) => void
}

interface State {
    username: string,
    password: string,
    isValidUsername: boolean,
    isValidPassword: boolean,
    isRememberMeChecked: boolean,
}

export class MainLogin extends React.Component<Props, State> {
    public state: State = {
        username: "",
        password: "",
        isValidUsername: true,
        isValidPassword: true,
        isRememberMeChecked: false,
    }

    onLoginButtonClick = (event: any) => {
        event.preventDefault();
        this.props.onLogin?.call(this, this.state.username, this.state.password);
    }

    render() {
        return (
            <Bullseye>
                <Card isFlat isCompact>
                    <CardTitle>
                        <img alt="karavan-logo" src="karavan-logo-light.png" className="login-logo"/>
                        <Text component="h3" style={{width:"fit-content", marginLeft:"auto"}}>{this.props.config.version}</Text>
                    </CardTitle>
                    <CardBody>
                        <LoginForm
                            showHelperText={true}
                            usernameLabel="Username"
                            usernameValue={this.state.username}
                            onChangeUsername={value => this.setState({username: value})}
                            isValidUsername={this.state.isValidUsername}
                            passwordLabel="Password"
                            passwordValue={this.state.password}
                            isShowPasswordEnabled
                            onChangePassword={value => this.setState({password: value})}
                            isValidPassword={this.state.isValidPassword}
                            onLoginButtonClick={this.onLoginButtonClick}
                            loginButtonLabel="Log in"
                        />
                    </CardBody>
                </Card>
            </Bullseye>
        );
    }
}