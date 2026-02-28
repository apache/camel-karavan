import React from 'react';
import {Menu, MenuContent, MenuItem, MenuList} from '@patternfly/react-core';
import {DesignerViewSwitchOption, DesignerViewSwitchOptions, useDesignerStore, useIntegrationStore} from "@features/project/designer/DesignerStore";
import {shallow} from "zustand/shallow";
import {getDesignerIcon} from "@features/project/designer/icons/KaravanIcons";

export function KaravanDesignerViewSwitch() {

    const [setSelectedStep, setTab, tab] = useDesignerStore((s) => [s.setSelectedStep, s.setTab, s.tab], shallow)
    const [integration] = useIntegrationStore((s) => [s.integration], shallow)
    const isKamelet = integration.type === 'kamelet';

    const onSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, itemId: number | string | undefined) => {
        const item = itemId as string; // eslint-disable-next-line no-console
        if (DesignerViewSwitchOptions.includes(item as DesignerViewSwitchOption)) {
            setTab(item as DesignerViewSwitchOption);
        } else {
            setTab(undefined);
        }
        setSelectedStep(undefined);
    };

    function getMenuItem(name: string, title: string) {
        return (
            <MenuItem isSelected={tab === name} itemId={name} key={name} icon={getDesignerIcon(name)}>
                {title}
            </MenuItem>
        )
    }

    return (
        <div className="karavan-designer-view-switcher">
            <Menu onSelect={onSelect} activeItemId={tab}>
                <MenuContent>
                    <MenuList>
                        {isKamelet && getMenuItem("kamelet", "Kamelet Definitions")}
                        {getMenuItem("routes", "Routes")}
                        {!isKamelet && getMenuItem("rest", "REST")}
                        {getMenuItem("beans", "Beans")}
                    </MenuList>
                </MenuContent>
            </Menu>
        </div>
    )
}
