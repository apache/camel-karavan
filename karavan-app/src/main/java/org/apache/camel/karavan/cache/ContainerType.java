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

package org.apache.camel.karavan.cache;

import org.infinispan.api.annotations.indexing.Indexed;
import org.infinispan.api.annotations.indexing.Keyword;
import org.infinispan.protostream.annotations.ProtoEnumValue;

@Indexed
public enum ContainerType {
    @Keyword(projectable = true, sortable = true)
    @ProtoEnumValue(number = 0, name = "internal")
    internal,
    @Keyword(projectable = true, sortable = true)
    @ProtoEnumValue(number = 1, name = "devmode")
    devmode,
    @Keyword(projectable = true, sortable = true)
    @ProtoEnumValue(number = 2, name = "devservice")
    devservice,
    @Keyword(projectable = true, sortable = true)
    @ProtoEnumValue(number = 3, name = "packaged")
    packaged,
    @Keyword(projectable = true, sortable = true)
    @ProtoEnumValue(number = 4, name = "build")
    build,
    @Keyword(projectable = true, sortable = true)
    @ProtoEnumValue(number = 5, name = "unknown")
    unknown,
}
