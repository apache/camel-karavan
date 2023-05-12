package org.apache.camel.karavan.model;

public class RunnerStatus {

    public enum NAME {
        context,
        inflight,
        memory,
        properties,
        route,
        trace,
        jvm
    }
}
