package org.apache.camel.karavan.operator.spec;

public class CamelRuntime {

    public enum Type {
        QUARKUS("quarkus"),
        SPRING_BOOT("spring-boot");

        private String name;

        public String getName() {
            return name;
        }

        Type(String name) {
            this.name = name;
        }
    }
}
