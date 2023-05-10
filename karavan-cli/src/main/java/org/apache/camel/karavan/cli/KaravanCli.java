package org.apache.camel.karavan.cli;

import picocli.CommandLine;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Callable;

@CommandLine.Command(name = "karavan",
        mixinStandardHelpOptions = true,
        version = "Karavan 3.20.2-SNAPSHOT",
        description = "Apache Camel Karavan CLI")
public class KaravanCli implements Callable<Integer> {

    @CommandLine.Option(names = {"-v", "--version"}, required = true, description = "Karavan version", defaultValue = "3.20.2-SNAPSHOT")
    private String version;
    @CommandLine.Option(names = {"-n", "--namespace"}, description = "Namespace", defaultValue = Constants.DEFAULT_NAMESPACE)
    private String namespace;
    @CommandLine.Option(names = {"-e", "--environment"}, description = "Environment", defaultValue = Constants.DEFAULT_ENVIRONMENT)
    private String environment;
    @CommandLine.Option(names = {"-r", "--runtimes"}, description = "Runtimes: quarkus, spring-boot", defaultValue = Constants.DEFAULT_RUNTIMES)
    private String runtimes;
    @CommandLine.Option(names = {"-a", "--authentication", "--auth"}, description = "Authentication: public, basic, oidc", defaultValue = Constants.DEFAULT_AUTH)
    private String auth;
    @CommandLine.Option(names = {"-np", "--node-port"}, description = "Node port", defaultValue = "0")
    private int nodePort;
    @CommandLine.Option(names = {"-g", "--git-pull"}, description = "Git pull interval. Default: off", defaultValue = "off")
    private String gitPullInterval;
    @CommandLine.Option(names = {"-i", "--instances"}, description = "Instances. Default: 1", defaultValue = "1")
    private int instances;
    @CommandLine.Option(names = {"-ir", "--registry"}, description = "Image registry", defaultValue = Constants.DEFAULT_IMAGE_REGISTRY)
    private String imageRegistry;
    @CommandLine.Option(names = {"-bi", "--base-image"}, description = "Base Image", defaultValue = Constants.KARAVAN_IMAGE)
    private String baseImage;
    @CommandLine.Option(names = {"-bbi", "--base-builder-image"}, description = "Base Builder Image", defaultValue = Constants.DEFAULT_BUILD_IMAGE)
    private String baseBuilderImage;
    @CommandLine.Option(names = {"-f", "--file"}, description = "YAML file name", defaultValue = "karavan.yaml")
    private String file;
    @CommandLine.Option(names = {"-y", "--yaml"}, description = "Create YAML file. Do not apply")
    private boolean yaml;
    @CommandLine.Option(names = {"-o", "--openshift"}, description = "Create files for OpenShift")
    private boolean isOpenShift;

    @Override
    public Integer call() throws Exception {
        KaravanConfig config = new KaravanConfig(
                version,
                namespace,
                environment,
                runtimes,
                auth,
                nodePort,
                gitPullInterval,
                instances,
                imageRegistry,
                baseImage,
                baseBuilderImage,
                isOpenShift,
                new HashMap<>()
        );
        if (yaml) {
            Files.writeString(Path.of(file), ResourceUtils.generateResources(config));
        } else {
            CommandUtils.installKaravan(config);
        }
        return 0;
    }

    public static void main(String... args) {
        int exitCode = new CommandLine(new KaravanCli()).execute(args);
        System.exit(exitCode);
    }
}
