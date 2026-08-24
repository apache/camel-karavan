/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {createWithEqualityFn} from "zustand/traditional";
import {shallow} from "zustand/shallow";
import isEqual from "lodash/isEqual";
import {AccessRole, AccessToken, AccessUser, PLATFORM_ADMIN, PLATFORM_DEVELOPER, SessionInfo} from "@models/AccessModels";
import {AccessApi} from "@api/AccessApi";

interface AccessState {
    users: AccessUser[];
    roles: AccessRole[];
    sessions: SessionInfo[];
    tokens: AccessToken[];
    filter: string;
    showUserModal: boolean;
    showRoleModal: boolean;
    showPasswordModal: boolean;
    showTokenModal: boolean;
    currentUser?: AccessUser;
    currentToken?: AccessToken;

    // Setters
    setUsers: (users: AccessUser[]) => void;
    setTokens: (tokens: AccessToken[]) => void;
    setFilter: (filter: string) => void;
    setShowUserModal: (showUserModal: boolean) => void;
    setShowRoleModal: (showRoleModal: boolean) => void;
    setShowPasswordModal: (showPasswordModal: boolean) => void;
    setShowTokenModal: (showTokenModal: boolean) => void;
    setCurrentUser: (currentUser?: AccessUser) => void;
    setCurrentToken: (currentToken?: AccessToken) => void;

    // Fetch Actions
    fetchUsers: () => Promise<AccessUser[]>;
    fetchRoles: () => Promise<AccessRole[]>;
    fetchSessions: () => Promise<SessionInfo[]>;
    fetchTokens: () => Promise<AccessToken[]>;
    refreshAccess: () => Promise<void>;
}

export const useAccessStore = createWithEqualityFn<AccessState>((set, get) => ({
    // Initial State
    users: [],
    sessions: [],
    tokens: [],
    roles: [
        new AccessRole({ name: PLATFORM_ADMIN, description: 'Administrator' }),
        new AccessRole({ name: PLATFORM_DEVELOPER, description: 'Developer' })
    ],
    filter: '',
    showUserModal: false,
    showRoleModal: false,
    showPasswordModal: false,
    showTokenModal: false,
    currentUser: undefined,
    currentToken: undefined,

    // Basic Setters
    setUsers: (users: AccessUser[]) => set({ users }),
    setTokens: (tokens: AccessToken[]) => set({ tokens }),
    setFilter: (filter: string) => set({ filter: filter?.toLowerCase() }),
    setShowUserModal: (showUserModal: boolean) => set({ showUserModal }),
    setShowRoleModal: (showRoleModal: boolean) => set({ showRoleModal }),
    setShowPasswordModal: (showPasswordModal: boolean) => set({ showPasswordModal }),
    setShowTokenModal: (showTokenModal: boolean) => set({ showTokenModal }),
    setCurrentUser: (currentUser?: AccessUser) => set({ currentUser }),
    setCurrentToken: (currentToken?: AccessToken) => set({ currentToken }),

    // Fetch Actions
    fetchUsers: async (): Promise<AccessUser[]> => {
        const users = await AccessApi.getUsers();
        if (!isEqual(get().users, users)) {
            set({ users });
        }
        return users;
    },

    fetchRoles: async (): Promise<AccessRole[]> => {
        const roles = await AccessApi.getRoles();
        if (!isEqual(get().roles, roles)) {
            set({ roles });
        }
        return roles;
    },

    fetchSessions: async (): Promise<SessionInfo[]> => {
        const sessions = await AccessApi.getSessions();
        if (!isEqual(get().sessions, sessions)) {
            set({ sessions });
        }
        return sessions;
    },

    fetchTokens: async (): Promise<AccessToken[]> => {
        const tokens = await AccessApi.getTokens();
        if (!isEqual(get().tokens, tokens)) {
            set({ tokens });
        }
        return tokens;
    },

    refreshAccess: async (): Promise<void> => {
        // Fetch all in parallel for better performance
        await Promise.all([
            get().fetchUsers(),
            get().fetchRoles(),
            get().fetchSessions(),
            get().fetchTokens()
        ]);
    }
}), shallow);