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
package org.apache.camel.karavan.operator.spec;

public class KaravanStatus {

    public enum State {
        READY,
        ERROR,
        UNKNOWN
    }

    private State state = State.UNKNOWN;
    private boolean error;
    private String message;

    public KaravanStatus() {
    }

    public KaravanStatus(State state) {
        this.state = state;
    }

    public KaravanStatus(State state, boolean error, String message) {
        this.state = state;
        this.error = error;
        this.message = message;
    }

    public State getState() {
        return state;
    }

    public void setState(State state) {
        this.state = state;
    }

    public boolean isError() {
        return error;
    }

    public void setError(boolean error) {
        this.error = error;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public KaravanStatus clone() {
        var status = new KaravanStatus();
        status.setMessage(this.message);
        status.setState(this.state);
        status.setError(this.error);
        return status;
    }
}
