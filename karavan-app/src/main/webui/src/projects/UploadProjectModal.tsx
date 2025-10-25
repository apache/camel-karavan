import React, {useState} from 'react';
import {Button, Content, FileUpload, Form, FormGroup, Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant,} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {Accept, DropEvent} from "react-dropzone";
import {EventBus} from "@/designer/utils/EventBus";
import {ProjectService} from "@/api/ProjectService";
import {ProjectZipApi} from "./ProjectZipApi";
import {ErrorEventBus} from "@/api/ErrorEventBus";

interface Props {
    open: boolean,
    onClose: () => void
}

export function UploadProjectModal(props: Props) {

    const [value, setValue] = React.useState<File>();
    const [filename, setFilename] = React.useState<string>();
    const [isLoading, setIsLoading] = useState(false);
    const [isRejected, setIsRejected] = useState(false);

    const handleFileInputChange = (_: any, file: File) => {
        setFilename(file.name);
    };

    const onReadFinished = (event: DropEvent, fileHandle: File): void => {
        setValue(fileHandle);
        setIsLoading(false)
    }

    const handleClear = (_event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        setFilename(undefined);
        setValue(undefined);
    };


    function onConfirm(){
        if (filename !== undefined && value !== undefined) {
            ProjectZipApi.uploadZip(value, res => {
                if (res.status === 200) {
                    EventBus.sendAlert( "Success", "Integration uploaded", "success");
                    ProjectService.refreshProjects();
                } else if (res.status === 304) {
                    EventBus.sendAlert( "Attention", "Integration already exists", "warning");
                } else {
                    ErrorEventBus.sendApiError(res);
                }
            })
            closeModal();
        }
    }

    function closeModal() {
        props.onClose?.()
    }

    const accept : Accept = {'application/x-zip': ['.zip']};
    return (
        <Modal
            title="Upload project"
            variant={ModalVariant.small}
            isOpen={props.open}
            onClose={closeModal}
        >
            <ModalHeader>
                <Content component='h2'>Import Integration</Content>
            </ModalHeader>
            <ModalBody>
                <Form>
                    <FormGroup fieldId="upload">
                        <FileUpload
                            id="file-upload"
                            value={value}
                            filename={filename}
                            type="dataURL"
                            hideDefaultPreview
                            browseButtonText="Upload"
                            isLoading={isLoading}
                            onFileInputChange={handleFileInputChange}
                            onReadStarted={(_event, fileHandle: File) => setIsLoading(true)}
                            onReadFinished={onReadFinished}
                            allowEditingUploadedText={false}
                            onClearClick={handleClear}
                            dropzoneProps={{accept: accept, onDropRejected: fileRejections => setIsRejected(true)}}
                        />
                    </FormGroup>
                </Form>
            </ModalBody>
            <ModalFooter>
                <Button key="confirm" variant="primary"
                        onClick={event => onConfirm()}
                        isDisabled={filename === undefined || value === undefined}
                >
                    Save
                </Button>
                <Button key="cancel" variant="secondary" onClick={closeModal}>Cancel</Button>
            </ModalFooter>
        </Modal>
    )
}