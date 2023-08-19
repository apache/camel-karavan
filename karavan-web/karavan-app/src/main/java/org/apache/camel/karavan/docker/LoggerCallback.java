package org.apache.camel.karavan.docker;

import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.Frame;
import org.jboss.logging.Logger;

public class LoggerCallback extends ResultCallback.Adapter<Frame> {

    private static final Logger LOGGER = Logger.getLogger(LoggerCallback.class.getName());

    @Override
    public void onNext(Frame frame) {
        LOGGER.info(new String(frame.getPayload()));
    }


    @Override
    public void onError(Throwable throwable) {
        LOGGER.error(throwable.getMessage());
    }
}