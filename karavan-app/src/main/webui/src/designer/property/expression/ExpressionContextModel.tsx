/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export class ExpressionContext {
    name: string = '';
    information: Context[] = [];

    constructor(name: string, information: Context[]) {
        this.name = name;
        this.information = information;
    }
}

export class Context {
    key: string = '';
    value: string = '';

    constructor(key: string, value: string) {
        this.key = key;
        this.value = value;
    }
}

export const ExpressionVariables: ExpressionContext[] = [
    new ExpressionContext('groovy', [
            new Context('exchange', 'The Exchange itself.'),
            new Context('exchangeProperties', 'The Exchange properties.'),
            new Context('variables', 'The variables'),
            new Context('headers', 'The headers of the In message.'),
            new Context('camelContext', 'The Camel Context.'),
            new Context('request', 'The In message.'),
            new Context('body', 'The message body'),
            new Context('response', 'The Out message (only for InOut message exchange pattern).')
        ]
    ),
    new ExpressionContext('java', [
            new Context('exchange', 'The Exchange itself.'),
            new Context('message', 'The Camel message.'),
            new Context('context', 'The Camel Context.'),
            new Context('body', 'The message body')
        ]
    ),
    new ExpressionContext('javascript', [
            new Context('this', 'the Exchange is the root object.'),
            new Context('context', 'The Camel Context.'),
            new Context('exchange', 'The Exchange itself.'),
            new Context('exchangeId', 'The ExchangeID.'),
            new Context('message', 'The Camel message.'),
            new Context('body', 'The message body'),
            new Context('headers', 'The message headers'),
            new Context('properties', 'The message properties')
        ]
    ),
    new ExpressionContext('jq', [
            new Context('header', 'Allow accessing the Message header ex. header(\\"MyHeader\\")'),
            new Context('property', 'Allow accessing the Message property ex. property(\\"MyProperty\\")'),
            new Context('constant', 'Allow accessing constant value as-is '),

        ]
    ),
    new ExpressionContext('simple', [
            new Context('camelId', 'the CamelContext name'),
            new Context('camelContext.*OGNL*', 'the CamelContext invoked using a Camel OGNL expression.'),
            new Context('exchange', 'the Exchange'),
            new Context('exchange.*OGNL*', 'the Exchange invoked using a Camel OGNL expression.'),
            new Context('exchangeId', 'the exchange id'),
            new Context('id', 'the message id'),
            new Context('messageTimestamp', 'the message timestamp (millis since epoc) that this message originates from.'),
            new Context('body ', 'the body'),
            new Context('body.*OGNL*', 'the body invoked using a Camel OGNL expression.'),
            new Context('bodyAs(_type_)', 'Converts the body to the given type determined by its classname. The converted body can be null.'),
            new Context('bodyAs(_type_).*OGNL* ', 'Converts the body to the given type determined by its classname and then invoke methods using a Camel OGNL expression. The converted body can be null.'),
            new Context('bodyOneLine', 'Converts the body to a String and removes all line-breaks so the string is in one line.'),
            new Context('prettyBody', 'Converts the body to a String, and attempts to pretty print if JSon or XML, otherwise the body is returned as the String value.'),
            new Context('originalBody', 'The original incoming body (only available if allowUseOriginalMessage=true).'),
            new Context('mandatoryBodyAs(_type_)', 'Converts the body to the given type determined by its classname, and expects the body to be not null.'),
            new Context('mandatoryBodyAs(_type_).*OGNL* ', 'Converts the body to the given type determined by its classname and then invoke methods using a Camel OGNL expression.'),
            new Context('header.foo ', 'refer to the foo header'),
            new Context('header[foo] ', 'refer to the foo header'),
            new Context('headers.foo ', 'refer to the foo header'),
            new Context('headers:foo ', 'refer to the foo header'),
            new Context('headers[foo] ', 'refer to the foo header'),
            new Context('header.foo[bar] ', 'regard foo header as a map and perform lookup on the map with bar as key'),
            new Context('header.foo.*OGNL*', 'refer to the foo header and invoke its value using a Camel OGNL expression.'),
            new Context('headerAs(_key_,_type_)', 'converts the header to the given type determined by its classname'),
            new Context('headers', 'refer to the headers'),
            new Context('variable.foo ', 'refer to the foo variable'),
            new Context('variable[foo] ', 'refer to the foo variable'),
            new Context('variable.foo.*OGNL* ', 'refer to the foo variable and invoke its value using a Camel OGNL expression.'),
            new Context('variableAs(_key_,_type_)', 'converts the variable to the given type determined by its classname'),
            new Context('variables', 'refer to the variables'),
            new Context('exchangeProperty.foo ', 'refer to the foo property on the exchange'),
            new Context('exchangeProperty[foo] ', 'refer to the foo property on the exchange'),
            new Context('exchangeProperty.foo.*OGNL* ', 'refer to the foo property on the exchange and invoke its value using a Camel OGNL expression.'),
            new Context('messageAs(_type_)', 'Converts the message to the given type determined by its classname. The converted message can be null. '),
            new Context('messageAs(_type_).*OGNL* ', 'Converts the message to the given type determined by its classname and then invoke methods using a Camel OGNL expression. The converted message can be null. '),
            new Context('sys.foo', 'refer to the JVM system property'),
            new Context('sysenv.foo', 'refer to the system environment variable'),
            new Context('env.foo', 'refer to the system environment variable'),
            new Context('exception ', 'refer to the exception object on the exchange, is *null* if no exception set on exchange. Will fallback and grab caught exceptions (`Exchange.EXCEPTION_CAUGHT`) if the Exchange has any.'),
            new Context('exception.*OGNL* ', 'refer to the exchange exception invoked using a Camel OGNL expression object'),
            new Context('exception.message', 'refer to the exception.message on the exchange, is *null* if no exception set on exchange. Will fallback and grab caught exceptions (`Exchange.EXCEPTION_CAUGHT`) if the Exchange has any.'),
            new Context('exception.stacktrace', 'refer to the exception.stracktrace on the exchange, is  *null* if no exception set on exchange. Will fallback and grab caught exceptions (`Exchange.EXCEPTION_CAUGHT`) if the Exchange has any.'),
            new Context('date:_command_', `evaluates to a Date object. Supported commands are: *now* for current timestamp,
*exchangeCreated* for the timestamp when the current exchange was created,
*header.xxx* to use the Long/Date object in the header with the key xxx.
*variable.xxx* to use the Long/Date in the variable with the key xxx.
*exchangeProperty.xxx* to use the Long/Date object in the exchange property with the key xxx.
*file* for the last modified timestamp of the file (available with a File consumer).
Command accepts offsets such as: *now-24h* or *header.xxx+1h* or even *now+1h30m-100*.`),
            new Context('date:_command:pattern_', 'Date formatting using `java.text.SimpleDateFormat` patterns.'),
            new Context('date-with-timezone:_command:timezone:pattern_', 'Date formatting using `java.text.SimpleDateFormat` timezones and patterns.'),
            new Context('bean:_bean expression_ ', `Invoking a bean expression using the xref:components::bean-component.adoc[Bean] language.'),
Specifying a method name you must use dot as separator. We also support
the ?method=methodname syntax that is used by the xref:components::bean-component.adoc[Bean]
component. Camel will by default lookup a bean by the given name. However if you need to refer
to a bean class (such as calling a static method) then you can prefix with type, such as 'bean:type:fqnClassName'. `),
            new Context('properties:key:default', 'Lookup a property with the given key. If the key does not exists or has no value, then an optional default value can be specified.'),
            new Context('propertiesExist:key', 'Checks whether a property placeholder with the given key exists or not. The result can be negated by prefixing the key with `!`.'),
            new Context('routeId', 'Returns the route id of the current route the Exchange is being routed.'),
            new Context('routeGroup', 'Returns the route group of the current route the Exchange is being routed. Not all routes has a group assigned, so this may be null.'),
            new Context('stepId', 'Returns the id of the current step the Exchange is being routed.'),
            new Context('threadId', 'Returns the id of the current thread. Can be used for logging purpose.'),
            new Context('threadName', 'Returns the name of the current thread. Can be used for logging purpose.'),
            new Context('hostname', 'Returns the local hostname (may be empty if not possible to resolve).'),
            new Context('ref:xxx ', 'To lookup a bean from the Registry with the given id.'),
            new Context('type:name.field ', 'To refer to a type or field by its FQN name. To refer to a field you can append .FIELD_NAME. For example, you can refer to the constant field from Exchange as: `org.apache.camel.Exchange.FILE_NAME`'),
            new Context('empty(type)', `Creates a new empty object of the type given as parameter. The type-parameter-Strings are case-insensitive. +
'string' -> empty String
'list'   -> empty ArrayList 
'map'    -> empty HashMap `),
            new Context('null', 'represents a *null*'),
            new Context('random(value)', 'returns a random Integer between 0 (included) and _value_ (excluded)'),
            new Context('random(min,max)', 'returns a random Integer between _min_ (included) and _max_ (excluded)'),
            new Context('collate(group)', `The collate function iterates the message body and groups
the data into sub lists of specified size. This can be used with the
Splitter EIP to split a message body and group/batch
the split sub message into a group of N sub lists. This method works
similar to the collate method in Groovy.`),
            new Context('skip(number)', ' The skip function iterates the message body and skips the first number of items. This can be used with the Splitter EIP to split a message body and skip the first N number of items.'),
            new Context('join(separator,prefix,exp)', `The join function iterates the message body (by default) and joins the data into a string. The separator is by default a comma. The prefix is optional.'),

The join uses the message body as source by default. It is possible to refer to another
source (simple language) such as a header via the exp parameter. For example join('&','id=','$\{header.ids}')`),
            new Context('messageHistory', 'The message history of the current exchange how it has been routed. This is similar to the route stack-trace message history the error handler logs in case of an unhandled exception.'),
            new Context('messageHistory(false)', 'As messageHistory but without the exchange details (only includes the route stack-trace). This can be used if you do not want to log sensitive data from the message itself.'),
            new Context('uuid(type)', 'Returns an UUID using the Camel `UuidGenerator`. You can choose between `default`, `classic`, `short` and `simple` as the type. If no type is given the default is used. It is also possible to use a custom `UuidGenerator` and bind the bean to the xref:manual::registry.adoc[Registry] with an id. For example `${uuid(myGenerator}` where the ID is _myGenerator_.'),
            new Context('hash(exp,algorithm)', 'Returns a hashed value (string in hex decimal) using JDK MessageDigest. The algorithm can be SHA-256 (default) or SHA3-256.'),
            new Context('jsonpath(exp)', 'When working with JSon data, then this allows to use the JsonPath language for example to extract data from the message body (in JSon format). This requires having camel-jsonpath JAR on the classpath.'),
            new Context('jsonpath(input,exp)', 'When working with JSon data, then this allows to use the JsonPath language for example to extract data from the message body (in JSon format). This requires having camel-jsonpath JAR on the classpath. For _input_ you can choose `header:key`, `exchangeProperty:key` or `variable:key` to use as input for the JSon payload instead of the message body.'),
            new Context('jq(exp)', 'When working with JSon data, then this allows to use the JQ language for example to extract data from the message body (in JSon format). This requires having camel-jq JAR on the classpath.'),
            new Context('jq(input,exp)', 'When working with JSon data, then this allows to use the JQ language for example to extract data from the message body (in JSon format). This requires having camel-jq JAR on the classpath. For _input_ you can choose `header:key`, `exchangeProperty:key` or `variable:key` to use as input for the JSon payload instead of the message body.'),
            new Context('xpath(exp)', 'When working with XML data, then this allows to use the XPath language for example to extract data from the message body (in XML format). This requires having camel-xpath JAR on the classpath.'),
            new Context('xpath(input,exp)', 'When working with XML data, then this allows to use the XPath language for example to extract data from the message body (in XML format). This requires having camel-xpath JAR on the classpath. For _input_ you can choose `header:key`, `exchangeProperty:key` or `variable:key` to use as input for the JSon payload instead of the message body.'),
            new Context('pretty(exp)', 'Converts the inlined expression to a String, and attempts to pretty print if JSon or XML, otherwise the expression is returned as the String value.'),
        ]
    )
]

export const ExpressionFunctions: ExpressionContext[] = [
    new ExpressionContext('java', [
            new Context('bodyAs(type)', 'To convert the body to the given type'),
            new Context('headerAs(name, type)', 'To convert the header with the name to the given type.'),
            new Context('headerAs(name, defaultValue, type)', 'To convert the header with the name to the given type. If no header exists, then use the given default value.'),
            new Context('exchangePropertyAs(name, type)', 'To convert the exchange property with the name to the given type.'),
            new Context('exchangePropertyAs(name, defaultValue, type)', 'To convert the exchange property with the name to the given type. If no exchange property exists, then use the given default value.'),
            new Context('optionalBodyAs(type)', 'To convert the body to the given type, returned wrapped in java.util.Optional.'),
            new Context('optionalHeaderAs(name, type)', 'To convert the header with the name to the given type, returned wrapped in java.util.Optional.'),
            new Context('optionalExchangePropertyAs(name, type)', 'To convert the exchange property with the name to the given type, returned wrapped in java.util.Optional.')
        ]
    ),
    new ExpressionContext('xpath', [
            new Context('in:body', 'Will return the message body.'),
            new Context('in:header', 'Will return the message header.'),
            new Context('function:properties', 'To use a Property Placeholder.'),
            new Context('function:simple', 'To evaluate a Simple language.'),
        ]
    )
]
