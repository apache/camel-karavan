import React from 'react';
import {
    Button,
    FormGroup,
    Checkbox, PopoverPosition, Popover, InputGroup
} from '@patternfly/react-core';
import '../designer/karavan.css';
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";

interface Props {
    files: string
    filesSelected: string
    onChange: (files: string) => void
}

interface State {
    selected: []
}

export class FileSelector extends React.Component<Props, State> {

    public state: State = {
        selected: []
    };

    isChecked(file: string){
        const s = this.props.filesSelected.split(",").map(value => value.trim());
        return s.includes(file);
    }

    onChange(file: string, checked: boolean){
        const s = this.props.filesSelected.split(",").map(f => f.trim()).filter(f => f.length > 0);
        const already = s.includes(file);
        if (checked && !already) {
            s.push(file);
            this.props.onChange?.call(this, s.join(","));
        } else if (!checked) {
            const result = s.filter(f => f !== file);
            this.props.onChange?.call(this, result.join(","));
        }
    }

    render() {
        const files = this.props.files ? this.props.files.split(",") : [];
        return (
            <FormGroup label="Add files" fieldId="files">
                <InputGroup>
                    <div style={{width:"100%"}}>
                        {files.map(file =>
                            <Checkbox key={file} label={file} isChecked={this.isChecked(file)} onChange={checked => this.onChange(file, checked)} id={file}  name={file}/>)}
                    </div>
                    <Popover aria-label="files" position={PopoverPosition.left}
                        bodyContent="Additional files to package">
                        <Button variant="plain" onClick={e => {}}>
                            <HelpIcon/>
                        </Button>
                    </Popover>
                </InputGroup>
            </FormGroup>
        )
    }
};