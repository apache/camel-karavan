package org.apache.camel.karavan.model;

public class RunnerCommand {

    public enum NAME {
        run,
        delete,
        reload
    }

    public static final String CACHE = "runner_commands";

}
