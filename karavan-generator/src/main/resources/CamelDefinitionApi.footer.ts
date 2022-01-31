
    static createSteps = (elements: any[] | undefined): CamelElement[] => {
        const result: CamelElement[] = []
        if (elements !== undefined){
            elements.forEach(e => {
                result.push(CamelDefinitionApi.createStep(e.dslName, e));
            })
        }
        return result
    }
