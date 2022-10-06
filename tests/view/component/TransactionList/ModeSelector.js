import {
    TestComponent,
    queryAll,
    hasClass,
    prop,
    assert,
} from 'jezve-test';

const availModes = [
    'classic',
    'details',
];

export class ModeSelector extends TestComponent {
    async parseContent() {
        const validClass = await hasClass(this.elem, 'mode-selector');
        assert(validClass, 'Unexpected stucture of mode selector control');

        const [listModeElem, detailsModeElem] = await queryAll(this.elem, '.mode-selector__item');

        const res = {
            listMode: await this.parseModeItem(listModeElem),
            detailsMode: await this.parseModeItem(detailsModeElem),
        };

        assert(
            res.listMode.elem
            && res.listMode.title === 'Classic'
            && res.detailsMode.elem
            && res.detailsMode.title === 'Details',
            'Unexpected stucture of mode selector control',
        );
        assert(res.listMode.isActive !== res.detailsMode.isActive, 'Invalid state of mode selector');

        res.details = res.detailsMode.isActive;

        return res;
    }

    async parseModeItem(elem) {
        assert(elem, 'Invalid element');

        const tagName = await prop(elem, 'tagName');
        let title = await prop(elem, 'textContent');
        title = title.trim();

        assert(availModes.includes(title.toLowerCase()), `Unknown mode ${title}`);

        const res = {
            elem,
            title,
            isActive: (tagName === 'B'),
        };

        return res;
    }

    async setDetailsMode() {
        assert(this.content.detailsMode.elem, 'Mode selector component is inactive');

        if (this.content.detailsMode.isActive) {
            return;
        }

        await this.content.detailsMode.elem.click();
    }

    async setClassicMode() {
        assert(this.content.listMode.elem, 'Mode selector component is inactive');

        if (this.content.listMode.isActive) {
            return;
        }

        await this.content.listMode.elem.click();
    }
}
