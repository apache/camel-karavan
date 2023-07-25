package org.apache.camel.karavan.shared;

public class EventType {

    //    Start Kubernetes or Docker event Listeners
    public static final String START_INFRASTRUCTURE_LISTENERS = "START_INFRASTRUCTURE_LISTENERS";

    //    Import projects from Git repository
    public static final String IMPORT_PROJECTS = "IMPORT_PROJECTS";

    public static final String INFINISPAN_STARTED = "INFINISPAN_STARTED";

    public static final String CONTAINER_STATUS = "CONTAINER_STATUS";
    public static final String DEVMODE_CONTAINER_READY = "DEVMODE_STATUS";

}
