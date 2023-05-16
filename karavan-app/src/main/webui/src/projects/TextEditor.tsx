import React, { useState } from "react";
import ReactQuill from "react-quill";
import QuillEditor from 'quill';
import "react-quill/dist/quill.snow.css";
import './style.css';
import { HelperText, HelperTextItem } from "@patternfly/react-core";


interface Props {
  value: string;
  onChange: (value: string,name: string) => void;
  name: string;
  isConflicting: boolean;
  isSaveTries: boolean;
}

const TextEditor: React.FC<Props> = ({name,value,onChange,isConflicting,isSaveTries}) => {
  
  const [editorValue, setEditorValue] = useState("");
  const [helperTextVariant, setHelperTextVariant] = useState<"success" | "error" | "default" | "indeterminate" | "warning" | undefined>("success");
  const [helperTextValue, setHelperTextValue] = useState("");
  React.useEffect(() => {
    setEditorValue(value);
  }, [value]);

  React.useEffect(() => {
    if(isConflicting && isSaveTries){
      setHelperTextVariant('error');
      setHelperTextValue("Resolve conflicts before saving");
    }else if(isSaveTries){
      setHelperTextVariant('success');
      setHelperTextValue("File saved successfully");
    }
  }, [isConflicting,isSaveTries]);

  React.useEffect(() => {
    // const timer = setTimeout(() => {
    //  onChange(editorValue,name); 
    // }, 2000);
    const diffContainer: HTMLElement = document.getElementById('diffContainer') || document.createElement('div');

    const diffParagraphs = diffContainer.getElementsByTagName('p');
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
    }
    // return () => clearTimeout(timer);
  },[editorValue]);


  const handleEditorChange = (content: string) => {
    setEditorValue(content);
  };
  const formats = ['grammar.disable-grammar-check'];
  const ref = React.useRef<ReactQuill & { editor: QuillEditor }>(null);

  React.useEffect(() => {
    ref.current?.editor?.root.setAttribute("spellcheck", "false");
  }, []);

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
        {isSaveTries && 
      <HelperText>
      <HelperTextItem variant={helperTextVariant}>{helperTextValue}</HelperTextItem>
    </HelperText> 
    }
    </div>
  );
};

export default TextEditor;