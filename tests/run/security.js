import { test } from 'jezve-test';
import { baseUrl, httpReq } from '../env.js';

export const checkAccess = async (url) => {
    await test(`Check access to ${url}`, async () => {
        const restrictedLocations = ['Controller', 'Model', 'view', 'system', 'vendor'];
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
            if (resp.status >= 200 && resp.status < 300 && isRestricted) {
                throw new Error(`Invalid location: ${resp.url}`);
            }
        } else if (resp.status !== 200) {
            throw new Error(`Invalid response status: ${resp.status}. 200 is expected`);
        }

        return true;
    });
};
