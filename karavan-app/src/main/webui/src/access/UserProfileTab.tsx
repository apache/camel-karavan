import React from 'react';
import UserProfile from "@/access/UserProfile";
import {ChangePassword} from "@/access/ChangePassword";

export function UserProfileTab() {

    return (
        <div style={{padding:'16px', display:'flex', flexDirection:'column', gap:'16px', justifyContent:'center'}}>
            <UserProfile/>
            <ChangePassword/>
        </div>
    )
}