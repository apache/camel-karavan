package org.apache.camel.karavan.model;

import io.smallrye.config.ConfigMapping;

import java.util.List;

@ConfigMapping(prefix = "karavan.config")
public interface KaravanConfiguration {

    String groupId();
    String runtime();
    List<Environment> environments();

    interface Environment {
        String name();
        String cluster();
    }
}
