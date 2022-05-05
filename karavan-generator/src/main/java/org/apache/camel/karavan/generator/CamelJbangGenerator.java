/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.apache.camel.karavan.generator;

import org.apache.camel.dsl.jbang.core.commands.Build;
import org.apache.camel.dsl.jbang.core.commands.CamelJBangMain;
import org.apache.camel.dsl.jbang.core.commands.CodeGenerator;
import org.apache.camel.dsl.jbang.core.commands.CodeRestGenerator;
import org.apache.camel.dsl.jbang.core.commands.Deploy;
import org.apache.camel.dsl.jbang.core.commands.Image;
import org.apache.camel.dsl.jbang.core.commands.Manifest;
import org.apache.camel.dsl.jbang.core.commands.Package;
import org.apache.camel.dsl.jbang.core.commands.Run;
import org.apache.camel.dsl.jbang.core.commands.UberJar;
import org.apache.camel.dsl.jbang.core.commands.Undeploy;
import picocli.CommandLine;

public final class CamelJbangGenerator extends AbstractGenerator {

    final static String modelHeader = "karavan-generator/src/main/resources/CamelMetadata.header.ts";
    final static String targetModel = "karavan-core/src/core/model/CamelMetadata.ts";

    public static void main(String[] args) throws Exception {
        CamelJbangGenerator.generate();
        System.exit(0);
    }

    public static void generate() throws Exception {
        CamelJbangGenerator g = new CamelJbangGenerator();
        g.createJbangDefinitions();
    }

    private void createJbangDefinitions() throws Exception {
        StringBuilder camelModel = new StringBuilder();
        camelModel.append(readFileText(modelHeader));


        CommandLine commandLine = new CommandLine(new CamelJBangMain())
                .addSubcommand("run", new CommandLine(new Run()))
                .addSubcommand("package", new CommandLine(new Package())
                        .addSubcommand("uber-jar", new UberJar()))
                .addSubcommand("generate", new CommandLine(new CodeGenerator())
                        .addSubcommand("rest", new CodeRestGenerator()))
                .addSubcommand("build", new CommandLine(new Build())
                        .addSubcommand("manifests", new Manifest())
                        .addSubcommand("image", new Image()))
                .addSubcommand("deploy", new CommandLine(new Deploy()))
                .addSubcommand("undeploy", new CommandLine(new Undeploy()));



        writeFileText(targetModel, camelModel.toString());
    }


}
