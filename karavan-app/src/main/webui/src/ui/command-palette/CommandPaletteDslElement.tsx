import React from 'react';
import {Badge, capitalize, Card, CardBody, CardHeader, HelperText, HelperTextItem, Tooltip} from '@patternfly/react-core';
import './CommandPalettePanel.css';
import '@designer/property/property/ComponentPropertyField.css';
import {CamelUi} from "@designer/utils/CamelUi";
import {DslMetaModel} from "@designer/utils/DslMetaModel";
import {useCommandHook} from "./useCommandHook";
import {useCommandPaletteStore} from "./useCommandPaletteStore";
import {highlightText} from "./CommandPaletteUtils";

interface Props {
    dsl: DslMetaModel;
    index: number;
}

export function CommandPaletteDslElement(props: Props) {
    const {dsl, index} = props;
    const {dslCardClick} = useCommandHook();
    const filter = useCommandPaletteStore((s) => s.filter);
    const navigation = dsl.navigation === 'eip' ? 'Processor' : capitalize(dsl.navigation);
    const classNameBadge = "navigation-label label-" + dsl.navigation + ((dsl.navigation === 'eip' || dsl?.supportLevel.toLowerCase() === 'stable') ? '' : '-preview');

    // Add a keyboard handler for Enter and Space keys
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault(); // Prevent page scrolling if Space is pressed
            dslCardClick(event, dsl);
        }
    };

    return (
        <Card
            key={dsl.dsl + index}
            isCompact
            className="dsl-card"
            style={{width: '100%'}}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onClick={e => dslCardClick(e, dsl)}>
            <CardHeader>
                <Tooltip content={navigation} position="right">
                    <Badge className={classNameBadge}>{navigation?.substring(0, 1)}</Badge>
                </Tooltip>
                <div className="dsl-element">
                    <div className={"header"}>
                        <div className={"icon-wrapper"}>
                            {CamelUi.getIconForDsl(dsl)}
                        </div>
                        <p className='dsl-element-title'>
                            {highlightText(dsl.title, filter)}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardBody onClick={e => dslCardClick(e, dsl)}>
                <div className="dsl-element-body-description">
                    <Tooltip content={dsl.description}>
                        <HelperText>
                            <HelperTextItem className={"dsl-element-text-helper"}>{highlightText(dsl.description, filter)}</HelperTextItem>
                        </HelperText>
                    </Tooltip>
                </div>
            </CardBody>
        </Card>
    );
}