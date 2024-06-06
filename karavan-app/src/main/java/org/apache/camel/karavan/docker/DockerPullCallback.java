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

package org.apache.camel.karavan.docker;

import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.PullResponseItem;

import java.util.function.Consumer;

public class DockerPullCallback extends ResultCallback.Adapter<PullResponseItem> {

    private final Consumer<String> action;

    public DockerPullCallback(Consumer<String> action) {
        this.action = action;
    }

    @Override
    public void onNext(PullResponseItem item) {
        StringBuilder line = new StringBuilder();
        if (item.getId() != null) {
            line.append("Layer ").append(item.getId()).append(", ");
        }
        line.append(item.getStatus()).append(" ");
        if (item.getProgressDetail() != null && item.getProgressDetail().getCurrent() != null && item.getProgressDetail().getTotal() != null) {
            long progress = (long) ((item.getProgressDetail().getCurrent().doubleValue() / item.getProgressDetail().getTotal().doubleValue()) * 100);
            line.append(" ").append(progress).append("%");
        }
        action.accept(line.toString());
    }

}
