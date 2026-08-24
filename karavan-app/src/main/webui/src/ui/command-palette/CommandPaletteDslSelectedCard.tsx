import React from 'react';
import {Card, CardBody, CardHeader, Form,} from '@patternfly/react-core';
import './CommandPalettePanel.css';
import '@designer/property/property/ComponentPropertyField.css';
import {CamelUi} from "@designer/utils/CamelUi";
import {DslMetaModel} from "@designer/utils/DslMetaModel";
import {ComponentApi} from "@core/api/ComponentApi";
import {useCommandPaletteStore} from "./useCommandPaletteStore";
import {ComponentPropertyField} from "@designer/property/property/ComponentPropertyField";
import {ExpressionEditor} from "@designer/property/expression/ExpressionEditor";
import {ComponentProperty} from "@core/model/ComponentModels";
import {highlightText} from "./CommandPaletteUtils";

interface Props {
    dsl: DslMetaModel,
    index: number
}

export function CommandPaletteDslSelectedCard(props: Props) {

    const {dsl, index} = props;
    const filter = useCommandPaletteStore((s) => s.filter);
    const showProperties = useCommandPaletteStore((s) => s.showProperties);
    const selectedDsl = useCommandPaletteStore((s) => s.selectedDsl);
    const setSelectedDsl = useCommandPaletteStore((s) => s.setSelectedDsl);

    const componentProperties = showProperties && dsl?.uri
        ? ComponentApi.getComponentProperties(dsl.uri, 'consumer').filter(p => p.kind === 'path')
        : [];

    function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
        if (event.key === 'Escape') {
            close();
        }
    }

    return (
        <Card key={dsl.dsl + index} className="dsl-card" style={{width: '100%'}} tabIndex={0} onKeyDown={onKeyDown}>
            <CardHeader className="header-labels">
                <div className="dsl-element">
                    <div className={"header"}>
                        {CamelUi.getIconForDsl(dsl)}
                        <p className='dsl-element-title'>
                            {highlightText(dsl.title, filter)}
                        </p>
                    </div>
                </div>
            </CardHeader>
            {showProperties && selectedDsl &&
                <CardBody className="dsl-card-body-properties">
                    <Form autoComplete="off" className='properties'>
                        {componentProperties.map((kp: ComponentProperty) =>
                            <ComponentPropertyField
                                hideConfigSelector={true}
                                key={kp.name}
                                property={kp}
                                value={selectedDsl.properties?.[kp.name]}
                                expressionEditor={ExpressionEditor}
                                onParameterChange={(parameter, value, pathParameter, newRoute) => {
                                    setSelectedDsl({
                                        ...selectedDsl,
                                        properties: {
                                            ...(selectedDsl.properties ?? {}),
                                            [parameter]: value
                                        }
                                    });
                                }}
                            />
                        )}
                    </Form>
                </CardBody>
            }
        </Card>
    )
}