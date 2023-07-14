package org.apache.camel.karavan.bashi.docker;

import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.Frame;

import java.util.ArrayList;
import java.util.List;

public class LogCallback extends ResultCallback.Adapter<Frame> {
    protected final StringBuffer log = new StringBuffer();

    List<Frame> collectedFrames = new ArrayList<>();

    boolean collectFrames = false;

    @Override
    public void onNext(Frame frame) {
        if (collectFrames) collectedFrames.add(frame);
        log.append(new String(frame.getPayload()));
    }

    @Override
    public String toString() {
        return log.toString();
    }
}