## Project structure
1. karavan-generator  
Generate Camel Models and Api from Camel sources to Typescript in karavan-core
2. karavan-core  
Front-end Camel Models and Api
3. karavan-Designer  
KaravanDesigner UI component
4. karavan-web  
Karavan Cloud Application
    * karavan-app
    Karavan Application to be installed into Kubernetes
    * karavan-installer
    Karavan Installer to install into Kubernetes
5. karavan-vscode  
VS Code extension based on Karavan Designer

## How to build Karavan Web Application
1. Generate Camel Models and API for Typescript
```
mvn clean compile exec:java -Dexec.mainClass="org.apache.camel.karavan.generator.KaravanGenerator" -f karavan-generator
```

2. Install Karavan core library
```
cd  karavan-core
npm install
```

3. Build Karavan app  
```
cd karavan-web
mvn clean package -f karavan-app -Dquarkus.profile=public 
```

## How to build Karavan VS Code extension
1. Generate Camel Models and API for Typescript
```
mvn clean compile exec:java -Dexec.mainClass="org.apache.camel.karavan.generator.KaravanGenerator" -f karavan-generator
```

2. Install Karavan core library
```
cd  karavan-core
npm install
```

3. Build Karavan VS Code extension  
```
cd karavan-vscode
npm update && npm install 
npm install -g @vscode/vsce
vsce package
```
