import org.apache.camel.Exchange;
import org.apache.camel.Processor;

public class MyPrepareProcessor implements Processor {

  public void process(Exchange exchange) throws Exception {
      exchange.getIn().setBody("Hello world");
  }
}
