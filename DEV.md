## Project structure
1. Karavan-generator  
Generate Camel Models and Api from Camel sources to Typescript in karavan-core
2. Karavan-core  
Front-end Camel Models and Api
3. Karavan-Designer  
KaravanDesigner UI component
4. Karavan-app  
Karavan Cloud Application
5. Karavan-vscode  
VS Code extension based on Karavan Designer

## How to build
1. Generate Camel Models and API for Typescript
```
cd karavan-generator
mvn clean compile exec:java -Dexec.mainClass="org.apache.camel.karavan.generator.KaravanGenerator" -f karavan-generator
```

2. Install Karavan core library
```
cd  karavan-core
npm install
```

3. Build Karavan app  
```
cd karavan-app
mvn clean package -Dquarkus.profile=public
```

## Development Karavan app
You can run your application in dev mode that enables live coding using:
```shell script
cd karavan-app
mvn quarkus:dev -Dquarkus.profile=public
```