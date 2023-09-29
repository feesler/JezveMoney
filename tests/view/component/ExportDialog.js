import {
    TestComponent,
    click,
    query,
    assert,
    asyncMap,
    evaluate,
    httpReq,
} from 'jezve-test';
import { Button, DropDown } from 'jezvejs-test';
import { __, getAcceptLanguageHeader } from '../../model/locale.js';

const selectComponents = {
    fileFormatSelect: '.file-format-select',
    dateLocaleSelect: '.date-locale-select',
    numberLocaleSelect: '.number-locale-select',
};

/**
 * Export dialog component
 */
export class ExportDialog extends TestComponent {
    static getExpectedState(model) {
        const res = {
            title: __('export.dialogTitle'),
            fileFormatSelect: {
                visible: true,
                value: model.fileFormat,
            },
            dateLocaleSelect: {
                visible: true,
                value: model.dateLocale,
            },
            numberLocaleSelect: {
                visible: true,
                value: model.numberLocale,
            },
            downloadBtn: {
                visible: true,
                title: __('export.download'),
            },
        };

        return res;
    }

    async parseContent() {
        const res = {
            closeBtn: { elem: await query(this.elem, '.popup__header .close-btn') },
            downloadBtn: await Button.create(this, await query(this.elem, '.download-btn')),
        };

        Object.keys(res).forEach((child) => (
            assert(res[child]?.elem, `Invalid structure of dialog: ${child} component not found`)
        ));

        [res.title] = await evaluate((el) => ([
            el?.querySelector('.popup__title')?.textContent,
        ]), this.elem);

        await asyncMap(Object.entries(selectComponents), async ([name, selector]) => {
            res[name] = await DropDown.create(this, await query(this.elem, selector));
            assert(res[name], `Component '${name}' not found`);
        });

        return res;
    }

    get fileFormatSelect() {
        return this.content.fileFormatSelect;
    }

    get dateLocaleSelect() {
        return this.content.dateLocaleSelect;
    }

    get numberLocaleSelect() {
        return this.content.numberLocaleSelect;
    }

    get downloadBtn() {
        return this.content.downloadBtn;
    }

    get closeBtn() {
        return this.content.closeBtn;
    }

    buildModel(cont) {
        return {
            fileFormat: cont.fileFormatSelect?.value,
            dateLocale: cont.dateLocaleSelect?.value,
            numberLocale: cont.numberLocaleSelect?.value,
        };
    }

    getExpectedState(model = this.model) {
        return ExportDialog.getExpectedState(model);
    }

    async selectFileFormat(value) {
        this.model.fileFormat = value;
        const expected = this.getExpectedState();

        await this.performAction(() => this.fileFormatSelect.setSelection(value));

        return this.checkState(expected);
    }

    async selectDateLocale(value) {
        this.model.dateLocale = value;
        const expected = this.getExpectedState();

        await this.performAction(() => this.dateLocaleSelect.setSelection(value));

        return this.checkState(expected);
    }

    async selectNumberLocale(value) {
        this.model.numberLocale = value;
        const expected = this.getExpectedState();

        await this.performAction(() => this.numberLocaleSelect.setSelection(value));

        return this.checkState(expected);
    }

    async download() {
        assert(this.downloadBtn?.elem, 'Close button not found');

        const response = await httpReq(
            'GET',
            this.downloadBtn.link,
            null,
            {
                'Accept-Language': getAcceptLanguageHeader(),
            },
        );
        assert(response?.status === 200, 'Invalid response');

        return response.body;
    }

    async close() {
        assert(this.closeBtn.elem, 'Close button not found');
        return click(this.closeBtn.elem);
    }
}
