import { NodeEnvironment } from './env/node.js';
import { App } from './app.js';

const env = new NodeEnvironment();
env.init(App);
