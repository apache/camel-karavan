import '@features/project/designer/karavan.css';
import {CamelUtil} from "@core/api/CamelUtil";
import {DataFormatDefinition, ExpressionDefinition, ToDefinition,} from "@core/model/CamelDefinition";
import {CamelElement} from "@core/model/IntegrationDefinition";
import {CamelDefinitionApiExt} from "@core/api/CamelDefinitionApiExt";
import {CamelDefinitionApi} from "@core/api/CamelDefinitionApi";
import {shallow} from "zustand/shallow";
import {CamelMetadataApi} from "@core/model/CamelMetadata";
import {INTERNAL_COMPONENTS} from "@core/api/ComponentApi";
import {CamelUi, RouteToCreate} from "@features/project/designer/utils/CamelUi";
import {useDesignerStore, useIntegrationStore} from "@features/project/designer/DesignerStore";
import {EventBus} from "@features/project/designer/utils/EventBus";

export function usePropertiesHook() {

    const [integration, setIntegration] = useIntegrationStore((state) => [state.integration, state.setIntegration], shallow)
    const [selectedStep, setSelectedStep, setSelectedUuids, tab] = useDesignerStore((s) =>
        [s.selectedStep, s.setSelectedStep, s.setSelectedUuids, s.tab], shallow)

    function onPropertyUpdate(element: CamelElement, newRoute?: RouteToCreate) {
        if (tab === 'routes') {
            onRoutePropertyUpdate(element, newRoute);
        } else if (tab === 'rest') {
            onRestPropertyUpdate(element, newRoute);
        } else if (tab === 'beans') {
            onBeanPropertyUpdate(element, newRoute);
        }
    }

    function onRoutePropertyUpdate(element: CamelElement, newRoute?: RouteToCreate) {
        if (newRoute) {
            let i = CamelDefinitionApiExt.updateIntegrationRouteElement(integration, element);
            const r = CamelUi.createRouteFromComponent(newRoute.routeId, newRoute.componentName, newRoute.parameters);
            i = CamelDefinitionApiExt.addStepToIntegration(i, r, '');
            const clone = CamelUtil.cloneIntegration(i);
            setIntegration(clone, false);
            setSelectedStep(element);
            setSelectedUuids([element.uuid]);
        } else {
            const clone = CamelUtil.cloneIntegration(integration);
            const i = CamelDefinitionApiExt.updateIntegrationRouteElement(clone, element);
            setIntegration(i, true);
        }
    }

    function onRestPropertyUpdate(element: CamelElement, newRoute?: RouteToCreate) {
        if (newRoute) {
            let i = CamelDefinitionApiExt.updateIntegrationRestElement(integration, element);
            const f = CamelDefinitionApi.createFromDefinition({
                uri: newRoute.componentName,
                parameters: newRoute.parameters,
            });
            const r = CamelDefinitionApi.createRouteDefinition({from: f, id: newRoute.routeId})
            i = CamelDefinitionApiExt.addStepToIntegration(i, r, '');
            const clone = CamelUtil.cloneIntegration(i);
            setIntegration(clone, false);
            setSelectedStep(element);
        } else {
            const clone = CamelUtil.cloneIntegration(integration);
            const i = CamelDefinitionApiExt.updateIntegrationRestElement(clone, element);
            setIntegration(i, true);
            // setSelectedStep(element);
        }
    }

    function onBeanPropertyUpdate(element: CamelElement, newRoute?: RouteToCreate) {
        if (newRoute) {
            let i = CamelDefinitionApiExt.updateIntegrationBeanElement(integration, element);
            const f = CamelDefinitionApi.createFromDefinition({
                uri: newRoute.componentName,
                parameters: newRoute.parameters,
            });
            const r = CamelDefinitionApi.createRouteDefinition({from: f, id: newRoute.routeId})
            i = CamelDefinitionApiExt.addStepToIntegration(i, r, '');
            const clone = CamelUtil.cloneIntegration(i);
            setIntegration(clone, false);
            setSelectedStep(element);
        } else {
            const clone = CamelUtil.cloneIntegration(integration);
            const i = CamelDefinitionApiExt.updateIntegrationBeanElement(clone, element);
            setIntegration(i, true);
            // setSelectedStep(element);
        }
    }

    function onPropertyChange(fieldId: string, value: string | number | boolean | any, newRoute?: RouteToCreate) {
        value = value === '' ? undefined : value;
        if (selectedStep) {
            const clone = CamelUtil.cloneStep(selectedStep);
            (clone as any)[fieldId] = value;
            setSelectedStep(clone)
            onPropertyUpdate(clone, newRoute);
        }
    }

    function onStepPropertyChange(step: CamelElement, fieldId: string, value: string | number | boolean | any) {
        value = value === '' ? undefined : value;
        if (step) {
            const clone = CamelUtil.cloneStep(step);
            (clone as any)[fieldId] = value;
            onPropertyUpdate(clone, undefined);
        }
    }

    function onDisableStep(step: CamelElement, disabled: boolean = false) {
        if (step) {
            const clone = CamelUtil.cloneStep(step);
            if (disabled) {
                (clone as any).disabled = true;
            } else {
                delete (clone as any).disabled;
            }
            onPropertyUpdate(clone);
        }
    }

    function onAutoStartRoute(route: CamelElement, autoStartup: boolean = true) {
        if (route) {
            const clone = CamelUtil.cloneStep(route);
            if (!autoStartup) {
                (clone as any).autoStartup = false;
            } else {
                delete (clone as any).autoStartup;
            }
            onPropertyUpdate(clone);
        }
    }

    function onDataFormatChange(value: DataFormatDefinition) {
        value.uuid = selectedStep?.uuid ? selectedStep?.uuid : value.uuid;
        setSelectedStep(value);
        onPropertyUpdate(value);
    }

    function onExpressionChange(propertyName: string, exp: ExpressionDefinition) {
        if (selectedStep) {
            const clone = (CamelUtil.cloneStep(selectedStep));
            (clone as any)[propertyName] = exp;
            setSelectedStep(clone);
            onPropertyUpdate(clone);
        }
    }

    function onParametersChange(parameter: string, value: string | number | boolean | any, pathParameter?: boolean, newRoute?: RouteToCreate) {
        value = value === '' ? undefined : value;
        if (selectedStep) {
            const clone = (CamelUtil.cloneStep(selectedStep));
            const parameters: any = {...(clone as any).parameters};
            parameters[parameter] = value;
            (clone as any).parameters = parameters;
            setSelectedStep(clone);
            onPropertyUpdate(clone, newRoute);
        }
    }

    function getInternalComponentName(propertyName: string, element?: CamelElement): string {
        if (element && element.dslName === 'ToDefinition' && (propertyName === 'name' || propertyName === 'address')) {
            const uri: string = (element as ToDefinition).uri || '';
            const parts = uri.split(":");
            if (parts.length > 0 && INTERNAL_COMPONENTS.includes(parts[0])) {
                return parts[0];
            }
            return '';
        } else {
            return '';
        }
    }

    function cloneElement() {
        // TODO:
    }

    function saveAsRoute(step: CamelElement, stepsOnly: boolean) {
        if (step && step.hasSteps()) {
            const stepClone = CamelUtil.cloneStep(step, true);
            const from = CamelDefinitionApi.createFromDefinition({uri: "direct", parameters: {name: (step as any).id}});
            if (stepsOnly) {
                from.steps = (stepClone as any).steps;
            } else {
                from.steps = [stepClone]
            }
            const route = CamelDefinitionApi.createRouteDefinition({from: from, nodePrefixId: (step as any).id});
            const clone = CamelUtil.cloneIntegration(integration);
            clone.spec.flows?.push(route)
            setIntegration(clone, false);
            // setSelectedStep(element);
        }
    }

    const convertStep = (step: CamelElement, targetDslName: string) => {
        try {
            // setSelectedStep(undefined);
            if (targetDslName === 'ChoiceDefinition' && step.dslName === 'FilterDefinition') {
                const clone = CamelUtil.cloneStep(step, true);
                delete (clone as any).dslName;
                delete (clone as any).stepName;
                const when = CamelDefinitionApi.createWhenDefinition(clone);
                const otherwise = CamelDefinitionApi.createOtherwiseDefinition(undefined);
                const choice = CamelDefinitionApi.createChoiceDefinition({
                    uuid: step.uuid,
                    when: [when],
                    otherwise: otherwise
                });
                onPropertyUpdate(choice);
                setSelectedStep(choice);
            } else {
                const clone = CamelUtil.cloneStep(step, false);
                const metaSource = CamelMetadataApi.getCamelModelMetadataByClassName(clone.dslName);
                const metaTarget = CamelMetadataApi.getCamelModelMetadataByClassName(targetDslName);
                metaSource?.properties.forEach(pro => {
                    const toDelete = metaTarget?.properties.findIndex(x => x.name === pro.name) === -1;
                    if (toDelete) {
                        delete (clone as any)[pro.name];
                    }
                })
                delete (clone as any).dslName;
                delete (clone as any).stepName;
                const converted = CamelDefinitionApi.createStep(targetDslName, clone, true);
                onPropertyUpdate(converted);
                setSelectedStep(converted);
            }
        } catch (e: any) {
            EventBus.sendAlert('Error converting step', e.message, 'danger')
        }
    }

    return {
        saveAsRoute,
        convertStep,
        cloneElement,
        onPropertyChange,
        onParametersChange,
        onDataFormatChange,
        onExpressionChange,
        getInternalComponentName,
        onDisableStep,
        onAutoStartRoute,
        onStepPropertyChange,
    }
}