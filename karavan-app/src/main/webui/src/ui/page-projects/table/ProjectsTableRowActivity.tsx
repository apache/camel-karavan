import React from 'react';
import {Label, LabelGroup} from "@patternfly/react-core";
import "./ProjectsTableRowActivity.css"

interface Props {
    activeUsers: string[]
}

export function ProjectsTableRowActivity (props: Props) {

    const {activeUsers} = props;

    return (
        <LabelGroup className='active-users' numLabels={1}>
            {activeUsers.length > 0 && activeUsers.slice(0, 5).map(user =>
                <Label key={user} color='blue' isCompact>{user}</Label>
            )}
        </LabelGroup>
    )
}