import { query, prop, assert } from 'jezve-test';
import { AppView } from './AppView.js';

/** Scheduled transactions list view class */
export class ScheduleView extends AppView {
    async parseContent() {
        const res = {};

        res.heading = { elem: await query('.heading > h1') };
        assert(res.heading.elem, 'Heading element not found');
        res.heading.text = await prop(res.heading.elem, 'textContent');

        return res;
    }
}
