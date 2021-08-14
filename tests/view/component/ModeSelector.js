import { TestComponent } from 'jezve-test';

export class ModeSelector extends TestComponent {
    async parse() {
        if (!await this.hasClass(this.elem, 'mode-selector')) {
            throw new Error('Unexpected stucture of mode selector control');
        }

        this.listMode = {};
        this.detailsMode = {};

        const modeElements = await this.queryAll(this.elem, '.mode-selector__item');
        for (const elem of modeElements) {
            const tagName = await this.prop(elem, 'tagName');
            let text = await this.prop(elem, 'textContent');
            text = text.trim().toLowerCase();

            let modeItem;
            if (text === 'classic') {
                modeItem = this.listMode;
            } else if (text === 'details') {
                modeItem = this.detailsMode;
            } else {
                throw new Error(`Unknown mode ${text}`);
            }

            modeItem.elem = elem;
            modeItem.isActive = (tagName === 'B');
        }

        if (
            (this.listMode.elem && !this.detailsMode.elem)
            || (!this.listMode.elem && this.detailsMode.elem)
        ) {
            throw new Error('Unexpected stucture of mode selector control');
        }

        if ((this.listMode.elem && this.detailsMode.elem)
            && (
                (this.listMode.isActive && this.detailsMode.isActive)
                || (!this.listMode.isActive && !this.detailsMode.isActive)
            )
        ) {
            throw new Error('Invalid state of mode selector');
        }

        this.details = this.detailsMode.isActive;
    }

    async setDetailsMode() {
        if (!this.detailsMode.elem) {
            throw new Error('Mode selector component is inactive');
        }

        if (this.detailsMode.isActive) {
            return;
        }

        await this.detailsMode.elem.click();
    }

    async setClassicMode() {
        if (!this.listMode.elem) {
            throw new Error('Mode selector component is inactive');
        }

        if (this.listMode.isActive) {
            return;
        }

        await this.listMode.elem.click();
    }
}
