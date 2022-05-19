import React from 'react';
import {
    Button,
    Modal,
    TextInput,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {TableComposable, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {ProjectProperty} from "karavan-core/lib/model/ProjectModel";

interface Props {
    properties: Property[]
    onChange?: (properties: Property[]) => void
}

interface Property {
    id: string
    key: string
    value: any
}

interface State {
    properties: Property[]
    showDeleteConfirmation: boolean
    deleteId?: string
}

export class PropertiesTable extends React.Component<Props, State> {

    public state: State = {
        properties: this.props.properties,
        showDeleteConfirmation: false
    };

    sendUpdate = (props: Property[]) => {
        this.props.onChange?.call(this, props);
    }

    changeProperty(p: Property, field: "key" | "value", val?: string) {
        const key: string = field === 'key' && val !== undefined ? val : p.key;
        const value: any = field === 'value' ? val : p.value;
        const property: Property = {id: p.id, key: key, value: value};
        const props = this.state.properties.map(prop => prop.id === property.id ? property : prop);
        this.setState({properties: props});
        this.sendUpdate(props);
    }

    startDelete(id: string) {
        this.setState({showDeleteConfirmation: true, deleteId: id});
    }

    confirmDelete() {
        const props = this.state.properties.filter(p => p.id !== this.state.deleteId);
        this.setState({properties: props, showDeleteConfirmation: false, deleteId: undefined});
        this.sendUpdate(props);
    }

    addProperty() {
        const props = [...this.state.properties];
        props.push(ProjectProperty.createNew("",""))
        this.setState({properties: props, showDeleteConfirmation: false, deleteId: undefined});
        this.sendUpdate(props);
    }

    getDeleteConfirmation() {
        return (<Modal
            className="modal-delete"
            title="Confirmation"
            isOpen={this.state.showDeleteConfirmation}
            onClose={() => this.setState({showDeleteConfirmation: false})}
            actions={[
                <Button key="confirm" variant="primary" onClick={e => this.confirmDelete()}>Delete</Button>,
                <Button key="cancel" variant="link"
                        onClick={e => this.setState({showDeleteConfirmation: false})}>Cancel</Button>
            ]}
            onEscapePress={e => this.setState({showDeleteConfirmation: false})}>
            <div>Delete property?</div>
        </Modal>)
    }

    getTextInputField(property: Property, field: "key" | "value") {
        return (<TextInput isRequired={true} className="text-field" type={"text"} id={"key"} name={"key"}
                           value={field === "key" ? property.key : property.value}
                           onChange={val => this.changeProperty(property, field, val)}/>)
    }

    render() {
        const properties = this.state.properties;
        return (
            <>
                {properties.length > 0 &&
                    <TableComposable aria-label="Property table" variant='compact' borders={false} className="project-properties">
                        <Thead>
                            <Tr>
                                <Th key='name'>Name</Th>
                                <Th key='value'>Value</Th>
                                <Td></Td>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {properties.map((property, idx: number) => (
                                <Tr key={property.id}>
                                    <Td dataLabel="key">{this.getTextInputField(property, "key")}</Td>
                                    <Td dataLabel="value">{this.getTextInputField(property, "value")}</Td>
                                    <Td dataLabel="delete" modifier="fitContent">
                                        <Button variant={"plain"} icon={<DeleteIcon/>} className={"delete-button"} onClick={event => this.startDelete(property.id)}/>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                        {this.getDeleteConfirmation()}
                    </TableComposable>}
                <Button isInline variant={"link"} icon={<PlusIcon/>} className={"add-button"} onClick={event => this.addProperty()}>Add property</Button>
            </>
        )
    }
}