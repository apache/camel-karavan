package org.apache.camel.karavan.docker;

import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.Frame;

import java.io.Closeable;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;

public class GiteaCheckCallback extends ResultCallback.Adapter<Frame> {

    private static final AtomicBoolean giteaStarted = new AtomicBoolean(false);
    private static final AtomicInteger giteaCheck = new AtomicInteger(0);


    private final Consumer createGiteaUser;
    private final Consumer checkGiteaInstance;

    public GiteaCheckCallback(Consumer createGiteaUser, Consumer checkGiteaInstance) {
        this.createGiteaUser = createGiteaUser;
        this.checkGiteaInstance = checkGiteaInstance;
    }

    @Override
    public void onStart(Closeable stream) {
    }

    @Override
    public void onNext(Frame object) {
        if (!giteaStarted.get()) {
            String line = new String(object.getPayload());
            if (line.startsWith("HTTP/1.1 200")) {
                giteaStarted.set(true);
                createGiteaUser.accept(null);
            }
        }
    }

    @Override
    public void onError(Throwable throwable) {

    }

    @Override
    public void onComplete() {
        giteaCheck.incrementAndGet();
        if (!giteaStarted.get() && giteaCheck.get() < 1000) {
            checkGiteaInstance.accept(null);
        }
    }

}