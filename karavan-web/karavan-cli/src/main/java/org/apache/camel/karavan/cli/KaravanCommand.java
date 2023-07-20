package org.apache.camel.karavan.cli;

import picocli.CommandLine;

@CommandLine.Command(mixinStandardHelpOptions = true, subcommands = {InstallCommand.class, UpgradeCommand.class})
public class KaravanCommand {


    public static void main(String... args) {
        CommandLine commandLine = new CommandLine(new KaravanCommand());
        commandLine.parseArgs(args);
        if (commandLine.isUsageHelpRequested()) {
            commandLine.usage(System.out);
            System.exit(0);
        }
        int exitCode = commandLine.execute(args);
        System.exit(exitCode);
    }
}
