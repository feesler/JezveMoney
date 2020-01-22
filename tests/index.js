import { NodeEnvironment } from './env/node.js'
import { App } from './main.js';


let env = new NodeEnvironment();
env.init(App);
