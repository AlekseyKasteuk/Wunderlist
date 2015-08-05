# Installation
#### It should be installed on Decktop:
  - Node.js (https://nodejs.org/)
  - Npm (https://www.npmjs.com/)
  - MongoDB (https://www.mongodb.org/)
#### Configure MongoDB
Change file /config/config.js. Write uri of your database in field "uri".
#### Install required modules
In root folder of application there is a file package.json. Install required modules using npm.
```sh
$ npm install
```
#### Start server
Start file app.js in root folder using node.js
```sh
$ node app
```
Application will be on port 8866.