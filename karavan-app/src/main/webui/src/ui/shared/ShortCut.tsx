import * as React from 'react';
import {ReactElement} from 'react';
import {Label, Tooltip} from "@patternfly/react-core";

export const ShortCutSymbols = {
    'shift': '⇧',
    'opt': '⌥',
    'cmd': '⌘',
    'enter': '↵',
    'ctrl': 'Ctrl', // Using text here is common for Windows, but you can swap to '^' if preferred
    'caps lock': '⇪',
    'tab': '↹',
    'win': '⊞',
    'backspace': '⌫'
};

const color = "var(--pf-t--global--background--color--primary--default)";

interface ShortCutProps {
    shortcuts: string[];
}

export function ShortCut({shortcuts} : ShortCutProps) {

    return (
        <div style={{display: 'flex', flexDirection: "row", alignItems: "center", gap: 8, color: color}}>
            {shortcuts.map((shortcut, index) => (
                <React.Fragment key={index}>
                    <Label variant="outline" key="modifier" data-test-id={"modifier-" + shortcut}>
                        <p style={{color: color}}>{shortcut}</p>
                    </Label>
                    {index+1 !== shortcuts.length && <p style={{color: color}}>+</p>}
                </React.Fragment>
            ))}
        </div>
    );
}

export function CommandShortCut() {
    const [isMac, setIsMac] = React.useState<boolean>(true);

    React.useEffect(() => {
        const isMacOs = window.navigator.userAgent.toLowerCase().includes('mac');
        setIsMac(isMacOs);
    }, []);

    return <ShortCut shortcuts={[isMac ? `${ShortCutSymbols.cmd} Cmd` : ShortCutSymbols.ctrl, "K"]}/>
}

interface CommandShortCutTooltipProps {
    component: ReactElement;
}

export const CommandShortCutTooltip = ({ component }: CommandShortCutTooltipProps): ReactElement => {
    return (
        <Tooltip content={<CommandShortCut/>} position={"left"}>
            {component}
        </Tooltip>
    );
};