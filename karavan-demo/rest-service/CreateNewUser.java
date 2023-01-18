import org.apache.camel.Exchange;
import org.apache.camel.Processor;

import javax.inject.Named;
import javax.inject.Singleton;

@Singleton
@Named("CreateNewUser")
public class CreateNewUser implements Processor {

  public void process(Exchange exchange) throws Exception {
      exchange.getOut().setHeader(Exchange.HTTP_RESPONSE_CODE, "202");
  }
}