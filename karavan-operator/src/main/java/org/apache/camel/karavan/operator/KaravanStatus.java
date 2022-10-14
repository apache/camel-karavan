package org.apache.camel.karavan.operator;

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
