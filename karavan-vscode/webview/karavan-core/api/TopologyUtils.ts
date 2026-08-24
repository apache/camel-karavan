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
import {
    BeanFactoryDefinition,
    DeleteDefinition,
    FromDefinition,
    GetDefinition,
    HeadDefinition,
    PatchDefinition,
    PostDefinition,
    PutDefinition,
    RestDefinition,
    RouteConfigurationDefinition,
    RouteDefinition,
    SagaDefinition,
    TemplatedRouteDefinition,
} from '../model/CamelDefinition';
import {CamelElement, Integration,} from '../model/IntegrationDefinition';
import {
    TopologyAsyncApiNode,
    TopologyAsyncApiOperation,
    TopologyBeanNode,
    TopologyIncomingNode,
    TopologyOpenApiNode,
    TopologyOpenApiOperation,
    TopologyOutgoingNode,
    TopologyRestNode,
    TopologyRouteConfigurationNode,
    TopologyRouteNode,
    TopologyStep,
} from '../model/TopologyDefinition';
import {ComponentApi, INTERNAL_COMPONENTS} from './ComponentApi';
import {CamelDefinitionApiExt} from './CamelDefinitionApiExt';
import {CamelDisplayUtil} from './CamelDisplayUtil';
import {CamelUtil} from './CamelUtil';
import {LANDSCAPE_FILE_NAME_JSON, OPENAPI_FILE_NAME_JSON, X_APPLICATION_ID} from '../contants';
import {CamelDefinitionYaml} from "@core/api/CamelDefinitionYaml";
import {BeanUsageData, ExchangeDataUsage} from "@core/model/ExchangeDefinitions";

const outgoingDefinitions: string[] = ['ToDefinition', 'KameletDefinition', 'ToDynamicDefinition', 'PollEnrichDefinition', 'EnrichDefinition', 'WireTapDefinition', 'SagaDefinition', 'PollDefinition'];

export interface IncomingLink {
    name: string;
    fileName: string;
}

export class TopologyUtils {
    private constructor() {
    }

    static getOutgoingDefinitions = (): string[] => {
        return outgoingDefinitions;
    };

    static isElementInternalComponent = (element: CamelElement): boolean => {
        const uri = (element as any).uri;
        const component = ComponentApi.findByName(uri);
        if (INTERNAL_COMPONENTS.includes(uri?.split(':')?.[0])) return true;
        return component !== undefined && component.component.remote !== true;
    };

    static getConnectorType = (element: CamelElement): 'component' | 'kamelet' => {
        return CamelUtil.isKameletComponent(element) ? 'kamelet' : 'component';
    };

    static cutKameletUriSuffix = (uri: string): string => {
        if (uri.endsWith('-sink')) {
            return uri.substring(0, uri.length - 5);
        } else if (uri.endsWith('-source')) {
            return uri.substring(0, uri.length - 7);
        } else if (uri.endsWith('-action')) {
            return uri.substring(0, uri.length - 7);
        } else {
            return uri;
        }
    };

    static getUniqueUri = (element: CamelElement): string => {
        const uri: string = (element as any).uri || '';
        const className = element.dslName;
        const isSQL = ['FromDefinition', 'ToDefinition', 'ToDynamicDefinition', 'WireTapDefinition'].includes(className)
            && !CamelUtil.isKameletComponent(element)
            && uri === 'sql';
        if (isSQL) {
            const dataSource = CamelDefinitionApiExt.getParametersValue(element, "dataSource", false);
            return uri.concat(':').concat(dataSource);
        } else {
            let result = uri.startsWith('kamelet') ? TopologyUtils.cutKameletUriSuffix(uri).concat(':') : uri.concat(':');
            const className = element.dslName;
            if (['FromDefinition', 'ToDefinition', 'ToDynamicDefinition', 'WireTapDefinition'].includes(className)) {
                if (!CamelUtil.isKameletComponent(element)) {
                    const requiredProperties = CamelUtil.getComponentProperties(element).filter(p => p.required);
                    for (const property of requiredProperties) {
                        const value = CamelDefinitionApiExt.getParametersValue(element, property.name, property.kind === 'path');
                        if (value !== undefined) {
                            const valueString = property.type === 'string' ? value?.trim() : value?.toString()?.trim();
                            if (valueString?.length > 0) {
                                result = result + property.name + '=' + valueString + '&';
                            }
                        }
                    }
                } else {
                    const requiredProperties = CamelUtil.getKameletProperties(element, true);
                    for (const property of requiredProperties) {
                        const value = CamelDefinitionApiExt.getParametersValue(element, property.id);
                        if (value !== undefined && property.type === 'string' && value?.toString()?.trim().length > 0) {
                            result = result + property.id + '=' + value + '&';
                        }
                    }
                }
            }
            return result.endsWith('&') ? result.substring(0, result.length - 1) : result;
        }
    }

    static hasDirectUri = (element: CamelElement): boolean => {
        return this.hasUriStartWith(element, 'direct');
    };

    static hasSedaUri = (element: CamelElement): boolean => {
        return this.hasUriStartWith(element, 'seda');
    };

    static hasUriStartWith = (element: CamelElement, text: string): boolean => {
        if ((element as any).uri && typeof (element as any).uri === 'string') {
            return (element as any).uri.startsWith(text);
        } else if (element.dslName === 'SagaDefinition') {
            const completion = (element as SagaDefinition).completion || '';
            const compensation = (element as SagaDefinition).compensation || '';
            return completion.startsWith(text) || compensation.startsWith(text);
        } else {
            return false;
        }
    };

    static findTopologyRestNodes = (integration: Integration[]): TopologyRestNode[] => {
        const result: TopologyRestNode[] = [];
        integration.forEach(i => {
            try {
                const filename = i.metadata.name;
                const routes = i.spec.flows?.filter(flow => flow.dslName === 'RestDefinition');
                routes?.forEach((rest: RestDefinition) => {
                    const uris: string[] = [];
                    rest?.get?.forEach((d: GetDefinition) => {
                        if (d.to) uris.push(d.to);
                    });
                    rest?.post?.forEach((d: PostDefinition) => {
                        if (d.to) uris.push(d.to);
                    });
                    rest?.put?.forEach((d: PutDefinition) => {
                        if (d.to) uris.push(d.to);
                    });
                    rest?.delete?.forEach((d: DeleteDefinition) => {
                        if (d.to) uris.push(d.to);
                    });
                    rest?.patch?.forEach((d: PatchDefinition) => {
                        if (d.to) uris.push(d.to);
                    });
                    rest?.head?.forEach((d: HeadDefinition) => {
                        if (d.to) uris.push(d.to);
                    });
                    const title = '' + (rest.description ? rest.description : rest.id);
                    result.push(new TopologyRestNode(rest.path || '', '' + rest.id, uris, title, filename, rest));
                });
            } catch (e) {
                console.error(e);
            }
        });
        return result;
    };


    static findTopologyOpenApiNodes = (json: string): TopologyOpenApiNode => {
        const operations: TopologyOpenApiOperation[] = [];
        let title = 'OpenAPI';

        try {
            const openapi = JSON.parse(json);

            // Get API title if available
            if (openapi.info && typeof openapi.info.title === "string") {
                title = openapi.info.title;
            }

            const HTTP_METHODS = [
                'get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'
            ];

            if (openapi.paths) {
                for (const path in openapi.paths) {
                    const pathItem = openapi.paths[path];

                    for (const method of HTTP_METHODS) {
                        if (pathItem[method]) {
                            const op = pathItem[method];
                            const operationId = op.operationId || '';
                            // Use operation summary, or description, or fallback to operationId
                            const opTitle =
                                op.summary ||
                                op.description ||
                                operationId ||
                                `${method.toUpperCase()} ${path}`;
                            operations.push(
                                new TopologyOpenApiOperation(
                                    path,
                                    opTitle,
                                    method.toUpperCase(),
                                    operationId
                                )
                            );
                        }
                    }
                }
            }
        } catch (err) {
            console.error(err);
        }
        return new TopologyOpenApiNode(OPENAPI_FILE_NAME_JSON, title, operations);
    };

    static findTopologyAsyncApiNodes = (json: string, applicationName?: string): TopologyAsyncApiNode => {
        const operations: TopologyAsyncApiOperation[] = [];
        let title = 'AsyncAPI';

        try {
            const asyncapi = JSON.parse(json);
            if (asyncapi.info && typeof asyncapi.info.title === "string") {
                title = asyncapi.info.title;
            }

            if (asyncapi.operations) {
                Object.keys(asyncapi.operations).forEach((operationId) => {
                    const operation = asyncapi.operations[operationId];
                    const xApplication: string = operation?.[X_APPLICATION_ID]
                    if (applicationName === undefined || applicationName === xApplication) {
                        operations.push(
                            new TopologyAsyncApiOperation(
                                operationId,
                                operation.summary,
                                operation.action,
                                operation.channel?.$ref
                            )
                        );
                    }
                });
            }
        } catch (err) {
            console.error(err);
        }
        return new TopologyAsyncApiNode(LANDSCAPE_FILE_NAME_JSON, title, operations);
    };

    static findTopologyIncomingNodes = (integration: Integration[]): TopologyIncomingNode[] => {
        const result: TopologyIncomingNode[] = [];
        integration.forEach(i => {
            try {
                const filename = i.metadata.name;
                const routes = i.spec.flows?.filter(flow => flow.dslName === 'RouteDefinition');
                const routeElements = routes?.map(r => {
                    const id = 'incoming-' + r.id;
                    const title = CamelDisplayUtil.getStepDescription(r.from);
                    const type = TopologyUtils.isElementInternalComponent(r.from) ? 'internal' : 'external';
                    const connectorType = TopologyUtils.getConnectorType(r.from);
                    const uniqueUri = TopologyUtils.getUniqueUri(r.from);
                    return new TopologyIncomingNode(id, type, connectorType, r.id, r.group, title, filename, r.from, uniqueUri);
                }) || [];
                result.push(...routeElements);
                const templates = i.spec.flows?.filter(flow => flow.dslName === 'RouteTemplateDefinition');
                const templateElements = templates?.map(t => {
                    const r = t.route;
                    const id = 'incoming-' + r.id;
                    const title = CamelDisplayUtil.getStepDescription(r.from);
                    const type = TopologyUtils.isElementInternalComponent(r.from) ? 'internal' : 'external';
                    const connectorType = TopologyUtils.getConnectorType(r.from);
                    const uniqueUri = TopologyUtils.getUniqueUri(r.from);
                    return new TopologyIncomingNode(id, type, connectorType, r.id, r.group, title, filename, r.from, uniqueUri);
                }) || [];
                // result.push(...templateElements);
            } catch (e) {
                console.error(e);
            }
        });
        return result;
    };

    static findTopologyRoutesIncomingNodes = (routes: TopologyRouteNode[]): TopologyIncomingNode[] => {
        const result: TopologyIncomingNode[] = [];
        const routeElements = routes?.map(r => {
            const id = 'incoming-' + r.id;
            const title = CamelDisplayUtil.getStepDescription(r.from);
            const type = TopologyUtils.isElementInternalComponent(r.from) ? 'internal' : 'external';
            const connectorType = TopologyUtils.getConnectorType(r.from);
            const from = CamelUtil.cloneStep(r.from) as FromDefinition;
            const uniqueUri = TopologyUtils.getUniqueUri(r.from);
            return new TopologyIncomingNode(id, type, connectorType, r.routeId, r.route?.group, title, r.fileName, from, uniqueUri);
        }) || [];
        result.push(...routeElements);
        return result;
    };

    static getUriLabel(uniqueUri: string) {
        const parts = uniqueUri.split(':');
        if (parts?.at(0) === "sql") {
            return uniqueUri.replace('sql:', '')?.replace('#bean:', '');
        }
        const params = parts[1];
        const elements = params.split("&");
        return elements.map(element => element.split("=")[1]).join(':').trim();
    }

    static findTopologyRouteNodes = (integration: Integration[], isTemplated?: boolean): TopologyRouteNode[] => {
        const result: TopologyRouteNode[] = [];
        integration.forEach(i => {
            try {
                const filename = i.metadata.name;
                const routes = i.spec.flows?.filter(flow => flow.dslName === 'RouteDefinition');
                const routeElements = routes?.map(r => {
                    const id = 'route-' + r.id;
                    const title = (r.description ? r.description : r.id);
                    return new TopologyRouteNode(id, r.id, title, filename, r.from, r, (r as any).routeTemplateRef, undefined, isTemplated);
                }) || [];
                result.push(...routeElements);
                const templates = i.spec.flows?.filter(flow => flow.dslName === 'RouteTemplateDefinition');
                const templateElements = templates?.map(t => {
                    const r = t.route;
                    const id = 'route-' + r.id;
                    const title = (r.description ? r.description : r.id);
                    return new TopologyRouteNode(id, r.id, title, filename, r.from, r, t.id, t.description);
                }) || [];
                result.push(...templateElements);
            } catch (e) {
                console.error(e);
            }
        });
        return result;
    };

    static findTopologyTemplatedRouteNodes = (integrations: Integration[], routeTemplates: TopologyRouteNode[]): TopologyRouteNode[] => {
        const templatedIntegrations: Integration[] = [];
        const templates: any = {};
        routeTemplates.forEach((template: TopologyRouteNode) => {
            const i = Integration.createNew(template.templateId);
            i.spec.flows?.push(template.route);
            if (template.templateId) {
                templates[template.templateId] = CamelDefinitionYaml.integrationToYaml(i);
            }
        })
        integrations.forEach(integration => {
            try {
                const templatedRoutes = integration.spec.flows?.filter(flow => flow.dslName === 'TemplatedRouteDefinition');
                templatedRoutes?.forEach((templatedRoute: TemplatedRouteDefinition) => {
                    const yaml = templates[templatedRoute.routeTemplateRef];
                    if (yaml) {
                        const data = templatedRoute?.parameters
                                        ? Object.fromEntries(templatedRoute.parameters.map(p => [p.name, p.value]))
                                        : {};
                        const code = TopologyUtils.replacePlaceholders(yaml, data);
                        const i = CamelDefinitionYaml.yamlToIntegration(integration?.metadata.name, code);
                        const route = i.spec.flows?.at(0) as RouteDefinition;
                        if (route && i.spec.flows && i.spec.flows?.length > 0) {
                            route.id = templatedRoute.routeId;
                            (route as any).routeTemplateRef = templatedRoute.routeTemplateRef;
                            i.spec.flows[0] = route;
                        }
                        templatedIntegrations.push(i);
                    }
                })
            } catch (e) {
                console.error(e);
            }
        });
        return TopologyUtils.findTopologyRouteNodes(templatedIntegrations, true);
    };

    static findTopologyRouteConfigurationNodes = (integration: Integration[]): TopologyRouteConfigurationNode[] => {
        const result: TopologyRouteConfigurationNode[] = [];
        integration.forEach(i => {
            try {
                const filename = i.metadata.name;
                const routes = i.spec.flows?.filter(flow => flow.dslName === 'RouteConfigurationDefinition');
                const routeElements = routes?.map(r => {
                    const id = 'route-' + r.id;
                    const title = '' + (r.description ? r.description : (r.id || 'default'));
                    return new TopologyRouteConfigurationNode(id, r.id, title, filename, r);
                }) || [];
                result.push(...routeElements);
            } catch (e) {
                console.error(e);
            }
        });
        return result;
    };

    static findTopologyRouteOutgoingNodes = (integrations: Integration[]): TopologyOutgoingNode[] => {
        const result: TopologyOutgoingNode[] = [];
        integrations.forEach(i => {
            try {
                const filename = i.metadata.name;
                const routes = i.spec.flows?.filter(flow => flow.dslName === 'RouteDefinition') || [];
                const routeFromTemplates = i.spec.flows?.filter(flow => flow.dslName === 'RouteTemplateDefinition').map(rt => rt.route) || [];
                routes.concat(routeFromTemplates).forEach(route => {
                    const from: FromDefinition = route.from;
                    const elements = TopologyUtils.findOutgoingInStep(from, []);
                    elements.forEach((e: any) => {
                        const id = 'outgoing-' + route.id + '-' + e.id;
                        const title = CamelDisplayUtil.getStepDescription(e);
                        const type = TopologyUtils.isElementInternalComponent(e) ? 'internal' : 'external';
                        const connectorType = TopologyUtils.getConnectorType(e);
                        const uniqueUri = TopologyUtils.getUniqueUri(e);
                        if (
                            connectorType !== 'kamelet' ||
                            CamelUtil.getKamelet(e)?.metadata.labels['camel.apache.org/kamelet.type'] !== 'action'
                        ) {
                            result.push(new TopologyOutgoingNode(id, type, connectorType, route.id, route.group, title, filename, e, uniqueUri));
                        }
                    });
                    result.push(...TopologyUtils.findDeadLetterChannelNodes(route, filename));
                });
            } catch (e) {
                console.error(e);
            }
        });
        return result;
    };

    static findTopologyRoutesOutgoingNodes = (routes: TopologyRouteNode[]): TopologyOutgoingNode[] => {
        const result: TopologyOutgoingNode[] = [];
        routes.forEach(route => {
            try {
                const filename = route.fileName;
                const from: FromDefinition = route.from;
                const elements = TopologyUtils.findOutgoingInStep(from, []);
                elements.forEach((e: any) => {
                    const step: any = CamelUtil.cloneStep(e)
                    const id = 'outgoing-' + route.id + '-' + step.id;
                    const title = CamelDisplayUtil.getStepDescription(step);
                    const type = TopologyUtils.isElementInternalComponent(step) ? 'internal' : 'external';
                    const connectorType = TopologyUtils.getConnectorType(step);
                    const uniqueUri = TopologyUtils.getUniqueUri(step);
                    if (
                        connectorType !== 'kamelet' ||
                        CamelUtil.getKamelet(e)?.metadata.labels['camel.apache.org/kamelet.type'] !== 'action'
                    ) {
                        result.push(new TopologyOutgoingNode(id, type, connectorType, route.routeId, route.route.group, title, filename, step, uniqueUri));
                    }
                });
                result.push(...TopologyUtils.findDeadLetterChannelNodes(route.route, filename));
            } catch (e) {
                console.error(e);
            }
        });
        return result;
    };

    static findDeadLetterChannelNodes(route: RouteDefinition, filename: string): TopologyOutgoingNode[] {
        const result: TopologyOutgoingNode[] = [];
        try {
            const deadLetterChannel = route.errorHandler?.deadLetterChannel;
            const deadLetterUri = deadLetterChannel?.deadLetterUri;
            if (deadLetterChannel !== undefined && deadLetterUri !== undefined) {
                const parts = deadLetterUri.split(':');
                if (parts.length > 1 && INTERNAL_COMPONENTS.includes(parts[0])) {
                    const id = 'outgoing-' + route.id + '-' + deadLetterChannel?.id;
                    const title = CamelDisplayUtil.getStepDescription(deadLetterChannel);
                    const type = 'internal';
                    const connectorType = 'component';
                    result.push(new TopologyOutgoingNode(id, type, connectorType, route.id || '', route.group, title, filename, deadLetterChannel, deadLetterUri));
                }
            }
        } catch (e) {
            console.error(e);
        }
        return result;
    }

    static findTopologyRouteConfigurationOutgoingNodes = (integrations: Integration[]): TopologyOutgoingNode[] => {
        const result: TopologyOutgoingNode[] = [];
        integrations.forEach(i => {
            try {
                const filename = i.metadata.name;
                const rcs = i.spec.flows?.filter(flow => flow.dslName === 'RouteConfigurationDefinition');
                rcs?.forEach((rc: RouteConfigurationDefinition) => {
                    const children: CamelElement[] = [];
                    children.push(...rc.intercept || []);
                    children.push(...rc.interceptFrom || []);
                    children.push(...rc.interceptSendToEndpoint || []);
                    children.push(...rc.onCompletion || []);
                    children.push(...rc.onException || []);
                    children.forEach(child => {
                        const elements = TopologyUtils.findOutgoingInStep(child, []);
                        elements.forEach((e: any) => {
                            const id = 'outgoing-' + rc.id + '-' + e.id;
                            const title = CamelDisplayUtil.getStepDescription(e);
                            const type = TopologyUtils.isElementInternalComponent(e) ? 'internal' : 'external';
                            const connectorType = TopologyUtils.getConnectorType(e);
                            const uniqueUri = TopologyUtils.getUniqueUri(e);
                            result.push(new TopologyOutgoingNode(id, type, connectorType, rc.id || 'undefined', "", title, filename, e, uniqueUri));
                        });
                    });
                    if (rc.errorHandler?.deadLetterChannel) {
                        const e = rc.errorHandler?.deadLetterChannel;
                        const id = 'outgoing-' + rc.id + '-' + e.id;
                        const title = CamelDisplayUtil.getStepDescription(e);
                        const comp = e?.deadLetterUri?.split(':')?.[0];
                        const type = INTERNAL_COMPONENTS.includes(comp) ? 'internal' : 'external';
                        const connectorType = 'component';
                        const uniqueUri = e?.deadLetterUri;
                        result.push(new TopologyOutgoingNode(id, type, connectorType, rc.id || 'undefined', "", title, filename, e, uniqueUri));
                    }
                });
            } catch (e) {
                console.error(e);
            }
        });
        return result;
    };

    static findTopologyBeanNodes = (integrations: Integration[]): TopologyBeanNode[] => {
        const result: TopologyBeanNode[] = [];
        integrations.forEach(integration => {
            const beans = TopologyUtils.getBeans(integration);
            const topologyBeans = beans.map((bean) => new TopologyBeanNode('bean-' + bean.name, bean.name, integration.metadata.name));
            result.push(...topologyBeans);
        })
        return result;
    }

    static findTopologyJavaClassNodes = (fileNames: string[]): TopologyBeanNode[] => {
        return fileNames?.filter(f => f.endsWith(".java")).map(f => {
            const name = f?.replace(".java", "");
            return new TopologyBeanNode('java-'+ name, name, f);
        });
    }

    static getBeans = (integration: Integration): BeanFactoryDefinition[] => {
        const result: BeanFactoryDefinition[] = [];
        const beans = integration.spec.flows?.filter((e: any) => e.dslName === 'Beans');
        if (beans && beans.length > 0 && beans[0].beans) {
            result.push(...beans[0].beans);
        }
        return result;
    }

    static getAllBeans = (integrations: Integration[]): BeanFactoryDefinition[] => {
        const result: BeanFactoryDefinition[] = [];
        integrations.forEach(integration => {
            const beans = TopologyUtils.getBeans(integration);
            result.push(...beans);
        })
        return result;
    }

    static findTopologyBeanUseRouteIds = (integrations: Integration[], beans: TopologyBeanNode[]): BeanUsageData[] => {
        const result: BeanUsageData[] = [];

        const routes = TopologyUtils.findTopologyRouteNodes(integrations);
        routes.forEach(route => {
            const i = Integration.createNew("dummy");
            i.spec.flows?.push(route);
            const yaml = CamelDefinitionYaml.integrationToYaml(i);

            beans.forEach(bean => {
                const beanUsage: BeanUsageData = result.find(b => b.name === bean.name) || {name: bean.name, usages: []} as BeanUsageData;
                if (yaml.includes(bean.name)) {
                    const usages = beanUsage.usages?.map((usage) => usage.routeId);
                    if (!usages?.includes(route.id)) {
                        beanUsage.usages.push({routeId: route.routeId} as ExchangeDataUsage);
                    }
                }
                result.push(beanUsage);
            });
        });
        return result;
    };

    static beanUsedInBean = (bean: BeanFactoryDefinition, beanName: string): boolean => {
        if (bean.properties) {
            for (const property of Object.keys(bean.properties)) {
                const value: string | undefined = bean.properties[property]?.toString();
                if (value?.startsWith("#bean:") && value?.includes(beanName)) {
                    return true; // Exits the entire function immediately
                }
            }
        }
        return false;
    };

    static findTopologyBean2Bean = (integrations: Integration[], beans: TopologyBeanNode[]): Record<string, string[]> => {
        const result: Record<string, string[]> = {};

        beans.forEach(bean => {
            result[bean.id] = [];
        });

        const allBeans = TopologyUtils.getAllBeans(integrations);
        beans.forEach(bean => {
            allBeans.forEach(beanDefinition => {
                if (beanDefinition?.name !== bean.name) {
                    const isUsed = TopologyUtils.beanUsedInBean(beanDefinition, bean.name);
                    if (isUsed) {
                        result[bean.id].push("bean-" + beanDefinition.name);
                    }
                }
            });
        });
        return result;
    };


    static findOutgoingInStep = (step: CamelElement, result: CamelElement[]): CamelElement[] => {
        if (step !== undefined) {
            const el = (step as any);
            try {
                if (outgoingDefinitions.includes(el.dslName)) {
                    result.push(step);
                } else {
                    const childElements = CamelDefinitionApiExt.getElementChildrenDefinition(el.dslName);
                    childElements.forEach(child => {
                        if (child.multiple) {
                            const sub = (el[child.name] as CamelElement[]);
                            TopologyUtils.findOutgoingInSteps(sub, result);
                        } else {
                            const sub = (el[child.name] as CamelElement);
                            TopologyUtils.findOutgoingInStep(sub, result);
                        }
                    });
                }
            } catch (e) {
                console.error(e);
            }
        }
        return result;
    };

    static findOutgoingInSteps = (steps: CamelElement[], result: CamelElement[]): CamelElement[] => {
        if (steps !== undefined && steps.length > 0) {
            steps.forEach(step => TopologyUtils.findOutgoingInStep(step, result));
        }
        return result;
    };

    static getNodeIdByUriAndName(tins: TopologyIncomingNode[], uri: string, name: string): string | undefined {
        if (uri && name) {
            const node = tins
                .filter(r => r.from.uri === uri
                    && (r?.from?.parameters?.name === name || r?.from?.parameters?.address === name),
                ).at(0);
            if (node) {
                return node.id;
            }
        }
    }

    static getNodeIdByUniqueUri(tins: TopologyIncomingNode[], uniqueUri: string): TopologyIncomingNode [] {
        const result: TopologyIncomingNode[] = [];
        tins.filter(r => r.uniqueUri === uniqueUri)
            ?.forEach(node => result.push(node));
        return result;
    }

    static getNodeIdByUri(tins: TopologyIncomingNode[], uri: string): string | undefined {
        const parts = uri.split(':');
        if (parts.length > 1) {
            return TopologyUtils.getNodeIdByUriAndName(tins, parts[0], parts[1]);
        }
    }

    static getRouteIdByUriAndName(tins: TopologyIncomingNode[], uri: string, name: string): string | undefined {
        if (uri && name) {
            const node = tins
                .filter(r => r.from.uri === uri
                    && (r?.from?.parameters?.name === name || r?.from?.parameters?.address === name),
                ).at(0);
            if (node) {
                return 'route-' + node.routeId;
            }
        }
    }

    static getIncomingNodeByUniqueUri(tins: TopologyIncomingNode[], uniqueUri: string): TopologyIncomingNode [] {
        const result: TopologyIncomingNode[] = [];
        tins.filter(r => r.uniqueUri === uniqueUri)
            ?.forEach(node => result.push(node));
        return result;
    }

    static getOutgoingNodeByUniqueUri(tins: TopologyOutgoingNode[], uniqueUri: string): TopologyOutgoingNode [] {
        const result: TopologyOutgoingNode[] = [];
        tins.filter(r => r.uniqueUri === uniqueUri)
            ?.forEach(node => result.push(node));
        return result;
    }

    static getRouteIdByUri(tins: TopologyIncomingNode[], uri: string): string | undefined {
        const parts = uri.split(':');
        if (parts.length > 1) {
            return TopologyUtils.getRouteIdByUriAndName(tins, parts[0], parts[1]);
        }
    }

    static getIncomingLinkMap(integrations: Integration[], openApiJson?: string): Map<string, IncomingLink[]> {
        const data = new Map<string, IncomingLink[]>();
        TopologyUtils.findTopologyRouteOutgoingNodes(integrations).forEach(t => {
            const key = (t.step as any)?.uri + ':' + (t.step as any)?.parameters?.name;
            if (data.has(key)) {
                const list = data.get(key) || [];
                list.push({name: t.routeId, fileName: t.fileName});
                data.set(key, list);
            } else {
                data.set(key, [{name: t.routeId, fileName: t.fileName}]);
            }
        });
        TopologyUtils.findTopologyRestNodes(integrations).forEach(t => {
            t.rest?.get?.forEach(def => {
                if (def.to) {
                    data.set(def.to, [{name: 'GET:' + (def.path || ''), fileName: t.fileName}])
                }
            })
            t.rest?.post?.forEach(def => {
                if (def.to) {
                    data.set(def.to, [{name: 'POST:' + (def.path || ''), fileName: t.fileName}])
                }
            })
            t.rest?.put?.forEach(def => {
                if (def.to) {
                    data.set(def.to, [{name: 'PUT:' + (def.path || ''), fileName: t.fileName}])
                }
            })
            t.rest?.delete?.forEach(def => {
                if (def.to) {
                    data.set(def.to, [{name: 'DELETE:' + (def.path || ''), fileName: t.fileName}])
                }
            })
            t.rest?.patch?.forEach(def => {
                if (def.to) {
                    data.set(def.to, [{name: 'PATCH:' + (def.path || ''), fileName: t.fileName}])
                }
            })
            t.rest?.head?.forEach(def => {
                if (def.to) {
                    data.set(def.to, [{name: 'HEAD:' + (def.path || ''), fileName: t.fileName}])
                }
            })
        });
        if (openApiJson) {
            const nodes = TopologyUtils.findTopologyOpenApiNodes(openApiJson);
            nodes.operations.filter(o => o.operationId?.length > 0)
                .forEach((operation) => {
                    const uri = 'direct:' + operation.operationId;
                    const newLink: IncomingLink = {name: `${operation.method} ${operation.path}`, fileName: nodes.fileName};
                    const currentLinks = data.get(uri);
                    if (currentLinks) {
                        data.set(uri, [...currentLinks, newLink]);
                    } else {
                        data.set(uri, [newLink]);
                    }
                })
        }
        return data;
    }


    static findStepChildren = (step: CamelElement): CamelElement[] => {
        const result: CamelElement[] = [];
        const anyStep = step as any;
        if (anyStep?.steps?.length > 0) {
            result.push(...anyStep.steps);
        }
        if (anyStep?.doCatch?.length > 0) {
            result.push(...anyStep.doCatch);
        }
        if (anyStep?.when?.length > 0) {
            result.push(...anyStep.when);
        }
        if (anyStep?.doFinally !== undefined) {
            result.push(anyStep.doFinally);
        }
        if (anyStep?.otherwise !== undefined) {
            result.push(anyStep.otherwise);
        }
        return result.map((c: any) => {
            c.parentId = (step as any).id;
            return c;
        });
    }
    static findStepsInStep = (step: CamelElement, result: CamelElement[]): CamelElement[] => {
        if (step !== undefined) {
            const el = (step as any);
            try {
                if (el?.id !== undefined) {
                    result.push(step);
                }
                const children = TopologyUtils.findStepChildren(step);
                TopologyUtils.findStepsInSteps(children, result);
            } catch (e) {
                console.error(e);
            }
        }
        return result;
    };

    static findStepsInSteps = (steps: CamelElement[], result: CamelElement[]): CamelElement[] => {
        if (steps !== undefined && steps.length > 0) {
            steps.forEach(step => TopologyUtils.findStepsInStep(step, result));
        }
        return result;
    };

    static findAllSteps = (integration: Integration): TopologyStep[] => {
        const result: TopologyStep[] = [];
        try {
            const routes = integration.spec.flows?.filter(flow => flow.dslName === 'RouteDefinition') || [];
            const routeFromTemplates = integration.spec.flows?.filter(flow => flow.dslName === 'RouteTemplateDefinition').map(rt => rt.route) || [];
            routes.concat(routeFromTemplates).forEach(route => {
                const from: FromDefinition = route.from;
                const steps = TopologyUtils.findStepsInStep(from, []);
                steps.forEach((step: any) => {
                    const id = step.id;
                    const title = CamelDisplayUtil.getStepDescription(step);
                    const hasSteps = (step as any).steps?.length > 0 || (step as any).when?.length > 0 || (step as any).otherwise;
                    const parentId = (step as any).parentId;
                    const routeId = (route as any).id;
                    result.push({id, title, hasSteps, parentId, step, routeId} as TopologyStep);
                });
            });
        } catch (e) {
            console.error(e);
        }
        return result;
    };

    static replacePlaceholders(template: string, data: Record<string, any>): string {
        // Regex: matches {{ followed by word characters/dots, then }}
        // The 'g' flag ensures all occurrences are replaced.
        const regex = /{{(.*?)}}/g;

        return template.replace(regex, (match, key) => {
            // Trim to handle potential whitespace like {{ user.name }}
            const cleanKey = key.trim();

            // Return the value if it exists, otherwise keep the original placeholder
            return data[cleanKey] !== undefined ? String(data[cleanKey]) : match;
        });
    }
}
