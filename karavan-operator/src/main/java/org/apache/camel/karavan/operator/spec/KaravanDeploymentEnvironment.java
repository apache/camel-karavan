package org.apache.camel.karavan.operator.spec;

public class KaravanDeploymentEnvironment {

    public enum Type {
        AWS("AWS"),
        OPENSHIFT("OPENSHIFT"),
        KUBERNETES("KUBERNETES");

        private String name;

        public String getName() {
            return name;
        }

        Type(String name) {
            this.name = name;
        }
    }
}
