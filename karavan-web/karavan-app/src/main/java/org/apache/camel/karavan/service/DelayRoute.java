package org.apache.camel.karavan.service;

import org.apache.camel.builder.endpoint.EndpointRouteBuilder;

import static org.apache.camel.karavan.shared.EventType.DELAY_MESSAGE;
import static org.apache.camel.karavan.shared.EventType.DEVMODE_CONTAINER_READY;

public class DelayRoute extends EndpointRouteBuilder {

    @Override
    public void configure() throws Exception {
        from(vertx(DELAY_MESSAGE))
                .delay(500)
                .to(vertx(DEVMODE_CONTAINER_READY));
    }
}
