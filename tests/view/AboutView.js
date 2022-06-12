import { query, prop } from 'jezve-test';
import { AppView } from './AppView.js';

/** About view class */
export class AboutView extends AppView {
    async parseContent() {
        const res = {};

        res.heading = { elem: await query('.heading > h1') };
        if (!res.heading.elem) {
            throw new Error('Heading element not found');
        }
        res.heading.text = await prop(res.heading.elem, 'textContent');

        return res;
    }
}
