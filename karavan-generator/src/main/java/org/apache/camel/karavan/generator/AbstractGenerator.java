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

import io.vertx.core.Vertx;
import io.vertx.core.buffer.Buffer;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.Arrays;
import java.util.stream.Collectors;

public class AbstractGenerator {

    protected Vertx vertx = Vertx.vertx();

    protected JsonObject getDefinitions(String source){
        Buffer buffer = vertx.fileSystem().readFileBlocking(source);
        return new JsonObject(buffer).getJsonObject("items").getJsonObject("definitions");
    }

    protected String readFileText(String template){
        Buffer templateBuffer = vertx.fileSystem().readFileBlocking(template);
        return templateBuffer.toString();
    }

    protected void writeFileText(String filePath, String data){
        vertx.fileSystem().writeFileBlocking(filePath, Buffer.buffer(data));
    }

    protected JsonObject getProperties(JsonObject definitions, String classname) {
        JsonObject props = definitions.getJsonObject(classname).getJsonObject("properties");
        JsonArray oneOf = definitions.getJsonObject(classname).getJsonArray("oneOf");
        if (props != null) {
            return props;
        } else {
            return oneOf.getJsonObject(1).getJsonObject("properties");
        }
    }

    protected String camelize(String name, String separator) {
        return Arrays.stream(name.split(separator)).map(s -> capitalize(s)).collect(Collectors.joining());
    }

    protected String capitalize(String str) {
        return str.length() == 0 ? str
                : str.length() == 1 ? str.toUpperCase()
                : str.substring(0, 1).toUpperCase() + str.substring(1);
    }

    protected String deCapitalize(String str) {
        return str.length() == 0 ? str
                : str.length() == 1 ? str.toLowerCase()
                : str.substring(0, 1).toLowerCase() + str.substring(1);
    }

}
