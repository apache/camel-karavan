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
