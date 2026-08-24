import React from 'react';
import UserProfile from "./UserProfile";
import {ChangePassword} from "./ChangePassword";
import "./UserProfileTab.css"

export function UserProfileTab() {

    return (
        <div className={"user-profile-tab-wrapper"}>
            <div className={"user-profile-tab"}>
                <div className={"user-profile-tab-panels"}>
                    <UserProfile/>
                    <ChangePassword/>
                </div>
            </div>
        </div>
    )
}