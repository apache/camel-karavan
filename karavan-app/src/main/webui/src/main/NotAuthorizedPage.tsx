import React, {useEffect} from "react";
import {Bullseye, EmptyState, EmptyStateBody, EmptyStateVariant} from "@patternfly/react-core";
import NotAuthorizedIcon from "@patternfly/react-icons/dist/esm/icons/user-secret-icon";
import {useNavigate} from "react-router-dom";
import {getCurrentUser} from "@/auth/AuthApi";

export function NotAuthorizedPage() {

    const navigate = useNavigate();

    useEffect(() => {
        const roles = getCurrentUser()?.roles ?? [];
        const authorized = roles?.length > 0;
        if (authorized) {
            navigate("/");
        }
    }, []);

    return (
        <Bullseye>
            <EmptyState  headingLevel="h4" icon={NotAuthorizedIcon}  titleText="Not authorized" variant={EmptyStateVariant.xl}>
                <EmptyStateBody>You are not authorize to use this application</EmptyStateBody>
            </EmptyState>
        </Bullseye>
    )
}
