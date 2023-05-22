import React from 'react';
import { Modal, Button, ModalVariant, Wizard, WizardStep, WizardFooter, WizardContextConsumer } from '@patternfly/react-core';
import TextEditor from './TextEditor';
import { ProjectFile } from './ProjectModels';

interface Props {
  fileDiffCodeMap: Map<string, string>;
  // fileDiffCodeUpdate: Map<string, string>;
  isConflictModalOpen: boolean;
  setIsConflictModalOpen: (isConflictModalOpen: boolean) => void;
  projectId: string;
  setIsConflictPresentMap: (name: string) => void;
  setIsCommitMessageOpen: (name: boolean) => void;
  saveFile: (file: ProjectFile) => void;
  setConflictResolvedForBranch : () => void;
}

interface State {
  editorContent: Map<string, string>,
  isConflictResolved: Map<string, boolean>,
  childRef: React.RefObject<TextEditorChildRef>;
  currentStep : string;
  enablePushOperation: boolean;
}
interface TextEditorChildRef {
  getFileContent: () => string;
  getFileName: () => string;
  updateEditorValue: (value: string) => void;
}


export class ResolveMergeConflictsModal extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      editorContent: this.createEditorContentFromMap(props.fileDiffCodeMap),
      isConflictResolved: new Map<string, boolean>(),
      childRef: React.createRef(),
      currentStep: '',
      enablePushOperation: false,
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
      editorContent: prevState.editorContent.set(name, this.convertHtmlToString(content)),
    }));
  };

   convertHtmlToString(htmlFormat: string) {
    const regex = /<p[^>]*>(.*?)<\/p>/g;
    const matches = htmlFormat.match(regex);
    
    if (matches) {
      const stringFormat = matches.map(match => {
        const line = match.replace(/<\/?p[^>]*>/g, '');
        const convertedLine = line.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        return convertedLine;
      }).join('\n');
      
      return stringFormat.trim();
    }
    
    return htmlFormat;
  }

  handleModalToggle = () => {
    this.props.setIsConflictModalOpen(!this.props.isConflictModalOpen);
  };

  containsGitMarkers(text:string) {
    const gitMarkers = [
      /^>{4,7}/,
      /^<{4,7}/,
      /^={4,7}/,
      /<<<<<<< HEAD/,
      />>>>>>> intermediate-merging-branch/
    ];
    for (const marker of gitMarkers) {
      if (text.match(marker)) {
        return true;
      }
    }
    return false;
  }

 handleClick = () => {
  if (this.state.childRef.current) {
    const editorValue : string= this.state.childRef.current.getFileContent();
    const transformedValue :string= this.convertHtmlToString(editorValue);
    const fileName : string= this.state.childRef.current.getFileName();
    const file = {
      fileName : fileName,
      fileContent : transformedValue,
    }
    return file;
  }
};

  handleSave = () => {
    const file = this.handleClick();
    console.log('file', file);
    if(file && this.containsGitMarkers(file.fileContent)){
      this.setState((prevState) => ({
        isConflictResolved: prevState.isConflictResolved.set(file.fileName, false),
      }));
      // this.props.setIsConflictModalOpen(true);
    }
    else if(file){
        const updatedFile = new ProjectFile(file.fileName,this.props.projectId,file.fileContent, Date.now())
        this.setState((prevState) => ({
          isConflictResolved: prevState.isConflictResolved.set(file.fileName, true),
        }));
        this.props.setIsConflictPresentMap(file.fileName);
        //iterate isConflictResolved map and check if all values are true
        let isAllMergeConflictResolved = false ;
        this.state.isConflictResolved.forEach((value: boolean, key: string) => {
          if(value === false){
            isAllMergeConflictResolved= false;
            return
          }
          else{
            isAllMergeConflictResolved= true;
          }
        });
        this.props.setIsCommitMessageOpen(isAllMergeConflictResolved);
        this.props.setIsConflictModalOpen(!isAllMergeConflictResolved);
        if(isAllMergeConflictResolved){
          this.props.setConflictResolvedForBranch();
        }
        this.props.saveFile(updatedFile);
        // this.setState({enablePushOperation: isAllMergeConflictResolved});
        // this.props.setIsConflictModalOpen(false);
        // make api request to save the file
    }    
  };

  handleReset = (name: string) => {
    if(this.state.childRef.current){
      this.state.childRef.current.updateEditorValue(this.props.fileDiffCodeMap.get(name)||"");
    }
  };

  render() {
    const { isConflictModalOpen } = this.props;
    // console.log("\n\n\n",this.state.editorContent);
    const steps: WizardStep[] = [];
    this.state.editorContent.forEach((value: string, key: string) => {
      steps.push({ name: key, component: <TextEditor name = {key} value={value}  onSave={this.handleSave} isConflictResolved = {this.state.isConflictResolved.get(key)} childRef={this.state.childRef}/> });
    });

    const CustomFooter = (
      <WizardFooter>
        <WizardContextConsumer>
          {({ activeStep, onClose }) => {
            const stepName :  React.ReactNode= activeStep?.name;
            let activeStepName:string = stepName?.toString() || "";
            if(activeStepName!==this.state.currentStep){
              const file = this.handleClick(); 
              if(file){
                this.setState((prevState) => ({
                  editorContent: prevState.editorContent.set(file.fileName, file.fileContent),
                }));
              }
              this.setState({currentStep:activeStepName});
              }
            return (
              <>
                <Button variant="primary" type="submit" onClick={() => this.handleSave()}>
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