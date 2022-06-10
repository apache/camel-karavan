package org.apache.camel.karavan.model;

import io.smallrye.config.ConfigMapping;

import java.util.List;
import java.util.Set;

@ConfigMapping(prefix = "karavan.config")
public interface KaravanConfiguration {

    String groupId();
    String defaultRuntime();
    List<Environment> environments();

    interface Environment {
        String name();
        String cluster();
    }
}
