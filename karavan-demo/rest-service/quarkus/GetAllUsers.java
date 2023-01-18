import org.apache.camel.Exchange;
import org.apache.camel.Processor;

import javax.inject.Named;
import javax.inject.Singleton;

@Singleton
@Named("GetAllUsers")
public class GetAllUsers implements Processor {

  public void process(Exchange exchange) throws Exception {

    exchange.getOut().setBody("[{\"username\":\"Karavan1\"},{\"username\":\"Karavan2\"}]");
    exchange.getOut().setHeader(Exchange.HTTP_RESPONSE_CODE, "200");
  }
}