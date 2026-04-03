import React from 'react';
import {Tab, Tabs, TabTitleText,} from '@patternfly/react-core';
import '@features/project/designer/property/DslProperties.css';
import {ErrorBoundaryWrapper} from "@features/project/designer/ErrorBoundaryWrapper";
import {DslProperties} from "@features/project/designer/property/DslProperties";
import {ExpressionEditor} from "@features/project/expression/ExpressionEditor";

export function MainPropertiesPanel() {

    const [activeTabKey, setActiveTabKey] = React.useState<string | number>("properties");
    const handleTabClick = (event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent, tabIndex: string | number) => {
        setActiveTabKey(tabIndex);
    };

    function getTab(title: string, icon: string, error: boolean = false) {
        const color = error ? "red" : "initial";
        return (
            <div className="top-menu-item" style={{color: color}}>
                <TabTitleText>{title}</TabTitleText>
            </div>
        )
    }

    function getPropertiesPanelTabs() {
        return (
            <div>
                <Tabs activeKey={activeTabKey}
                      onSelect={handleTabClick}
                      isFilled
                      aria-label="PropertyTypes"
                      role="proeprty-type"
                >
                    <Tab eventKey={'properties'} title={getTab('Properties', 'properties')} aria-label="Properties"/>
                </Tabs>
            </div>
        )
    }


    return (
        <div className='main-properties'>
            {getPropertiesPanelTabs()}
            <ErrorBoundaryWrapper onError={error => console.error(error)}>
                {activeTabKey === 'properties' && <DslProperties expressionEditor={ExpressionEditor}/> }
            </ErrorBoundaryWrapper>
        </div>
    )

}
