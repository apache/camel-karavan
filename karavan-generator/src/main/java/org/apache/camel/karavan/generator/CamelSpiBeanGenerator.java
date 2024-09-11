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

import io.vertx.core.json.JsonObject;

public final class CamelSpiBeanGenerator extends AbstractGenerator {

    final static String modelHeader = "karavan-generator/src/main/resources/CamelMetadata.header.ts";
    final static String targetModel = "karavan-core/src/core/model/CamelMetadata.ts";

    public static void main(String[] args) throws Exception {
        CamelSpiBeanGenerator.generate();
        System.exit(0);
    }

    public static void generate(String... paths) throws Exception {
        CamelSpiBeanGenerator g = new CamelSpiBeanGenerator();
        for (String path : paths) {
            g.createCamelBeans(path + "/metadata");
        }
    }

    private void createCamelBeans(String path) throws Exception {
        StringBuilder sources = new StringBuilder("[\n");
        var beans = listResources("/org/apache/camel/catalog/beans/").stream().sorted().toList();
        for (int i = 0; i < beans.size(); i++) {
            var s = beans.get(i);
            var beanName = s.substring(0, s.lastIndexOf('.'));
            var json = readBean(beanName);
            var bean = new JsonObject(json);
            if (beanName.endsWith("AggregationRepository")) {
                var b = bean.getJsonObject("bean").put("interfaceType", "org.apache.camel.spi.AggregationRepository");
                bean.put("bean", b);
            }
            sources.append(bean.encodePrettily()).append(i != beans.size() - 1 ? "\n,\n" : "\n");
        }
        sources.append("]");
        saveFile(path, "spiBeans.json", sources.toString());

//        var interfaces = new HashSet<String>();
//        var code = new StringBuilder();
//        var beans = listResources("/org/apache/camel/catalog/beans/").stream().sorted().toList();
//        beans.forEach(filename -> {
//            var beanName = filename.substring(0, filename.lastIndexOf('.'));
//            var json = readBean(beanName);
//            var bean = new JsonObject(json);
//            code.append(System.lineSeparator()).append(bean.encodePrettily());
//            interfaces.add(bean.getJsonObject("bean").getString("interfaceType"));
//        });
//        System.out.println(" beans " + beans.size());
//        System.out.println(" beans " + beans.stream().filter(filename -> {
//            var beanName = filename.substring(0, filename.lastIndexOf('.'));
//            var json = readBean(beanName);
//            var bean = new JsonObject(json);
//            var x =  bean.getJsonObject("bean").getString("properties");
//            if (x == null) {
//                System.out.println(bean.getJsonObject("bean").getString("name"));;
//            }
//            return x == null;
//        }).count());
//        System.out.println(" interfaces " + interfaces);
//        System.out.println(code.toString().length());
    }

}
