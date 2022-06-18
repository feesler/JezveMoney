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

        const res = {
            listMode: {},
            detailsMode: {},
        };

        const modeElements = await queryAll(this.elem, '.mode-selector__item');
        for (const elem of modeElements) {
            const tagName = await prop(elem, 'tagName');
            let text = await prop(elem, 'textContent');
            text = text.trim().toLowerCase();

            assert(availModes.includes(text), `Unknown mode ${text}`);

            const modeItem = {
                elem,
                isActive: (tagName === 'B'),
            };

            if (text === 'classic') {
                res.listMode = modeItem;
            } else if (text === 'details') {
                res.detailsMode = modeItem;
            }
        }

        assert(
            res.listMode.elem
            && res.detailsMode.elem,
            'Unexpected stucture of mode selector control',
        );
        assert(res.listMode.isActive !== res.detailsMode.isActive, 'Invalid state of mode selector');

        res.details = res.detailsMode.isActive;

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
