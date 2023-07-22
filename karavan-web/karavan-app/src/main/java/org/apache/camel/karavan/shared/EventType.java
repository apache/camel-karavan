package org.apache.camel.karavan.shared;

public class EventType {

    public static final String START_KARAVAN = "START_KARAVAN";

    //    Start Kubernetes or Docker event Listeners
    public static final String START_INFRASTRUCTURE_LISTENERS = "START_INFRASTRUCTURE_LISTENERS";
    public static final String STOP_INFRASTRUCTURE_LISTENERS = "STOP_INFRASTRUCTURE_LISTENERS";

    //    Import projects from Git repository
    public static final String IMPORT_PROJECTS = "IMPORT_PROJECTS";

    public static final String INFINISPAN_STARTED = "INFINISPAN_STARTED";

    public static final String CONTAINER_STATISTICS = "CONTAINER_STATISTICS";
    public static final String DEVMODE_STATUS = "DEVMODE_STATUS";

}
