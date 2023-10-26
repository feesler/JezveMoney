import { environment } from 'jezve-test/NodeEnvironment';
import { onReady } from '@jezvejs/dom';
import options from './options.js';

const envOptions = { ...options };
const isBrowser = typeof window !== 'undefined';

const run = async () => {
    if (isBrowser) {
        envOptions.container = document.getElementById('testscontainer');
    }

    environment.init(envOptions);
};

if (isBrowser) {
    onReady(() => run());
} else {
    run();
}
