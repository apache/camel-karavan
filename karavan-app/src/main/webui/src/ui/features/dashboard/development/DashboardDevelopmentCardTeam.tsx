import {DashboardDevelopmentCard} from "@features/dashboard/development/DashboardDevelopmentCard";
import * as React from "react";
import {AccessService} from "@services/AccessService";
import {useAccessStore} from "@stores/AccessStore";
import {shallow} from "zustand/shallow";
import {DashboardDevelopmentCardTeamMember} from "@features/dashboard/development/DashboardDevelopmentCardTeamMember";
import {useActivityStore} from "@stores/ActivityStore";
import {useDataPolling} from "@shared/polling/useDataPolling";

export function DashboardDevelopmentCardTeam() {

    const [users] = useAccessStore((s) => [s.users], shallow);
    const {fetchUsersActivities, usersActivities} = useActivityStore();

    useDataPolling('DashboardDevelopmentCardTeam', refreshActivity, 5000);

    function refreshActivity() {
        fetchUsersActivities();
        AccessService.refreshAccess()
    }

    return (
        <DashboardDevelopmentCard title={"Team"} body={
            <div className="integration-development-panel-column" style={{gap: 8}}>
                {users
                    // .filter(u => {
                    //     const w = usersActivities?.WORKING?.[u.username]?.timeStamp;
                    //     const h = usersActivities?.HEARTBEAT?.[u.username]?.timeStamp;
                    //     return w !== undefined || h !== undefined;
                    // })
                    .sort((a, b) => {
                        const aWork = usersActivities?.WORKING?.[a.username]?.timeStamp ?? 0;
                        const aHeart = usersActivities?.HEARTBEAT?.[a.username]?.timeStamp ?? 0;
                        const bWork = usersActivities?.WORKING?.[b.username]?.timeStamp ?? 0;
                        const bHeart = usersActivities?.HEARTBEAT?.[b.username]?.timeStamp ?? 0;
                        const getPriority = (work: number, heart: number) => {
                            if (work > 0) return 0;      // WORKING
                            if (heart > 0) return 1;     // HEARTBEAT
                            return 2;                    // NEITHER
                        };

                        const pA = getPriority(aWork, aHeart);
                        const pB = getPriority(bWork, bHeart);

                        if (pA !== pB) return pA - pB;

                        return a.username.localeCompare(b.username);
                    })
                    .map((user) => {
                        return (<DashboardDevelopmentCardTeamMember key={user.username} user={user}/>)
                    })}
                {/*<div className="user-card-empty-wrapper">*/}
                {/*    {users*/}
                {/*        .filter(u => {*/}
                {/*            const w = usersActivities?.WORKING?.[u.username]?.timeStamp;*/}
                {/*            const h = usersActivities?.HEARTBEAT?.[u.username]?.timeStamp;*/}
                {/*            return w === undefined && h === undefined;*/}
                {/*        }).sort((a, b) => a.username.localeCompare(b.username))*/}
                {/*        .map((user) => {*/}
                {/*            return (<DashboardDevelopmentTeamMember key={user.username} user={user}/>)*/}
                {/*        })}*/}
                {/*    <div style={{flex: '1 1 auto'}}></div>*/}
                {/*</div>*/}
            </div>
        }/>
    )
}
