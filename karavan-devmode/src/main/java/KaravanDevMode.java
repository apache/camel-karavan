import org.apache.camel.dsl.jbang.core.commands.CamelJBangMain;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import picocli.CommandLine;

import java.nio.file.Path;
import java.util.Objects;

public class KaravanDevMode {

    public static void main(String... args) throws Exception {
        CamelJBangMain.run(new KaravanCamelJBangMain(), args);
    }

    static class KaravanCamelJBangMain extends CamelJBangMain {

        private final String projectId = System.getenv("PROJECT_ID");
        private final boolean isBuildMode = Objects.equals(System.getenv("RUN_IN_BUILD_MODE"), "true");

        @Override
        public void execute(String... args) {
            if (args.length == 1 && args[0].equals("fetchBuildScriptFromPlatform")) {
                Path targetDir = Path.of(System.getenv("BUILDER_PATH"));
                KaravanFileFetcher.fetchFilesFromPlatform("configuration", "build.sh", targetDir);
            } else {
                if (!isBuildMode) {
                    Path targetDir = Path.of(System.getenv("CODE_DIR"));
                    KaravanFileFetcher.fetchFilesFromPlatform(projectId, null, targetDir);
                }
                super.execute(args);
            }
        }

        @Override
        public void postExecute(CommandLine commandLine, String[] args, int exitCode) {
            if (exitCode == 0 && args.length > 0 && Objects.equals(args[0], "export")) {
                KaravanLabelAugmenter.addKaravanLabels(args, projectId);
            }
        }
    }
}