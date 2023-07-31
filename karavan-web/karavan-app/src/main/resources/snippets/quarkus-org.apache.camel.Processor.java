import org.apache.camel.Exchange;
import org.apache.camel.Processor;

import jakarta.inject.Named;
import jakarta.inject.Singleton;

@Singleton
@Named("NAME")
public class NAME implements Processor {

  public void process(Exchange exchange) throws Exception {
      exchange.getIn().setBody("Hello World");
  }
}