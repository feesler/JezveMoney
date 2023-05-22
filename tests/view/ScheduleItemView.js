import { query, prop, assert } from 'jezve-test';
import { AppView } from './AppView.js';

/** Scheduled transaction create/update view class */
export class ScheduleItemView extends AppView {
    async parseContent() {
        const res = {};

        res.heading = { elem: await query('.heading > h1') };
        assert(res.heading.elem, 'Heading element not found');
        res.heading.text = await prop(res.heading.elem, 'textContent');

        return res;
    }
}
