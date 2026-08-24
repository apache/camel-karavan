import React from 'react';
import {ToggleGroup, ToggleGroupItem} from '@patternfly/react-core';
import {DesignerViewSwitchOption, DesignerViewSwitchOptions, useDesignerStore, useIntegrationStore} from "./DesignerStore";
import {shallow} from "zustand/shallow";
import "./KaravanDesignerViewSwitch.css"
import {CamelUi} from "./utils/CamelUi";

export function KaravanDesignerViewSwitch() {

    const [setSelectedStep, setTab, tab] = useDesignerStore((s) => [s.setSelectedStep, s.setTab, s.tab], shallow)
    const [integration] = useIntegrationStore((s) => [s.integration], shallow)
    const isKamelet = integration.type === 'kamelet';
    const counts = CamelUi.getFlowCounts(integration);

    const onSelect = ( itemId: string) => {
        if (DesignerViewSwitchOptions.includes(itemId as DesignerViewSwitchOption)) {
            setTab(itemId as DesignerViewSwitchOption);
        } else {
            setTab(undefined);
        }
        setSelectedStep(undefined);
    };

    function getMenuItem(name: string, title: string) {
        const count = counts.get(name);
        const countText = count > 0 ? ` (${count})` : "";
        return (
            <ToggleGroupItem
                key={name}
                aria-label="designer"
                text={`${title}${countText}`}
                buttonId="toggle-group-icons-1"
                isSelected={tab === name}
                onChange={(_, __) => onSelect(name)}
            />
        )
    }

    return (
        <div className="karavan-designer-view-switcher">
            <ToggleGroup aria-label="DeveloperToggle" isCompact>
                {isKamelet && getMenuItem("kamelet", "Kamelet Definitions")}
                {getMenuItem("routes", "Routes")}
                {/*{getMenuItem("templatedRoutes", "Templated Routes")}*/}
                {!isKamelet && getMenuItem("rest", "REST")}
                {getMenuItem("beans", "Beans")}
            </ToggleGroup>
        </div>
    )
}
