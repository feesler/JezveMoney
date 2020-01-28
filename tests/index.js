import { NodeEnvironment } from './env/node.js'
import { App } from './app.js';


let env = new NodeEnvironment();
env.init(App);
