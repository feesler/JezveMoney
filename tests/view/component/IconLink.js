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

        const res = {
            linkElem: await query(this.elem, ':scope > *'),
        };

        assert(res.linkElem, 'Link element not found');

        const tagName = await prop(res.linkElem, 'tagName');
        if (tagName === 'A') {
            res.link = await prop(res.linkElem, 'href');
        }

        res.titleElem = await query(res.linkElem, '.iconlink__content');
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
        return click(this.content.linkElem);
    }
}
