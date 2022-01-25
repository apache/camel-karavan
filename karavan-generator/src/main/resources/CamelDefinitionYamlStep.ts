    static read%1$s = (element: any): %1$s => {
        %2$s
        const def = element ? new %1$s({...element}) : new %1$s();
%3$s
        return def;
    }
