# How to use Karavan 

## Create new Integration

![create](../images/create.png)

## Edit an existing Integration

![open](../images/open.png)


## Run integration locally
* Run in UI: click `Run` button 

![run](../images/run.png)

* Run using CLI
    ```shell
    jbang -Dcamel.jbang.version=4.8.0 camel@apache/camel run $INTEGRATION.yaml --max-messages=10 --logging-level=info
    ```

## Export integration to Maven project

* Export using context menu
![export](../images/export.png)

* Export using CLI
    ```shell
    jbang -Dcamel.jbang.version=4.8.0 camel@apache/camel export --directory=export
    ```