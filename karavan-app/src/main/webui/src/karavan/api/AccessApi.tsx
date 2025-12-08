import axios, {AxiosResponse} from "axios";
import {AccessPassword, AccessRole, AccessUser} from "../models/AccessModels";
import {ErrorEventBus} from "@bus/ErrorEventBus";
import {AuthApi} from "@api/auth/AuthApi";

axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';
const instance = AuthApi.getInstance();

export class AccessApi {

    static async getUser(username: string, after: (user: AccessUser) => void) {
        instance.get('/ui/access/users/' + username)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                } else {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
            after(err);
        });
    }

    static async putUser(user: AccessUser, after: (result: boolean, res: AxiosResponse<AccessUser> | any) => void) {
        try {
            instance.put('/ui/access/users', user)
                .then(res => {
                    if (res.status === 200) {
                        after(true, res);
                    }
                }).catch(err => {
                after(false, err);
            });
        } catch (error: any) {
            after(false, error);
        }
    }

    static async getUsers(after: (users: AccessUser[]) => void) {
        instance.get('/ui/access/users')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                } else {
                    after([]);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
            after([]);
        });
    }
    static async getRoles(after: (users: AccessRole[]) => void) {
        instance.get('/ui/access/roles')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                } else {
                    after([]);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
            after([]);
        });
    }

    static async postUser(user: AccessUser, after: (result: boolean, res: AxiosResponse<AccessUser> | any) => void) {
        try {
            instance.post('/ui/access/users', user)
                .then(res => {
                    if (res.status === 200 || res.status === 201) {
                        after(true, res);
                    }
                }).catch(err => {
                    console.error(err);
                after(false, err);
            });
        } catch (error: any) {
            console.error(error);
            after(false, error);
        }
    }

    static async deleteUser(username: string, after: (result: boolean, res: AxiosResponse<any> | any) => void) {
        try {
            instance.delete('/ui/access/users/' + username)
                .then(res => {
                    if (res.status === 202) {
                        after(true, res);
                    }
                }).catch(err => {
                after(false, err);
            });
        } catch (error: any) {
            after(false, error);
        }
    }

    static setUserStatus(user: AccessUser, status: string, after: (result: AccessUser) => void) {
        try {
            instance.put(`/ui/access/users/${status}`, user)
                .then(res => {
                    if (res.status === 200) {
                        after(res.data);
                    }
                }).catch(err => {
                after(err.data);
            });
        } catch (error: any) {
            after(error);
        }
    }

    static setUserRole(user: AccessUser, role: string | undefined, command: "activate" | "inactivate" | "add" | "remove", after: (result: AccessUser) => void) {
        try {
            instance.put(`/ui/access/userRole`, {username: user.username, role: role, command: command})
                .then(res => {
                    if (res.status === 200) {
                        after(res.data);
                    }
                }).catch(err => {
                after(err.data);
            });
        } catch (error: any) {
            after(error);
        }
    }

    static postRole(role: AccessRole, after: (result: boolean, res: any) => void) {
        try {
            instance.post('/ui/access/roles', role)
                .then(res => {
                    if (res.status === 200 || res.status === 201) {
                        after(true, res);
                    }
                }).catch(err => {
                console.error(err);
                after(false, err);
            });
        } catch (error: any) {
            console.error(error);
            after(false, error);
        }
    }

    static setPassword(username: string, password: AccessPassword, after: (result: boolean, res: any) => void) {
        try {
            instance.post('/ui/access/password', {...password, username: username})
                .then(res => {
                    if (res.status === 200 || res.status === 201 || res.status === 204) {
                        after(true, res);
                    }
                }).catch(err => {
                console.error(err);
                after(false, err);
            });
        } catch (error: any) {
            console.error(error);
            after(false, error);
        }
    }
}
