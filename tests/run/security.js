import { test } from '../common.js';
import { App } from '../app.js';


export async function checkAccess(url)
{
    await test(`Check access to ${url}`, async () =>
    {
        const restrictedLocations = ['Controller', 'Model', 'view', 'system', 'vendor'];
        let isInvalidLocation = restrictedLocations.some(location => url.startsWith(location));

        const base = App.environment.baseUrl();
        let requestURL = base + url;
        let resp = await App.environment.httpReq('GET', requestURL);
        while (resp && resp.status > 300 && resp.status < 400 && 'location' in resp.headers) {
            requestURL = resp.headers.location;
            resp = await App.environment.httpReq('GET', resp.headers.location);
        }

        if (isInvalidLocation) {
            let isRestricted = restrictedLocations.some(location => requestURL.startsWith(base + location));
            if (resp.status >= 200 && resp.status < 300 && isRestricted) {
                throw new Error(`Invalid location: ${requestURL}`);
            }
        } else {
            if (resp.status != 200) {
                throw new Error(`Invalid response status: ${resp.status}. 200 is expected`);
            }
        }

        return true;
    });
}
