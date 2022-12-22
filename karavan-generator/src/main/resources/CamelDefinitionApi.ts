    static create%1$s = (element: any): %1$s => { %2$s
        const def = element ? new %1$s({...element}) : new %1$s();
        def.uuid = element?.uuid ? element.uuid : def.uuid; %3$s
        return def;
    }
