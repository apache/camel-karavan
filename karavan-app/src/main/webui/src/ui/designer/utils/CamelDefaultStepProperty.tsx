class DefaultStepProperty {
    type: 'component' | 'dsl' = 'dsl'
    dslName: string = 'ToDefinition'
    componentName: string | undefined
    propertyName: string = ''
    tab: 'editor' | 'properties' = 'editor'
    isExpression: boolean = true


    constructor(type: "component" | "dsl", dslName: string, componentName: string | undefined, propertyName: string, tab: 'editor' | 'properties', isExpression: boolean) {
        this.type = type;
        this.dslName = dslName;
        this.componentName = componentName;
        this.propertyName = propertyName;
        this.isExpression = isExpression;
        this.tab = tab;
    }
}

const DefaultStepProperties: DefaultStepProperty[] = [
    new DefaultStepProperty('dsl', 'SetVariableDefinition', undefined, 'expression', 'editor',true),
    new DefaultStepProperty('dsl', 'SetHeaderDefinition', undefined, 'expression', 'editor',true),
    new DefaultStepProperty('dsl', 'SetPropertyDefinition', undefined, 'expression', 'editor',true),
    new DefaultStepProperty('dsl', 'ScriptDefinition', undefined, 'expression', 'editor',true),
    new DefaultStepProperty('dsl', 'FilterDefinition', undefined, 'expression', 'editor',true),
    new DefaultStepProperty('dsl', 'WhenDefinition', undefined, 'expression', 'editor',true),
    new DefaultStepProperty('dsl', 'LoopDefinition', undefined, 'expression', 'editor',true),
    new DefaultStepProperty('dsl', 'SplitDefinition', undefined, 'expression', 'editor',true),
    new DefaultStepProperty('dsl', 'SetBodyDefinition', undefined, 'expression', 'editor',true),
    new DefaultStepProperty('dsl', 'ToDefinition', 'sql', 'query', 'editor', false),
]

export class CamelDefaultStepProperty {

    static findDslDefaultProperty = (dslName: string): DefaultStepProperty | undefined => {
        return DefaultStepProperties.find(dsp => dsp.dslName === dslName);
    }
}