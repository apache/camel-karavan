import React from 'react';
import UserProfile from "@features/access/users/UserProfile";
import {ChangePassword} from "@features/access/users/ChangePassword";

export function UserProfileTab() {

    return (
        <div style={{padding:'16px', display:'flex', flexDirection:'column', gap:'16px', justifyContent:'center'}}>
            <UserProfile/>
            <ChangePassword/>
        </div>
    )
}