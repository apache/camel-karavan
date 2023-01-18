1. This example explains the setup of Rest service using Karavan
2. This service listen on Nodeport 30011
3. Supported Rest API's
   ```
	| METHOD | PATH                                    | BODY             |RETURN   |
	|--------|-----------------------------------------|------------------|---------|
	| GET    | http://localhost:30011/v1/users         |                  |   200   |
	| GET    | http://localhost:30011/v1/users/karavan |                  |   200   |
	| DELETE | http://localhost:30011/v1/users/karavan |                  |   200   |
    | POST   | http://localhost:30011/v1/users         |{"name":"karavan"}|   202   |
   ```
