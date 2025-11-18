import React from 'react';
import {Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement} from '@patternfly/react-core';
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import {useDesignerStore, useIntegrationStore} from "@/integration-designer/DesignerStore";
import {shallow} from "zustand/shallow";
import {getDesignerIcon} from "@/integration-designer/icons/KaravanIcons";

export function KaravanDesignerViewSwitch() {

    const [setSelectedStep, setTab] = useDesignerStore((s) => [s.setSelectedStep, s.setTab], shallow)
    const [integration] = useIntegrationStore((s) => [s.integration], shallow)
    const isKamelet = integration.type === 'kamelet';

    const [isToggleOpen, setIsToggleOpen] = React.useState(false);

    const onToggleClick = () => {
        setIsToggleOpen(!isToggleOpen);
    };

    const onSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
        // eslint-disable-next-line no-console
        setIsToggleOpen(false);
    };

    function selectTab(tab: "routes" | "rest" | "beans" | "kamelet") {
        if (["routes", "rest", "beans", "kamelet"].includes(tab)) {
            setTab(tab);
        } else {
            setTab(undefined); // Handle unexpected values
        }
        setSelectedStep(undefined);
    }

    return (
        <div className="karavan-designer-view-switcher">
            <Dropdown
                onSelect={onSelect}
                popperProps={{position: 'right'}}
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                        ref={toggleRef}
                        onClick={onToggleClick}
                        variant="plain"
                        isExpanded={isToggleOpen}
                        aria-label="Action list single group kebab"
                        icon={<EllipsisVIcon/>}
                    />
                )}
                isOpen={isToggleOpen}
                onOpenChange={(isOpen: boolean) => setIsToggleOpen(isOpen)}
            >
                <DropdownList className="karavan-designer-view-switcher-dropdown">
                    {isKamelet &&
                        <DropdownItem value={0} key="kamelet" icon={getDesignerIcon('kamelet')} onClick={(ev) => selectTab('kamelet')}>
                            Kamelet Definitions
                        </DropdownItem>
                    }
                    <DropdownItem value={1} key="routes" icon={getDesignerIcon('routes')} onClick={(ev) => selectTab('routes')}>
                        Routes
                    </DropdownItem>
                    {!isKamelet &&
                        <DropdownItem value={2} key="rest" icon={getDesignerIcon('rest')} onClick={(ev) => selectTab('rest')}>
                            REST
                        </DropdownItem>
                    }
                    <DropdownItem value={3} key="beans" icon={getDesignerIcon('beans')} onClick={(ev) => selectTab('beans')}>
                        Beans
                    </DropdownItem>
                </DropdownList>
            </Dropdown>
        </div>
    )
}
