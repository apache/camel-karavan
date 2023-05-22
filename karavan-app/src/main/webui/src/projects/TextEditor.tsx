import React, { useImperativeHandle, useState } from "react";
import ReactQuill from "react-quill";
import QuillEditor from 'quill';
import "react-quill/dist/quill.snow.css";
import '../designer/karavan.css';
import { HelperText, HelperTextItem } from "@patternfly/react-core";


interface Props {
  value: string;
  onSave: (name: string,) => void;
  name: string;
  isConflictResolved: boolean | undefined;
  childRef: React.RefObject<TextEditorChildRef>;
}
interface TextEditorChildRef {
  getFileContent: () => string;
  getFileName: () => string;
  updateEditorValue: (value: string) => void;
}

const TextEditor: React.FC<Props> = ({name,value,onSave,isConflictResolved,childRef}) => {
  
  const [editorValue, setEditorValue] = useState("");
  const [helperTextVariant, setHelperTextVariant] = useState<"success" | "error" | "default" | "indeterminate" | "warning" | undefined>("success");
  const [helperTextValue, setHelperTextValue] = useState("");
  const ref = React.useRef<ReactQuill & { editor: QuillEditor }>(null);
  const [isEditorReady, setIsEditorReady] = React.useState(false);

  React.useEffect(() => {
    setIsEditorReady(true);
    // console.log('value',value);
    setEditorValue(value);
  }, [value]);

  useImperativeHandle(childRef, () => ({
     getFileContent() {
      return editorValue;
    },
    getFileName() {
      return name;
    },
    updateEditorValue(value: string) {
      setIsEditorReady(true);
      setEditorValue(value);
    }
  }));

  React.useEffect(() => {
      const quillInstance = document.querySelector(".my-editor")||document.createElement('div');
      // Access quillInstance and execute code after ReactQuill is rendered
      if (quillInstance && isEditorReady) {
    const diffContainer: HTMLElement = document.getElementById('diffContainer') || document.createElement('div');
    // onSave(editorValue);
    const diffParagraphs = diffContainer.getElementsByTagName('p');
    console.log(diffParagraphs);
    let flag = '';
    for (let i = 0; i < diffParagraphs.length; i++) {
      const paragraph = diffParagraphs[i];
      const text = paragraph.textContent || '';

      if (text.startsWith('<<<<<<<')) {
        paragraph.classList.add('conflict-start-marker');
        flag = 'conflict-from-current';
      } else if (text.startsWith('=======')) {
        flag = 'conflict-from-incoming';
      } 
      else if(text.startsWith('>>>>>>>')){
        paragraph.classList.add('conflict-end-marker');
        flag = '';
      }else {
        if (flag === 'conflict-from-current') {
          paragraph.classList.add('current-changes');
        } else if (flag === 'conflict-from-incoming') {
          paragraph.classList.add('incoming-changes');
        }
      }
      
  };
  setIsEditorReady(false);
  }
  });

  React.useEffect(() => {
    if(isConflictResolved!==undefined && !isConflictResolved){
      setHelperTextVariant('error');
      setHelperTextValue("Resolve conflicts before saving");
    }else if(isConflictResolved){
      setHelperTextVariant('success');
      setHelperTextValue("File saved successfully");
    }
  }, [isConflictResolved]);



  const handleEditorChange = (content: string) => {
    setEditorValue(content);
  };
  const formats = ['grammar.disable-grammar-check'];

  React.useEffect(() => {
    ref.current?.editor?.root.setAttribute("spellcheck", "false");
  }, []);
  console.log(helperTextVariant,helperTextValue);
  
  return (
    <div>
      <div id="diffContainer">
      <ReactQuill
        ref={ref}
        formats={formats}
        theme="snow"
        value={editorValue}
        onChange={handleEditorChange}
        className="my-editor"
        />
        </div>
        {isConflictResolved !==undefined && 
      <HelperText>
      <HelperTextItem variant={helperTextVariant}>{helperTextValue}</HelperTextItem>
    </HelperText> 
    }
    </div>
  );
};

export default TextEditor;