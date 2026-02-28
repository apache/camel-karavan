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
export class AccessUser {
    username: string = '';
    firstName: string = '';
    lastName: string = ''
    email: string = '';
    status: string = 'ACTIVE';
    passNeedUpdate: boolean = true;
    roles: string[] = [];

    public constructor(init?: Partial<AccessUser>) {
        Object.assign(this, init);
    }
}

export class AccessRole {
    name: string = '';
    description: string = '';


    public constructor(init?: Partial<AccessRole>) {
        Object.assign(this, init);
    }
}

export class AccessPassword {
    currentPassword: string = ''
    password: string = ''
    password2: string = ''


    public constructor(init?: Partial<AccessPassword>) {
        Object.assign(this, init);
    }
}

export const PLATFORM_ADMIN = 'platform-admin'
export const PLATFORM_USER = 'platform-user'
export const PLATFORM_DEVELOPER = 'platform-developer'
