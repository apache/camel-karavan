import React from 'react';
import {
    PageSection,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {ProjectFile} from "./ProjectModels";
import {PropertiesTable} from "./PropertiesTable";
import {ProjectModel} from "karavan-core/lib/model/ProjectModel";
import {ProjectModelApi} from "karavan-core/lib/api/ProjectModelApi";

interface Props {
    file: ProjectFile,
    editAdvanced: boolean,
    onSave?: (filename: string, code: string) => void
}

interface State {
    project: ProjectModel,
    file: ProjectFile,
}

export class PropertiesEditor extends React.Component<Props, State> {

    public state: State = {
        project: this.props.file ? ProjectModelApi.propertiesToProject(this.props.file?.code) : ProjectModel.createNew(),
        file: this.props.file,
    }

    render() {
        const file = this.state.file;
        const project = file ? ProjectModelApi.propertiesToProject(file?.code) : ProjectModel.createNew();
        return (
            <PageSection isFilled className="kamelets-page" padding={{default: file !== undefined ? 'noPadding' : 'padding'}}>
                <PropertiesTable
                    editAdvanced={this.props.editAdvanced}
                    properties={project.properties}
                    onChange={properties => this.props.onSave?.call(this, file.name, ProjectModelApi.propertiesToString(properties))}
                />
            </PageSection>
        )
    }
}
