import org.apache.camel.Exchange;
import org.apache.camel.Processor;

import javax.inject.Named;
import javax.inject.Singleton;

@Singleton
@Named("GetUserById")
public class GetUserById implements Processor {

  public void process(Exchange exchange) throws Exception {
      exchange.getOut().setBody("{\"username\":\"Karavan\"" +exchange.getIn().getHeader(Exchange.HTTP_PATH) + "}");
      exchange.getOut().setHeader(Exchange.HTTP_RESPONSE_CODE, "200");
  }
}