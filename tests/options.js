import { App } from './Application.js';
import { checkPHPerrors } from './common.js';
import { route } from './router.js';

export default {
    app: App,
    validateContent: checkPHPerrors,
    routeHandler: route,
    appPath: '/',
};
