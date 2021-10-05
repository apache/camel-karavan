package org.apache.camel.karavan.generator;

public final class KaravanGenerator {

    public static void main(String[] args) throws Exception {
        CamelModelGenerator.generate();
        KameletGenerator.generate();
        System.exit(0);
    }

}
