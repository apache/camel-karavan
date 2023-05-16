import React from 'react';
import { Modal, Button, ModalVariant, Wizard, WizardStep, WizardFooter, WizardContextConsumer, HelperText, HelperTextItem } from '@patternfly/react-core';
import TextEditor from './TextEditor';
import { ProjectFile } from './ProjectModels';
import { KaravanApi } from '../api/KaravanApi';

interface Props {
  fileDiffCodeMap: Map<string, string>;
  isConflictModalOpen: boolean;
  setIsConflictModalOpen: (isConflictModalOpen: boolean) => void;
  projectId: string;
  setIsConflictPresentMap: (name: string) => void;
}

interface State {
  editorContent: Map<string, string>,
  isConflicting: boolean,
  isSaveTries: boolean,
}

export class ResolveMergeConflictsModal extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      editorContent: this.createEditorContentFromMap(props.fileDiffCodeMap),
      isConflicting: false,
      isSaveTries: false,
    };
  }

  createEditorContentFromMap = (fileDiffCodeMap: Map<string, string>) => {
    const editorContent = new Map<string, string>();
    fileDiffCodeMap.forEach((value: string, key: string) => {
      editorContent.set(key, value);
    });
    return editorContent;
  };

  handleEditorChange = (content: string, name: string) => {
    this.setState((prevState) => ({
      editorContent: new Map(prevState.editorContent).set(name, this.convertInputToOutput(content)),
    }));
  };

   convertInputToOutput(input: string) {
    
    const lines = input.split('<p>');
    let output = '';
  
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].replace('</p>', '');
      let convertedLine = line.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      if (convertedLine.startsWith('<<<<<<<') || convertedLine.startsWith('=======') || convertedLine.startsWith('>>>>>>>')) {
        output += convertedLine + '\n';
      } else {
        output += convertedLine + '\n';
      }
    }
    return output.trim();
  }

  handleModalToggle = () => {
    this.props.setIsConflictModalOpen(!this.props.isConflictModalOpen);
  };

  containsGitMarkers(text:string) {
    const gitMarkers = ['<<<<<<< HEAD', '=======', '>>>>>>> intermediate-merging-branch'];
    for (const marker of gitMarkers) {
      if (text.match(marker)) {
        return true;
      }
    }
    return false;
  }

  post = (file: ProjectFile) => {
    console.log('post', file);
    KaravanApi.postProjectFile(file, res => {
        if (res.status === 200) {
            const newFile = res.data;
            console.log('newFile', newFile);
            // this.setState((state => {
            //     const index = state.files.findIndex(f => f.name === newFile.name);
            //     if (index !== -1) state.files.splice(index, 1, newFile)
            //     else state.files.push(newFile);
            //     return state
            // }))
        } else {
            // console.log(res) //TODO show notification
        }
    })
}

  handleSave = (name: string) => {
    // Handle save logic here
    this.setState({isSaveTries: true});
    const selectedFile  = this.state.editorContent.get(name) || "";
    console.log('\n\nSave clicked for step:', selectedFile);
    if(this.containsGitMarkers(selectedFile)){
      console.log('Save clicked for step:', "contains git markers");
        this.setState({isConflicting: true});
    }
    else{
        console.log('Save clicked for step:', "does not contain git markers");
        const updatedFile = new ProjectFile(name,selectedFile, this.props.projectId, Date.now())
        this.post(updatedFile);
        this.props.setIsConflictPresentMap(name);
        this.props.setIsConflictModalOpen(false);
        // make api request to save the file
    }
    // const output = this.convertInputToOutput(selectedFile);
    // console.log('\n\nSave clicked for step:', output);
    
    
  };

  handleReset = (name: string) => {
    this.state.editorContent.forEach((value: string, key: string) => {
        console.log("\nkey: \n" + key + "\n value: \n" + value);
      });
    this.setState((prevState) => ({
        editorContent: new Map(prevState.editorContent).set(name, this.props.fileDiffCodeMap.get(name)||""),
      }));
  };

  render() {
    const { isConflictModalOpen } = this.props;

    const steps: WizardStep[] = [];
    this.state.editorContent.forEach((value: string, key: string) => {
        console.log("\nname: \n" + key);
        console.log("\nvalue: \n" + value);
      steps.push({ name: key, component: <TextEditor name={key} value={value}  onChange={this.handleEditorChange} isConflicting = {this.state.isConflicting} isSaveTries = {this.state.isSaveTries} /> });
    });

    const CustomFooter = (
      <WizardFooter>
        <WizardContextConsumer>
          {({ activeStep, onClose }) => {
            const stepName :  React.ReactNode= activeStep?.name;
            let activeStepName:string = stepName?.toString() || "";
            return (
              <>
                <Button variant="primary" type="submit" onClick={() => this.handleSave(activeStepName)}>
                  Save
                </Button>
                <Button variant="secondary" onClick={() => this.handleReset(activeStepName)} className={activeStep?.name === 'Step 1' ? 'pf-m-disabled' : ''}>
                  Reset
                </Button>
                <Button variant="link" onClick={onClose}>
                  Cancel
                </Button>
              </>
            );
          }}
        </WizardContextConsumer>
      </WizardFooter>
    );

    return (
      <Modal
        isOpen={isConflictModalOpen}
        variant={ModalVariant.large}
        showClose={false}
        onClose={this.handleModalToggle}
        hasNoBodyWrapper
        aria-describedby="wiz-modal-example-description"
        aria-labelledby="wiz-modal-example-title"
      >
        <Wizard
          titleId="wiz-modal-example-title"
          descriptionId="wiz-modal-example-description"
          title="Karavan Merge Conflict Resolution"
          steps={steps}
          onClose={this.handleModalToggle}
          footer={CustomFooter}
          height={400}
        />
      </Modal>
    );
  }
}