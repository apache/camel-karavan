import {DashboardDevelopmentCard} from "@features/dashboard/development/DashboardDevelopmentCard";
import * as React from "react";
import {useState} from "react";
import {CamelIcon, OpenApiIcon} from "@features/project/designer/icons/KaravanIcons";
import {DashboardDevelopmentCardAction} from "@features/dashboard/development/DashboardDevelopmentCardAction";
import {useNavigate} from "react-router-dom";
import {useDashboardStore} from "@stores/DashboardStore";
import {UploadProjectModal} from "@features/projects/UploadProjectModal";
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";

export function DashboardDevelopmentCardStart() {
    const {setShowSideBar} = useDashboardStore();
    const [showUpload, setShowUpload] = useState<boolean>(false);
    const navigate = useNavigate();

    return (
        <DashboardDevelopmentCard body={
            <div className={"start-actions"}>
                <DashboardDevelopmentCardAction
                    title={"Create Integration"}
                    description={"Start a new Apache Camel project"}
                    icon={
                        <svg width="20" height="20">
                            <g transform={"scale(0.6, 0.6)"}>
                                <CamelIcon />
                            </g>
                        </svg>
                    }
                    action={() => {
                        setShowSideBar("integration", "Create Apache Camel integration project");
                    }}
                />
                <DashboardDevelopmentCardAction
                    title={"Design OpenAPI"}
                    description={"Start a new REST service project"}
                    icon={<OpenApiIcon width={20} height={20}/>}
                    action={() => {
                        setShowSideBar("openAPI", "Create Project with OpenAPI Service")
                    }}
                />
                <DashboardDevelopmentCardAction
                    title={"Import Project"}
                    description={"Import existing project from zip file"}
                    icon={<UploadIcon style={{width: "18px", height: "18px"}}/>}
                    action={() => setShowUpload(true)}
                />
                {showUpload && <UploadProjectModal open={showUpload} onClose={() => setShowUpload(false)}/>}
            </div>
        }/>
    )
}
