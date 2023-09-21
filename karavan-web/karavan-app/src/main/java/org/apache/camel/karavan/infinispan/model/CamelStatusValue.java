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

package org.apache.camel.karavan.infinispan.model;

import org.infinispan.protostream.annotations.ProtoEnumValue;
import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

public class CamelStatusValue {

    public enum Name {

        @ProtoEnumValue(number = 0, name = "context") context,
        @ProtoEnumValue (number = 1, name = "inflight") inflight,
        @ProtoEnumValue (number = 2, name = "memory") memory,
        @ProtoEnumValue (number = 3, name = "properties") properties,
        @ProtoEnumValue (number = 4, name = "route") route,
        @ProtoEnumValue (number = 5, name = "trace") trace,
        @ProtoEnumValue (number = 6, name = "jvm") jvm,
        @ProtoEnumValue (number = 7, name = "source") source
    }

    @ProtoField(number = 1)
    Name name;
    @ProtoField(number = 2)
    String status;

    @ProtoFactory
    public CamelStatusValue(Name name, String status) {
        this.name = name;
        this.status = status;
    }

    public Name getName() {
        return name;
    }

    public void setName(Name name) {
        this.name = name;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
