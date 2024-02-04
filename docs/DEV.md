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

### For working in windows machine

#### Make following change in package.json line 5-12
```
  "scripts": {
    "copy-designer": "xcopy ..\\..\\..\\..\\..\\karavan-designer\\src\\designer src\\designer /E/H/Y",
    "copy-knowledgebase": "xcopy ..\\..\\..\\..\\..\\karavan-designer\\src\\knowledgebase src\\knowledgebase /E/H/Y",
    "copy-topology": "xcopy ..\\..\\..\\..\\..\\karavan-designer\\src\\topology src\\topology /E/H/Y",
    "copy-code": " npm run copy-designer &&  npm run copy-knowledgebase &&  npm run copy-topology",
    "start": "set PORT=3003 && npm run copy-code && react-scripts start",
    "build": "npm run copy-code && DISABLE_ESLINT_PLUGIN=true react-scripts build"
  },
```
