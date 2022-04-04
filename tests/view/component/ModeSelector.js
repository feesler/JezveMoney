import { AppComponent } from './AppComponent.js';

export class ModeSelector extends AppComponent {
    async parseContent() {
        if (!await this.hasClass(this.elem, 'mode-selector')) {
            throw new Error('Unexpected stucture of mode selector control');
        }

        const res = {};

        res.listMode = {};
        res.detailsMode = {};

        const modeElements = await this.queryAll(this.elem, '.mode-selector__item');
        for (const elem of modeElements) {
            const tagName = await this.prop(elem, 'tagName');
            let text = await this.prop(elem, 'textContent');
            text = text.trim().toLowerCase();

            let modeItem;
            if (text === 'classic') {
                modeItem = res.listMode;
            } else if (text === 'details') {
                modeItem = res.detailsMode;
            } else {
                throw new Error(`Unknown mode ${text}`);
            }

            modeItem.elem = elem;
            modeItem.isActive = (tagName === 'B');
        }

        if (
            (res.listMode.elem && !res.detailsMode.elem)
            || (!res.listMode.elem && res.detailsMode.elem)
        ) {
            throw new Error('Unexpected stucture of mode selector control');
        }

        if ((res.listMode.elem && res.detailsMode.elem)
            && (
                (res.listMode.isActive && res.detailsMode.isActive)
                || (!res.listMode.isActive && !res.detailsMode.isActive)
            )
        ) {
            throw new Error('Invalid state of mode selector');
        }

        res.details = res.detailsMode.isActive;

        return res;
    }

    async setDetailsMode() {
        if (!this.content.detailsMode.elem) {
            throw new Error('Mode selector component is inactive');
        }

        if (this.content.detailsMode.isActive) {
            return;
        }

        await this.content.detailsMode.elem.click();
    }

    async setClassicMode() {
        if (!this.content.listMode.elem) {
            throw new Error('Mode selector component is inactive');
        }

        if (this.content.listMode.isActive) {
            return;
        }

        await this.content.listMode.elem.click();
    }
}
