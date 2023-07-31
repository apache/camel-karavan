import org.apache.camel.AggregationStrategy
;
import org.apache.camel.Exchange;

import jakarta.inject.Named;
import jakarta.inject.Singleton;

@Singleton
@Named("NAME")
public class NAME implements AggregationStrategy {
    @Override
    public Exchange aggregate(Exchange oldExchange, Exchange newExchange) {

        if (oldExchange == null) {
            return newExchange;
        }

        String oldBody = oldExchange.getIn().getBody(String.class);
        String newBody = newExchange.getIn().getBody(String.class);
        oldExchange.getIn().setBody(oldBody + "+" + newBody);
        return oldExchange;
    }
}