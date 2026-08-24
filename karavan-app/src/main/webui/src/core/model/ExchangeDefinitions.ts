export const ProcessorNames = {
    Script: 'Script',
    SetBody: 'SetBody',
    SetHeader: 'SetHeader',
    SetVariable: 'SetVariable',
    SetProperty: 'SetProperty',
    To: 'To',
} as const;

export type ProcessorName = typeof ProcessorNames[keyof typeof ProcessorNames];
export const NON_NAMES_TYPES: ProcessorName[] = [ProcessorNames.Script, ProcessorNames.SetBody];

export const MarshalTypes = {
    Json: 'json',
    Xml: 'xml',
    Csv: 'csv',
    Yaml: 'yaml',
    String: 'string',
    Groovy: 'groovy'
} as const;

export type MarshalType = typeof MarshalTypes[keyof typeof MarshalTypes];
export const NON_MARSHALED_TYPES: MarshalType[] = [MarshalTypes.Groovy, MarshalTypes.String];

export const ExchangeParts = {
    Body: 'body',
    Header: 'header',
    ExchangeProperty: 'exchangeProperty',
    Variable: 'variable'
} as const;

export type ExchangePart = typeof ExchangeParts[keyof typeof ExchangeParts];
export const NON_MARSHALED_PARTS: ExchangePart[] = [ExchangeParts.Header, ExchangeParts.ExchangeProperty];

export interface ExchangeDataUsage {
    stepId: string;
    routeId: string;
    stepName: string;
    stepDescription: string;
    stepComponent?: string;
    fileName?: string;
    level: number;
}

export interface Body {
    type: string;
    value?: string;
    usages: ExchangeDataUsage[];
    marshalType: MarshalType;
    unmarshalType: MarshalType;
}

export interface ExchangeData {
    key: string;
    type: string;
    value?: string;
    usages: ExchangeDataUsage[];
    marshalType: MarshalType;
    unmarshalType: MarshalType;
}

export interface ExchangeMessage {
    body?: Body;
    exchangeId: string;
    exchangePattern: string;
    exchangeType: string;
    messageType: string;
    variables: ExchangeData[];
    exchangeProperties: ExchangeData[];
    headers: ExchangeData[];
}

export interface BeanUsageData {
    name: string;
    usages: ExchangeDataUsage[];
}
