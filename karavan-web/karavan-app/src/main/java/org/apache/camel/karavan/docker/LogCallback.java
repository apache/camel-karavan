package org.apache.camel.karavan.docker;

import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.Frame;

import java.util.function.Consumer;

public class LogCallback extends ResultCallback.Adapter<Frame> {

    private final Consumer<String> action;

    public LogCallback(Consumer<String> action) {
        this.action = action;
    }

    @Override
    public void onNext(Frame frame) {
        action.accept(new String(frame.getPayload()));
    }

}