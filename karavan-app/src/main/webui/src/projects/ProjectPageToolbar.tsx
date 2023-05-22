import React from 'react';
import {
    Button,
    Toolbar,
    ToolbarContent,
    Flex,
    FlexItem,
    ToggleGroup,
    ToggleGroupItem,
    Checkbox, Tooltip, ToolbarItem, Modal, ModalVariant, Form, FormGroup, TextInput, FormHelperText, TextInputGroup, TextInputGroupMain, Switch
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {Project, ProjectFile} from "./ProjectModels";
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import DownloadImageIcon from "@patternfly/react-icons/dist/esm/icons/image-icon";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import PushIcon from "@patternfly/react-icons/dist/esm/icons/code-branch-icon";
import {KaravanApi} from "../api/KaravanApi";
import {ResolveMergeConflictsModal} from "./ResolveMergeConflictsModal";
import {StorageApi} from "../api/StorageApi";

interface Props {
    project: Project,
    needCommit: boolean,
    isTemplates: boolean,
    isKamelets: boolean,
    config: any,
    file?: ProjectFile,
    mode: "design" | "code",
    editAdvancedProperties: boolean,
    addProperty: () => void,
    download: () => void,
    downloadImage: () => void,
    setCreateModalOpen: () => void,
    setUploadModalOpen: () => void,
    onRefresh: () => void,
    setEditAdvancedProperties: (checked: boolean) => void,
    setMode: (mode: "design" | "code") => void,
    saveFile: (file: ProjectFile) => void,
}

interface State {
    isPushing: boolean,
    commitMessageIsOpen: boolean,
    pushCommitIsOpen: boolean,
    commitMessage: string,
    repoOwner: string,
    userName: string,
    userEmail: string,
    accessToken: string,
    repoUri: string,
    branch: string,
    saveUserDetails: boolean,
    isConflictModalOpen: boolean,
    fileDiffCodeMap : Map<string,string>,
    conflictResolvedForBranch: string,
    isPulling: boolean,
    gitOperation: string,
}

export class ProjectPageToolbar extends React.Component<Props> {

    componentDidMount() {
        const githubParams = StorageApi.getGithubParameters();
        if (githubParams) {
            this.setState({
                repoOwner: githubParams.repoOwner,
                userName: githubParams.userName,
                userEmail: githubParams.userEmail,
                accessToken: githubParams.accessToken,
                repoUri: githubParams.repoUri,
                branch: githubParams.branch,
            });
        }
    }

    public state: State = {
        isPushing: false,
        commitMessageIsOpen: false,
        pushCommitIsOpen: false,
        commitMessage: '',
        repoOwner: '',
        userName: '',
        userEmail: '',
        accessToken: '',
        repoUri: '',
        branch: '',
        saveUserDetails: false,
        isConflictModalOpen: false,
        fileDiffCodeMap : new Map(),
        conflictResolvedForBranch: '',
        isPulling: false,
        gitOperation: '',
    };

    setIsConflictModalOpen = (isOpen: boolean) => {
        this.setState({isConflictModalOpen: isOpen});
        // this.props.onRefresh.call(this);
    }

    setIsCommitMessageOpen = (isOpen: boolean) => {
        this.setState({commitMessageIsOpen: isOpen});
    }

    setIsConflictPresentMap = (name:string) =>{
        this.state.fileDiffCodeMap.delete(name);
    }

    isConflictResolved = (getOperation :string) =>{
        const commitMessage = this.state.commitMessage;
        this.setState({gitOperation: getOperation});
        if(this.state.fileDiffCodeMap.size>0){
            this.setState({isConflictModalOpen: true});
        }else{
            this.setState({
                commitMessageIsOpen: true,
                commitMessage : commitMessage === '' ? new Date().toLocaleString() : commitMessage
                })}
        }

    setConflictResolvedForBranch = () =>{
        this.setState({conflictResolvedForBranch: this.state.branch});
    }

    push = (after?: () => void) => {
        this.setState({isPushing: true, commitMessageIsOpen: false});
        const {commitMessage,userName,accessToken,repoUri,branch,saveUserDetails,conflictResolvedForBranch,repoOwner,userEmail} = this.state;

        const githubParams = {
            "commitMessage": commitMessage,
            "userName": userName,
            "repoOwner": repoOwner,
            "userEmail": userEmail,
            "accessToken":accessToken,
            "repoUri": repoUri,
            "branch": branch,
        };
        const fileParams = {
            "projectId": this.props.project.projectId,
            "file": this.props.file?.name || ".",
            "isConflictResolved" : conflictResolvedForBranch === this.state.branch
        };
        const params = {...githubParams, ...fileParams};
        
        if (saveUserDetails) {
            StorageApi.setGithubParameters({...githubParams,accessToken:""})
        }
        KaravanApi.push(params, res => {
            if (res.status === 200 || res.status === 201) {
                this.setState({isPushing: false});
                if(res.data && res.data.isConflictPresent){
                    const fileDiffCodeMap = new Map();
                    Object.keys(res.data).map(file =>{
                        fileDiffCodeMap.set(file,res.data[file]);
                    });
                    fileDiffCodeMap.delete("isConflictPresent");
                    this.setState({isConflictModalOpen: true,fileDiffCodeMap: fileDiffCodeMap});
                }
                else{
                    console.log("Pushed no conflicts present");
                    this.props.onRefresh.call(this);
                }
                after?.call(this);
            } else {
                // Todo notification
                //need to render to an error page
            }
        });
    }

    pull = (after?: () => void) => {
        this.setState({isPulling: true, commitMessageIsOpen: false});
        const {commitMessage,userName,accessToken,repoUri,branch,saveUserDetails,conflictResolvedForBranch,repoOwner,userEmail} = this.state;
        const githubParams = {
            "commitMessage": commitMessage,
            "userName": userName,
            "repoOwner": repoOwner,
            "userEmail": userEmail,
            "accessToken":accessToken,
            "repoUri": repoUri,
            "branch": branch,
        };
        const fileParams = {
            "projectId": this.props.project.projectId,
            "isConflictResolved" : conflictResolvedForBranch === this.state.branch
        };
        const params = {...githubParams, ...fileParams};
        
        if (saveUserDetails) {
            StorageApi.setGithubParameters({...githubParams,accessToken:""})
        }
        KaravanApi.pull(params, res => {
            if (res.status === 200 || res.status === 201) {
                this.setState({isPulling: false});
                if(res.data && res.data.isConflictPresent){
                    const fileDiffCodeMap = new Map();
                    Object.keys(res.data).map(file =>{
                        fileDiffCodeMap.set(file,res.data[file]);
                    });
                    fileDiffCodeMap.delete("isConflictPresent");
                    this.setState({isConflictModalOpen: true,fileDiffCodeMap: fileDiffCodeMap});
                }
                else{
                    this.props.onRefresh.call(this);
                }
                after?.call(this);
            } else {
                // Todo notification
                //need to render to an error page
            }
        });
    }

    getTemplatesToolbar() {
        const {file, editAdvancedProperties, needCommit} = this.props;
        const {isPushing} = this.state;
        const isProperties = file !== undefined && file.name.endsWith("properties");
        return <Toolbar id="toolbar-group-types">
            <ToolbarContent>
                <ToolbarItem>
                    <Flex justifyContent={{default: "justifyContentSpaceBetween"}} alignItems={{default: "alignItemsCenter"}}>
                        {isProperties && <FlexItem>
                            <Checkbox
                                id="advanced"
                                label="Edit advanced"
                                isChecked={editAdvancedProperties}
                                onChange={checked => this.props.setEditAdvancedProperties.call(this, checked)}
                            />
                        </FlexItem>}
                        <FlexItem>
                            <Tooltip content="Commit and push to git" position={"bottom"}>
                                <Button isLoading={isPushing ? true : undefined}
                                        isSmall
                                        variant={needCommit ? "primary" : "secondary"}
                                        className="project-button"
                                        icon={!isPushing ? <PushIcon/> : <div></div>}
                                        onClick={() => this.setState({commitMessageIsOpen: true})}>
                                    {isPushing ? "..." : "Commit"}
                                </Button>
                            </Tooltip>
                        </FlexItem>
                    </Flex>
                </ToolbarItem>
            </ToolbarContent>
        </Toolbar>
    }
    getProjectToolbar() {
        const {isPushing,isPulling} = this.state;
        const {file, needCommit, mode, editAdvancedProperties, addProperty, setEditAdvancedProperties, download, downloadImage, setCreateModalOpen, setUploadModalOpen} = this.props;
        const isFile = file !== undefined;
        const isYaml = file !== undefined && file.name.endsWith("yaml");
        const isIntegration = isYaml && file?.code && CamelDefinitionYaml.yamlIsIntegration(file.code);
        const isProperties = file !== undefined && file.name.endsWith("properties");
        return <Toolbar id="toolbar-group-types">
            { this.state.isConflictModalOpen && <ResolveMergeConflictsModal 
                fileDiffCodeMap={this.state.fileDiffCodeMap}
                isConflictModalOpen={this.state.isConflictModalOpen}
                setIsConflictModalOpen={this.setIsConflictModalOpen}
                projectId = {this.props.project.projectId}
                setIsConflictPresentMap = {this.setIsConflictPresentMap}
                setIsCommitMessageOpen = {this.setIsCommitMessageOpen}
                saveFile = {this.props.saveFile}
                setConflictResolvedForBranch = {this.setConflictResolvedForBranch}
                  /> }
            <ToolbarContent>
                <Flex className="toolbar" direction={{default: "row"}} alignItems={{default: "alignItemsCenter"}}>
                    {isYaml && <FlexItem>
                        <ToggleGroup>
                            <ToggleGroupItem text="Design" buttonId="design" isSelected={mode === "design"}
                                             onChange={s => this.props.setMode.call(this, "design")}/>
                            <ToggleGroupItem text="Code" buttonId="code" isSelected={mode === "code"}
                                             onChange={s => this.props.setMode.call(this, "code")}/>
                        </ToggleGroup>
                    </FlexItem>}

                    {isProperties && <FlexItem>
                        <Checkbox
                            id="advanced"
                            label="Edit advanced"
                            isChecked={editAdvancedProperties}
                            onChange={checked => setEditAdvancedProperties.call(this, checked)}
                        />
                    </FlexItem>}
                    {isProperties && <FlexItem>
                        <Button isSmall variant="primary" icon={<PlusIcon/>} onClick={e => addProperty.call(this)}>Add property</Button>
                    </FlexItem>}

                    {isFile && <FlexItem>
                        <Tooltip content="Download source" position={"bottom-end"}>
                            <Button isSmall variant="control" icon={<DownloadIcon/>} onClick={e => download.call(this)}/>
                        </Tooltip>
                    </FlexItem>}
                    {isIntegration && <FlexItem>
                        <Tooltip content="Download image" position={"bottom-end"}>
                            <Button isSmall variant="control" icon={<DownloadImageIcon/>} onClick={e => downloadImage.call(this)}/>
                        </Tooltip>
                    </FlexItem>}
                    {!isFile && <FlexItem>
                        <Button isSmall variant={"secondary"} icon={<PlusIcon/>}
                                onClick={e => setCreateModalOpen.call(this)}>Create</Button>
                    </FlexItem>}
                    {!isFile && <FlexItem>
                        <Button isSmall variant="secondary" icon={<UploadIcon/>}
                                onClick={e => setUploadModalOpen.call(this)}>Upload</Button>
                    </FlexItem>}
                    {!isFile && <FlexItem>
                        <Tooltip content="Pull from git" position={"bottom-end"}>
                                <Button isLoading={isPulling ? true : undefined}
                                        isSmall
                                        variant={needCommit ? "primary" : "secondary"}
                                        className="project-button"
                                        icon={!isPulling ? <PushIcon/> : <div></div>}
                                        onClick={() => this.isConflictResolved("Pull")}>
                                    {isPulling ? "..." : "Pull"}
                                </Button>
                            </Tooltip>
                    </FlexItem>}
                    <FlexItem>
                            <Tooltip content="Commit and push to git" position={"bottom-end"}>
                                <Button isLoading={isPushing ? true : undefined}
                                        isSmall
                                        variant={needCommit ? "primary" : "secondary"}
                                        className="project-button"
                                        icon={!isPushing ? <PushIcon/> : <div></div>}
                                        onClick={() => this.isConflictResolved("Push")}>
                                    {isPushing ? "..." : "Push"}
                                </Button>
                            </Tooltip>
                        </FlexItem>
                </Flex>
            </ToolbarContent>
        </Toolbar>
    }

    getCommitModalParameter(){
        const {commitMessage, commitMessageIsOpen,userName,accessToken,repoUri,branch,saveUserDetails,isPushing,repoOwner,userEmail,gitOperation,isPulling} = this.state;
        const pushEnabled = !isPushing && accessToken && userName && repoUri && commitMessage && branch;
        const pullEnabled = !isPushing && accessToken && userName && repoUri && branch;
        const isLoading = gitOperation === "Pull" ? isPulling : isPushing;
        const isDisabled = gitOperation === "Pull" ? !pullEnabled : !pushEnabled;
        const onClick = gitOperation === "Pull" ? () => this.pull() : () => this.push();
        return (
            <Modal
                title="Github Commit Parameters"
                className="github-modal"
                variant={ModalVariant.medium}
                isOpen={commitMessageIsOpen}
                onClose={() => this.setState({commitMessageIsOpen: false})}
                actions={[
                    <Button isLoading={isLoading} isDisabled={isDisabled} key="confirm" variant="primary" onClick={onClick}>{gitOperation}</Button>,
                    <Button key="cancel" variant="secondary" onClick={() => this.setState({commitMessageIsOpen: false})}>Cancel</Button>,
                    // <Button style={{marginLeft: "auto"}} key="login" variant="secondary" onClick={this.githubAuth} icon={<GithubImageIcon/>}>Login</Button>
                ]}
            >
                <Form autoComplete="off" isHorizontal className="create-file-form">
                    <FormGroup label="Repository" fieldId="repository" isRequired>
                        <Flex direction={{default: "row"}} justifyContent={{default: "justifyContentSpaceBetween"}} alignItems={{default: "alignItemsStretch"}}>
                            <FlexItem>
                                <TextInput id="owner" placeholder="Owner" value={repoOwner} onChange={value => this.setState({repoOwner: value})}/>
                            </FlexItem>
                            <FlexItem>
                                <TextInput id="repo" placeholder="Repo" value={repoUri} onChange={value => this.setState({repoUri: value})}/>
                            </FlexItem>
                            <FlexItem>
                                <TextInput id="branch" placeholder="branch" value={branch} onChange={value => this.setState({branch: value})}/>
                            </FlexItem>
                        </Flex>
                    </FormGroup>
                    {gitOperation==="Push" && <>
                        <FormGroup label="Commit user" fieldId="user" isRequired>
                        <Flex direction={{default: "row"}} justifyContent={{default: "justifyContentSpaceBetween"}} alignItems={{default: "alignItemsStretch"}}>
                            <FlexItem>
                                <TextInput id="userName" placeholder="userName" value={userName} onChange={value => this.setState({userName: value})}/>
                            </FlexItem>
                            <FlexItem flex={{default: "flex_3"}}>
                                <TextInput id="email" placeholder="Email" value={userEmail} onChange={value => this.setState({userEmail: value})}/>
                            </FlexItem>
                        </Flex>
                    </FormGroup>
                    <FormGroup label="Message" fieldId="commit message" isRequired>
                        <TextInput value={commitMessage} onChange={value => this.setState({commitMessage: value})}/>
                        <FormHelperText isHidden={false} component="div"/>
                    </FormGroup>
                    </>}
                    <FormGroup label="Access Token" fieldId="access-token" isRequired>
                        <TextInput value={accessToken} type="password" onChange={value => this.setState({accessToken: value})}/>
                    </FormGroup>
                    <FormGroup label="Save" fieldId="save" isRequired>
                        <TextInputGroup className="input-group">
                            <Switch label="Save parameters in browser (except token)" checked={saveUserDetails} onChange={checked => this.setState({saveUserDetails: checked})}/>
                        </TextInputGroup>
                    </FormGroup>
                </Form>
            </Modal>
        )
    }    

    render() {
        const {isTemplates} = this.props;
        return <div>
            {isTemplates && this.getTemplatesToolbar()}
            {!isTemplates && this.getProjectToolbar()}
            {/* {this.getCommitModal()} */}
            {(!this.state.isPulling ||this.state.isPushing) && this.getCommitModalParameter()}
        </div>
    }
}
