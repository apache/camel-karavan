import {useStatusesStore} from "@stores/ProjectStore";
import {ROUTES} from "@app/navigation/Routes";
import {useNavigate} from "react-router-dom";
import {ProjectMetrics} from "@models/DashboardModels";
import {useValidationStore} from "@stores/ValidationStore";
import {Button, Content, Popover, Tooltip} from "@patternfly/react-core";
import * as React from "react";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";

export function DashboardDevelopmentHook() {

    const [camelStatuses] = useStatusesStore((s) => [s.camelContexts])
    const [validations] = useValidationStore((s) => [s.validations])
    const navigate = useNavigate();

    function selectFile(integration: string, fileName: string) {
        navigate(`${ROUTES.PROJECTS}/${integration}/${fileName}`);
    }

    function getValidationInfo(projectId: string) {
        return validations.find(v => v.projectId === projectId);
    }

    function getValidationInfoForFile(projectId: string, fileName: string) {
        const validation = getValidationInfo(projectId);
        return validation?.files?.find(f => f.name === fileName)
    }

    function getProjectValidationIcon(projectId: string) {
        const validation = getValidationInfo(projectId);
        const invalidFiles = validation?.files?.filter(f => f?.hasErrors)?.length ?? 0;
        let labelIcon = undefined;
        if (validation?.hasErrors) {
            labelIcon = (
                <Tooltip content={`Errors in ${invalidFiles} file(s)!`} className={'tooltip-danger'}>
                    <ExclamationCircleIcon className='validation-icon validation-icon-danger'/>
                </Tooltip>
            );
        }
        return labelIcon;
    }

    function getProjectValidationStatus(projectId: string) {
        const validation = getValidationInfo(projectId);
        const invalidFiles = validation?.files?.filter(f => f?.hasErrors)?.length ?? 0;
        if (validation === undefined || validation === null || validation.files?.length === 0) {
            return undefined;
        } else if (invalidFiles > 0) {
            return false;
        }
        return true;
    }

    function getProjectFileValidationIcon(projectId: string, fileName: string) {
        const invalidFile = getValidationInfoForFile(projectId, fileName);
        let labelIcon = undefined;
        if (invalidFile?.hasErrors) {
            labelIcon = (
                <Tooltip content={`Errors in file ${invalidFile?.name}!`} className={'tooltip-danger'}>
                    <ExclamationCircleIcon className='validation-icon validation-icon-danger'/>
                </Tooltip>
            );
        }
        return labelIcon;
    }

    function getProjectFileValidationAlerts(projectId: string, fileName: string) {
        try {
            const invalidFile = getValidationInfoForFile(projectId, fileName);
            if (invalidFile?.hasErrors) {
                const errors = invalidFile?.errors;
                if (errors && Array.isArray(errors)) {
                    return (
                        <Popover
                            className='popover-file-validation'
                            aria-label="Alert popover"
                            hasAutoWidth
                            alertSeverityVariant={'danger'}
                            headerContent="Validation Errors"
                            headerIcon={<ExclamationCircleIcon/>}
                            headerComponent="h1"
                            bodyContent={
                                <div style={{display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "stretch", gap: "8px"}}>
                                    {errors.map((error, index) => {
                                        const line = error?.details?.line;
                                        const type = error?.property ? error?.property : error?.type;
                                        const title = `Error at line ${line}: ${type}`
                                        return (
                                            <div key={index} style={{display: "flex", flexDirection: "column", justifyContent: "flex-start", gap: "3px"}}>
                                                <Content style={{fontWeight: 'bold', margin: 0}} component="p">{title}</Content>
                                                <Content style={{margin: 0}} component="p">{error?.message}</Content>
                                            </div>
                                        )
                                    })}
                                </div>
                            }
                            appendTo={() => document.body}
                        >
                            <Button isInline variant={'link'} isDanger icon={<ExclamationCircleIcon/>}>Validation Error</Button>
                        </Popover>
                    )
                }
            }
        } catch (err) {
            console.error(err);
        }
        return undefined;
    }


    function getIntegrationMetrics(projectId: string): ProjectMetrics {
        let remoteExchangesTotal: number = 0;
        let remoteExchangesFailed: number = 0;
        let remoteExchangesSucceeded: number = 0;
        let remoteExchangesInflight: number = 0;
        let exchangesTotal: number = 0;
        let exchangesFailed: number = 0;
        let exchangesInflight: number = 0;
        let exchangesSucceeded: number = 0;
        try {
            const statuses = camelStatuses.filter(c => c.projectId === projectId) || [];
            statuses.forEach(status => {
                const contextStatuses = status.statuses.filter(s => s.name === 'context') || [];
                contextStatuses.forEach(contextStatus => {
                    const contextStatusJson = contextStatus.status;
                    const statistics = (contextStatusJson ? JSON.parse(contextStatusJson) : {})?.context?.statistics;
                    remoteExchangesTotal = (statistics?.remoteExchangesTotal || 0) + remoteExchangesTotal;
                    remoteExchangesFailed = (statistics?.remoteExchangesFailed || 0) + remoteExchangesFailed;
                    remoteExchangesSucceeded = (remoteExchangesTotal - remoteExchangesFailed) + remoteExchangesSucceeded;
                    remoteExchangesInflight = (statistics?.remoteExchangesInflight || 0) + remoteExchangesInflight;

                    exchangesTotal = (statistics?.exchangesTotal || 0) + exchangesTotal;
                    exchangesFailed = (statistics?.exchangesFailed || 0) + exchangesFailed;
                    exchangesSucceeded = (exchangesTotal - exchangesFailed) + exchangesSucceeded;
                    exchangesInflight = (statistics?.exchangesInflight || 0) + exchangesInflight;
                })
            })
        } catch (e) {
            console.error(e);
        }
        return new ProjectMetrics(exchangesTotal, exchangesFailed, exchangesInflight, exchangesSucceeded);
    }

    return {
        selectFile, getValidationInfoForFile, getProjectValidationIcon, getProjectFileValidationIcon,
        getProjectFileValidationAlerts, getProjectValidationStatus
    }
}