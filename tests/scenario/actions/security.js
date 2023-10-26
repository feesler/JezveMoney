import { assert } from '@jezvejs/assert';
import {
    test,
    baseUrl,
    httpReq,
} from 'jezve-test';

const restrictedLocations = [
    'Controller',
    'Model',
    'view',
    'system',
    'vendor',
    'composer.',
    '.htaccess',
];

export const checkAccess = async (url) => {
    await test(`Check access to ${url}`, async () => {
        const isInvalidLocation = restrictedLocations.some(
            (location) => url.startsWith(location),
        );

        const base = baseUrl();
        let requestURL = base + url;
        let resp = await httpReq('GET', requestURL);
        while (resp && resp.status > 300 && resp.status < 400 && 'location' in resp.headers) {
            requestURL = resp.headers.location;
            resp = await httpReq('GET', requestURL);
        }

        if (isInvalidLocation) {
            const isRestricted = restrictedLocations.some(
                (location) => resp.url.startsWith(base + location),
            );
            if (isRestricted) {
                assert(resp.status >= 300, `Invalid location: ${resp.url}`);
            }
        } else {
            assert(resp.status === 200, `Invalid response status: ${resp.status}. 200 is expected`);
        }

        return true;
    });
};
