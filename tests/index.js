import { environment } from 'jezve-test/NodeEnvironment';
import { onReady } from 'jezve-test';
import options from './options.js';

const envOptions = { ...options };
const isBrowser = typeof window !== 'undefined';

const run = async () => {
    if (isBrowser) {
        const { origin } = window.location;
        if (origin.includes('jezve.net')) {
            envOptions.appPath = '/money/';
        }

        envOptions.container = document.getElementById('testscontainer');
    }

    environment.init(envOptions);
};

if (isBrowser) {
    onReady(() => run());
} else {
    run();
}
