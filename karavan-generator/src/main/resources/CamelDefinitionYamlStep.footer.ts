
    static readSteps = (elements: any[] | undefined): CamelElement[] => {
        const result: CamelElement[] = []
        if (elements !== undefined){
            elements.forEach(e => {
                result.push(CamelDefinitionYamlStep.readStep(e));
            })
        }
        return result
    }
