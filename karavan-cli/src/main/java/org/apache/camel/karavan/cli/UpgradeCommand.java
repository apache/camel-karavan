package org.apache.camel.karavan.cli;

import picocli.CommandLine;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.concurrent.Callable;

@CommandLine.Command(name = "upgrade",
        mixinStandardHelpOptions = true,
        description = "Upgrade Karavan")
public class UpgradeCommand implements Callable<Integer> {

    @Override
    public Integer call() throws Exception {
        System.out.println("Not implemented yet");
        return 0;
    }
}
