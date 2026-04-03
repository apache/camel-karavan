import React from 'react';
import {Badge, Content} from '@patternfly/react-core';
import {AccessUser} from "@models/AccessModels";
import {useActivityStore} from "@stores/ActivityStore";
import TimeAgo from "javascript-time-ago";
import {HeartbeatIcon} from "@patternfly/react-icons";
import {Asleep} from "@carbon/icons-react";
import {SvgIcon} from "@shared/icons/SvgIcon";

interface Props {
    user: AccessUser
}

export function DashboardDevelopmentCardTeamMember(props: Props): React.ReactElement {

    const {user} = props;
    const {usersActivities} = useActivityStore();
    const userHeartbeat = usersActivities?.HEARTBEAT?.[user.username];
    const alive = userHeartbeat !== undefined;
    const userWorking = usersActivities?.WORKING?.[user.username];
    const working = userWorking !== undefined;
    const timeAgo = new TimeAgo('en-US')
    const lastActive = working ? timeAgo.format(userWorking?.timeStamp, 'mini-minute-now') : undefined;
    const fontColor = alive ? 'var(--pf-t--global--text--color--subtle)' : 'var(--pf-t--global--icon--color--disabled)';
    const iconColor = working
        ? 'var(--pf-t--color--green--40)'
        : alive ? 'var(--pf-t--color--green--40)' : 'var(--pf-t--global--icon--color--disabled)';
    const icon = working
        ? <SvgIcon icon={"working"} fill={iconColor} width={22} height={22} />
        :  (alive ? <HeartbeatIcon color={iconColor} width={22} height={22} className={'beating-heart-icon'}/> : <Asleep color={iconColor}/>)
    const cardClassName = working ? "card-working" : (alive ? "card-alive" : "")

    // if (!alive && !working) {
    //     return (
    //         <div className={`user-card-empty`}>
    //             {icon}
    //             <div style={{paddingLeft: 2}}>{`${user.firstName?.substring(0, 1)?.toUpperCase()}`}</div>
    //             <div>{`${user.lastName?.substring(0, 1)?.toUpperCase()}`}</div>
    //         </div>
    //     )
    // } else {
        return (
            <div className={`user-card ${cardClassName}`}>
                <div style={{width: '24px', display: 'flex', justifyContent: 'center'}}>
                    {icon}
                </div>
                <div className={"user-card-title"}>
                    {alive && <Content component='p' style={{lineHeight: '12px', color: fontColor}}>{`${user.firstName} ${user.lastName}`}</Content>}
                    <Content component='p' style={{fontWeight: 'bold', lineHeight: '10px', color: fontColor}}>{`${user.username}`}</Content>
                </div>
                {lastActive && <Badge style={{fontWeight: 'normal', backgroundColor: 'var(--pf-t--global--color--nonstatus--green--default)'}} isRead>{lastActive}</Badge>}
            </div>
        )
    // }
}