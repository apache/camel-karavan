import org.apache.camel.Exchange;
import org.apache.camel.Processor;
import javax.inject.Named;
import javax.inject.Singleton;
import java.lang.String;

@Singleton
@Named("ResponseProcessor")
public class Responseprocessor implements Processor {

  public void process(Exchange exchange) throws Exception {
    if(exchange.getIn().getBody(String.class).contains("quit")) {
       System.out.println("received Quit");
       exchange.getOut().setHeader("CamelNettyCloseChannelWhenComplete", true);
    }
    else {
       exchange.getOut().setBody("Hello from Karavan Pod");
    }
  }
}