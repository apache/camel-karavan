package org.apache.camel.karavan.docker;

import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.Frame;
import io.vertx.core.eventbus.EventBus;

public class LogCallback extends ResultCallback.Adapter<Frame> {

    private final EventBus eventBus;

    public LogCallback(EventBus eventBus) {
        this.eventBus = eventBus;
    }

    @Override
    public void onNext(Frame frame) {
        System.out.println(new String(frame.getPayload()));
    }

}