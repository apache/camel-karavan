# Create and edit integration 

## Create new Integration

![create](../images/create.png)

## Edit an existing Integration

![open](../images/open.png)


# Run integration

## Run integration locally
* Run in UI: click `Run` button 

![run](../images/run.png)

* Run using CLI
    ```shell
    jbang -Dcamel.jbang.version=3.21.0 camel@apache/camel run $INTEGRATION.yaml --max-messages=10 --logging-level=info
    ```

## Export integration to Maven project

* Export using context menu
![export](../images/export.png)

* Export using CLI
    ```shell
    jbang -Dcamel.jbang.version=3.21.0 camel@apache/camel export --directory=export
    ```

# Issues

If you find a new issue, please [create a new issue report in GitHub](https://github.com/apache/camel-karavan/issues)!
