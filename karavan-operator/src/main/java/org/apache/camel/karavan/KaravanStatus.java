package org.apache.camel.karavan;

public class KaravanStatus {

    public enum State {
        READY,
        ERROR,
        UNKNOWN
    }

    private State state = State.UNKNOWN;
    private boolean error;
    private String message;

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
