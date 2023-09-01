package org.apache.camel.karavan.service;

import org.apache.camel.builder.endpoint.EndpointRouteBuilder;
import org.apache.camel.karavan.infinispan.InfinispanService;

import static org.apache.camel.karavan.shared.EventType.*;

public class DelayRoute extends EndpointRouteBuilder {

    @Override
    public void configure() throws Exception {
        from(vertx(DEVMODE_DELAY_MESSAGE))
                .delay(500)
                .to(vertx(DEVMODE_CONTAINER_READY));

//        from(vertx(InfinispanService.INFINISPAN_START_DELAY))
//                .delay(1000)
//                .toD(vertx(InfinispanService.INFINISPAN_START));
    }
}
