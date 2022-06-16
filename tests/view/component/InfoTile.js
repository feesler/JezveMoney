import {
    TestComponent,
    assert,
    query,
    prop,
    hasClass,
} from 'jezve-test';

export class InfoTile extends TestComponent {
    async parseContent() {
        const validClass = await hasClass(this.elem, 'info-tile');
        assert(validClass, 'Invalid structure of info tile');

        const res = {
            titleEl: await query(this.elem, '.info-tile__title'),
            subtitleEl: await query(this.elem, '.info-tile__subtitle'),
        };

        res.title = await prop(res.titleEl, 'textContent');
        res.subtitle = await prop(res.subtitleEl, 'innerText');
        res.subtitle = res.subtitle.split('\r\n').join('\n');

        return res;
    }
}
