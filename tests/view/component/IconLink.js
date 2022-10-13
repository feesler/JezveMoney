import {
    TestComponent,
    assert,
    query,
    prop,
    hasClass,
    click,
} from 'jezve-test';

export class IconLink extends TestComponent {
    async parseContent() {
        if (!this.elem) {
            return {};
        }

        const validClass = await hasClass(this.elem, 'iconlink');
        assert(validClass, 'Wrong icon link');

        const res = {};

        const tagName = await prop(this.elem, 'tagName');
        if (tagName === 'A') {
            res.link = await prop(this.elem, 'href');
        }

        res.titleElem = await query(this.elem, '.iconlink__content');
        const titleInner = await query(res.titleElem, ':scope > *');
        assert(titleInner, 'Title element not found');
        res.title = await prop(titleInner, 'textContent');

        // Subtitle is optional
        res.subTitleElem = await query(res.titleElem, '.iconlink__subtitle');
        if (res.subTitleElem) {
            res.subtitle = await prop(res.subTitleElem, 'textContent');
        }

        return res;
    }

    async click() {
        return click(this.elem);
    }
}
