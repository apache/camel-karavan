import {AccessPassword, AccessRole, AccessToken, AccessUser, GenerateTokenRequest, GenerateTokenResponse, SessionInfo} from "@models/AccessModels";
import {ErrorEventBus} from "@bus/ErrorEventBus";
import {AuthApi} from "./auth/AuthApi";
import {AxiosResponse} from "axios";

const instance = AuthApi.getInstance();

export class AccessApi {

    static async getUser(username: string): Promise<AccessUser | null> {
        try {
            const res = await instance.get(`/ui/access/users/${username}`);
            return res.status === 200 ? res.data : null;
        } catch (err) {
            ErrorEventBus.sendApiError(err);
            return null;
        }
    }

    static async putUser(user: AccessUser): Promise<[boolean, AxiosResponse | any]> {
        try {
            const res = await instance.put('/ui/access/users', user);
            return [res.status === 200, user];
        } catch (err) {
            ErrorEventBus.sendApiError(err);
            return [false, err];
        }
    }

    static async getUsers(): Promise<AccessUser[]> {
        try {
            const res = await instance.get('/ui/access/users');
            return res.status === 200 ? res.data : [];
        } catch (err) {
            ErrorEventBus.sendApiError(err);
            return [];
        }
    }

    static async getRoles(): Promise<AccessRole[]> {
        try {
            const res = await instance.get('/ui/access/roles');
            return res.status === 200 ? res.data : [];
        } catch (err) {
            ErrorEventBus.sendApiError(err);
            return [];
        }
    }

    static async getSessions(): Promise<SessionInfo[]> {
        try {
            const res = await instance.get('/ui/access/sessions');
            return res.status === 200 ? res.data : [];
        } catch (err) {
            ErrorEventBus.sendApiError(err);
            return [];
        }
    }

    static async getTokens(): Promise<AccessToken[]> {
        try {
            const res = await instance.get('/ui/access/tokens');
            return res.status === 200 ? res.data : [];
        } catch (err) {
            ErrorEventBus.sendApiError(err);
            return [];
        }
    }

    static async postUser(user: AccessUser): Promise<[boolean, AxiosResponse | any]> {
        try {
            const res = await instance.post('/ui/access/users', user);
            return [res.status === 200 || res.status === 201, user];
        } catch (err) {
            ErrorEventBus.sendApiError(err);
            return [false, err];
        }
    }

    static async deleteUser(username: string): Promise<boolean> {
        try {
            const res = await instance.delete(`/ui/access/users/${username}`);
            return res.status === 202;
        } catch (err) {
            ErrorEventBus.sendApiError(err);
            return false;
        }
    }

    static async deleteRole(rolename: string): Promise<boolean> {
        try {
            const res = await instance.delete(`/ui/access/roles/${rolename}`);
            return res.status === 202;
        } catch (err) {
            ErrorEventBus.sendApiError(err);
            return false;
        }
    }

    static async deleteSession(username: string): Promise<boolean> {
        try {
            const res = await instance.delete(`/ui/access/sessions/${username}`);
            return res.status === 202;
        } catch (err) {
            ErrorEventBus.sendApiError(err);
            return false;
        }
    }

    static async deleteToken(hashedToken: string): Promise<boolean> {
        try {
            const res = await instance.delete(`/ui/access/tokens/${hashedToken}`);
            return res.status === 202;
        } catch (err) {
            ErrorEventBus.sendApiError(err);
            return false;
        }
    }

    static async setUserStatus(user: AccessUser, status: string): Promise<AccessUser | null> {
        try {
            const res = await instance.put(`/ui/access/users/${status}`, user);
            return res.status === 200 ? res.data : null;
        } catch (err) {
            ErrorEventBus.sendApiError(err);
            return null;
        }
    }

    static async setUserRole(
        user: AccessUser,
        role: string | undefined,
        command: "activate" | "inactivate" | "add" | "remove"
    ): Promise<AccessUser | null> {
        try {
            const res = await instance.put('/ui/access/userRole', { username: user.username, role, command });
            return res.status === 200 ? res.data : null;
        } catch (err) {
            ErrorEventBus.sendApiError(err);
            return null;
        }
    }

    static async postRole(role: AccessRole): Promise<[boolean, AxiosResponse | any]> {
        try {
            const res = await instance.post('/ui/access/roles', role);
            return [res.status === 200 || res.status === 201, role];
        } catch (err) {
            ErrorEventBus.sendApiError(err);
            return [false, err];
        }
    }

    static async generateToken(request: GenerateTokenRequest): Promise<[boolean, GenerateTokenResponse | any]> {
        try {
            const res = await instance.post('/ui/access/tokens', request);
            // On success, res.data contains the GenerateTokenResponse (rawToken + metadata)
            return [res.status === 200 || res.status === 201, res.data];
        } catch (err) {
            ErrorEventBus.sendApiError(err);
            return [false, err];
        }
    }

    static async setPassword(username: string, password: AccessPassword): Promise<[boolean, AxiosResponse | any]> {
        try {
            const res = await instance.post('/ui/access/password', { ...password, username });
            return [res.status === 200 || res.status === 201 || res.status === 204, res];
        } catch (err) {
            ErrorEventBus.sendApiError(err);
            return [false, err];
        }
    }
}