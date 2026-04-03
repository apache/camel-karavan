import {DashboardDevelopmentCard} from "@features/dashboard/development/DashboardDevelopmentCard";
import * as React from "react";
import {useAccessStore} from "@stores/AccessStore";
import {shallow} from "zustand/shallow";
import {useCommitsStore} from "@stores/CommitsStore";
import {ProgressStepper} from "@patternfly/react-core";
import {DashboardDevelopmentCardCommit} from "@features/dashboard/development/DashboardDevelopmentCardCommit";

export function DashboardDevelopmentCardCommits() {

    const [users] = useAccessStore((s) => [s.users], shallow);
    const {systemCommits} = useCommitsStore();

    return (
        <DashboardDevelopmentCard title={"Last commits"} body={
            <div style={{gap: 8}}>
                <ProgressStepper
                    isVertical={true}
                    isCenterAligned={false}
                    aria-label="Basic progress stepper with alignment"
                >
                    {systemCommits
                        .slice(0, 10)
                        .map((commit) => {
                            return (<DashboardDevelopmentCardCommit key={commit.id} commit={commit}/>)
                        })}
                </ProgressStepper>
            </div>
        }/>
    )
}
