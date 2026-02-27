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
import React, {useEffect} from "react";
import {Bullseye, EmptyState, EmptyStateBody, EmptyStateVariant} from "@patternfly/react-core";
import NotAuthorizedIcon from "@patternfly/react-icons/dist/esm/icons/user-secret-icon";
import {useNavigate} from "react-router-dom";
import {getCurrentUser} from "@api/auth/AuthApi";

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
