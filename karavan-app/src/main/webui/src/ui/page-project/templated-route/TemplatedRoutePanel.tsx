import React, {useEffect, useState} from 'react';
import {FormProvider, useFieldArray, useForm} from "react-hook-form";
import '@utils/ModalForm.css';
import {SideBarFormWrapper} from "@shared/ui/SideBarFormWrapper";
import {Button, Card, CardBody, Content, FormGroup, Grid, GridItem, TextInput, TextInputGroup, TextInputGroupUtilities} from "@patternfly/react-core";
import {TemplatedRouteDefinition, TemplatedRouteParameterDefinition} from "@core/model/CamelDefinition";
import {TemplatedRouteHook} from "./TemplatedRouteHook";
import {useTemplatedRouteStore} from "../templated-route/TemplatedRouteStore";
import {useProjectPageStore} from "../ProjectPageStore";
import {useFilesStore, useFileStore} from "@stores/ProjectStore";
import {PlusIcon, TimesIcon} from "@patternfly/react-icons";
import {KARAVAN_DOT_EXTENSION} from "@core/contants";
import {CamelDefinitionApi} from "@core/api/CamelDefinitionApi";
import {useCreateProjectFormUtil} from "@page-projects/useCreateProjectFormUtil";

// Wrapper type to handle multiple routes tied to a single template
interface MultipleTemplatedRoutesForm {
    routeTemplateRef: string;
    routes: TemplatedRouteDefinition[];
}

export function TemplatedRoutePanel() {
    const { saveTemplatedRoutes, getTemplatedRoute, clearAllSelection, findTemplatedRoutes} = TemplatedRouteHook();
    const {file} = useFileStore();
    const {files} = useFilesStore();
    const selectedId  = file?.name;
    const {showSideBar} = useProjectPageStore();
    const {routeTemplates, fetchRouteTemplates, templateId} = useTemplatedRouteStore();

    // Changed form to manage the array of routes alongside the selected template ref
    const formContext = useForm<MultipleTemplatedRoutesForm>({ mode: "all" });
    const { reset, watch, control, setValue, getValues } = formContext;
    const { getTextField, getSimpleSelect } = useCreateProjectFormUtil(formContext);

    // useFieldArray now manages the multiple routes
    const { fields, replace, append, remove } = useFieldArray({
        control,
        name: "routes"
    });

    const [fileName, setFileName] = useState<string>('');

    function prepare() {
        try {
            const routeDef = getTemplatedRoute(selectedId);
            const routesArray = Array.isArray(routeDef) ? routeDef : (routeDef ? [routeDef] : []);
            const templateRef = templateId ?? (routesArray.length > 0 ? routesArray[0].routeTemplateRef : '');
            reset({ routeTemplateRef: templateRef, routes: routesArray });
            if (selectedId) {
                setFileName(selectedId.replace(KARAVAN_DOT_EXTENSION.CAMEL_YAML, ""));
            }
        } catch (error: any) {
            console.error(error);
        }
    }

    useEffect(() => {
        fetchRouteTemplates(files).then(_ => prepare());
    }, [selectedId, showSideBar]);

    useEffect(() => {
        const templatedRoutes = findTemplatedRoutes(`${fileName}${KARAVAN_DOT_EXTENSION.CAMEL_YAML}`, watchedRouteTemplateRef)
        reset({ routeTemplateRef: watchedRouteTemplateRef, routes: templatedRoutes });
    }, [fileName]);

    const watchedRouteTemplateRef = watch('routeTemplateRef');
    const isConfirmDisabled = !watchedRouteTemplateRef || fields.length === 0;

    useEffect(() => {
        if (watchedRouteTemplateRef && Object.keys(routeTemplates).length > 0) {
            const selectedTemplate = Object.values(routeTemplates).find(rt => rt.id === watchedRouteTemplateRef);
            const templateParams = selectedTemplate?.parameters || [];
            const currentRoutes = getValues('routes') || [];

            if (currentRoutes.length === 0) {
                // Auto-create at least one route if empty
                const newParams = templateParams.map(tp => new TemplatedRouteParameterDefinition({
                    name: tp.name, value: tp.defaultValue || ''
                }));
                // ADDED 'new TemplatedRouteDefinition'
                replace([new TemplatedRouteDefinition({
                    routeTemplateRef: watchedRouteTemplateRef,
                    parameters: newParams
                })]);
            } else {
                // Sync the template parameters for all existing routes
                const updatedRoutes = currentRoutes.map(route => {
                    const currentParams = route.parameters || [];
                    const newParams = templateParams.map(tp => {
                        const existing = currentParams.find(p => p.name === tp.name);
                        return new TemplatedRouteParameterDefinition({
                            name: tp.name,
                            value: existing ? existing.value : (tp.defaultValue || '')
                        });
                    });
                    // ADDED 'new TemplatedRouteDefinition'
                    return new TemplatedRouteDefinition({
                        ...route,
                        routeTemplateRef: watchedRouteTemplateRef,
                        parameters: newParams
                    });
                });
                replace(updatedRoutes);
            }

            if (fileName?.trim()?.length === 0) {
                setFileName(watchedRouteTemplateRef?.toLowerCase() + "-routes")
            }
        } else if (!watchedRouteTemplateRef) {
            replace([]);
        }
    }, [watchedRouteTemplateRef, routeTemplates, replace, getValues]);

    const handleAddRoute = () => {
        const selectedTemplate = Object.values(routeTemplates).find(rt => rt.id === watchedRouteTemplateRef);
        const templateParams = selectedTemplate?.parameters || [];
        const newParams = templateParams.map(tp => new TemplatedRouteParameterDefinition({
            name: tp.name,
            value: tp.defaultValue || ''
        }));
        const tr = CamelDefinitionApi.createTemplatedRouteDefinition({
            routeId: '',
            routeTemplateRef: watchedRouteTemplateRef,
            parameters: newParams
        })
        append(tr);
    };

    const onSave = (data: MultipleTemplatedRoutesForm) => {
        saveTemplatedRoutes(data.routes, selectedId, `${fileName}${KARAVAN_DOT_EXTENSION.CAMEL_YAML}`);
        clearAllSelection();
    }

    const templateOptions = Object.values(routeTemplates).map(rt => ({ value: rt.id, content: rt.description || rt.id }));

    function getFileNameInput() {
        return (
            <FormGroup label={"File Name"} fieldId={"fileName"}>
                <TextInputGroup className="search">
                    <TextInput
                        style={{textAlign: 'right'}}
                        value={fileName ?? ''}
                        onChange={(_event, value) => setFileName(value)}
                        isRequired
                        type="text"
                        aria-label="invalid text input example"
                    />
                    <TextInputGroupUtilities>
                        <Content style={{textWrap: 'nowrap', padding: '3px'}} component='p'>.camel.yaml</Content>
                    </TextInputGroupUtilities>
                </TextInputGroup>
            </FormGroup>
        );
    }

    return (
        <FormProvider {...formContext}>
            <SideBarFormWrapper
                formContext={formContext}
                onSave={onSave}
                onCancel={() => clearAllSelection()}
                isSubmitDisabled={isConfirmDisabled}
                saveOnEnter={false}
            >
                <Grid hasGutter md={6} style={{ marginBottom: '16px' }}>
                    <GridItem span={12}>
                        {getSimpleSelect('routeTemplateRef', 'Route Template', templateOptions)}
                    </GridItem>
                    <GridItem span={8}>
                        {getFileNameInput()}
                    </GridItem>
                </Grid>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {fields.map((field, index) => {
                        const templateParamInfo = Object.values(routeTemplates).find(rt => rt.id === watchedRouteTemplateRef)?.parameters;
                        return (
                            <Card key={field.id} isCompact>
                                <CardBody>
                                    <Grid hasGutter style={{ alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <GridItem span={11}>
                                            {getTextField(`routes.${index}.routeId`, 'Route ID/Prefix', {}, "text",
                                                (value) => {
                                                    setValue(`routes.${index}.prefixId`, value, { shouldDirty: true, shouldValidate: true });
                                                }
                                            )}
                                        </GridItem>
                                        <GridItem span={1}>
                                            <Button variant="link" onClick={() => remove(index)} aria-label="Delete route">
                                                <TimesIcon style={{ color: 'var(--pf-t--global--icon--color--status--danger--default)' }} />
                                            </Button>
                                        </GridItem>

                                        {field.parameters?.map((param, pIndex) => {
                                            const paramDesc = templateParamInfo?.find(p => p.name === param.name)?.description ?? param.name;
                                            return (
                                                <GridItem span={12} key={`${field.id}-param-${pIndex}`}>
                                                    <input type="hidden" {...formContext.register(`routes.${index}.parameters.${pIndex}.name`)} />
                                                    {getTextField(`routes.${index}.parameters.${pIndex}.value`, paramDesc, {  }, "text")}
                                                </GridItem>
                                            )
                                        })}
                                    </Grid>
                                </CardBody>
                            </Card>
                        )
                    })}

                    {watchedRouteTemplateRef && (
                        <Button
                            variant="link"
                            icon={<PlusIcon />}
                            onClick={handleAddRoute}
                            style={{ alignSelf: 'flex-start' }}
                        >
                            Add Route
                        </Button>
                    )}

                    {!watchedRouteTemplateRef && (
                        <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                            Select a route template to configure routes.
                        </Content>
                    )}
                </div>
            </SideBarFormWrapper>
        </FormProvider>
    );
}