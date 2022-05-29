import { BrowserEnvironment } from 'jezve-test/BrowserEnvironment';
import { onReady } from 'jezve-test';
import options from './options.js';

onReady(() => {
    setTimeout(() => {
        const environment = new BrowserEnvironment();

        const envOptions = { ...options };
        const { origin } = window.location;
        if (origin.includes('jezve.net')) {
            envOptions.appPath = '/money/';
        }

        envOptions.container = document.getElementById('testscontainer');

        environment.init(envOptions);
    });
});
