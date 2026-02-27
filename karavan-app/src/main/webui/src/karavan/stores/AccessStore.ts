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
import {AccessRole, AccessUser, PLATFORM_ADMIN, PLATFORM_DEVELOPER} from "@models/AccessModels";

interface AccessState {
    users: AccessUser[];
    setUsers: (users: AccessUser[]) => void;
    roles: AccessRole[];
    filter: string;
    setFilter: (filter: string) => void;
    showUserModal: boolean;
    setShowUserModal: (showUserModal: boolean) => void;
    showRoleModal: boolean;
    setShowRoleModal: (showUserModal: boolean) => void;
    showPasswordModal: boolean;
    setShowPasswordModal: (showPasswordModal: boolean) => void;
    currentUser?: AccessUser;
    setCurrentUser: (currentUser?: AccessUser) => void;
}

export const useAccessStore = createWithEqualityFn<AccessState>((set) => ({
    users: [],
    setUsers: (users: AccessUser[])=> {
        set({users: users});
    },
    roles: [
        new AccessRole({name: PLATFORM_ADMIN, description: 'Administrator'}),
        new AccessRole({name: PLATFORM_DEVELOPER, description: 'Developer'})
    ],
    filter: '',
    setFilter: (filter: string)=> {
        set({filter: filter?.toLowerCase()});
    },
    showUserModal: false,
    setShowUserModal: (showUserModal: boolean) => {
        set({showUserModal: showUserModal});
    },
    showRoleModal: false,
    setShowRoleModal: (showRoleModal: boolean) => {
        set({showRoleModal: showRoleModal});
    },
    showPasswordModal: false,
    setShowPasswordModal: (showPasswordModal: boolean) => {
        set({showPasswordModal: showPasswordModal});
    },
    setCurrentUser: (currentUser?: AccessUser) => {
        set({currentUser: currentUser});
    }
}), shallow)


