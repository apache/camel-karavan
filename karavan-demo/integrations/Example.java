import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.Exchange;
import org.apache.camel.Processor;

public class Example extends RouteBuilder implements Processor {
    @Override
    public void configure() throws Exception {
        from("timer:tick")
            .process("#class:Example")
            .to("log:info");
    }

    public void process(Exchange exchange) throws Exception {
        exchange.getIn().setBody("Hello World");
    }
}