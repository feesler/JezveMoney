import { Component } from './component.js';

export class ImportUploadDialog extends Component {
    async parse() {
        if (!this.elem) {
            throw new Error('Invalid import upload dialog element');
        }

        this.fileNameElem = await this.query(this.elem, '.import-form__filename');
        this.templateSel = await this.query(this.elem, '#templateSel');
        this.initialAccountSel = await this.query(this.elem, '#initialAccount');
        this.isEncodeCheck = await this.query(this.elem, '#isEncodeCheck');
        this.submitBtn = await this.query(this.elem, '.btn.submit-btn');

        this.useServerCheck = await this.query('#useServerCheck');
        this.serverAddressBlock = await this.query('#serverAddressBlock');
        this.serverAddressInput = await this.query('#serverAddress');
        if (
            !this.fileNameElem
            || !this.templateSel
            || !this.initialAccountSel
            || !this.isEncodeCheck
            || !this.useServerCheck
            || !this.serverAddressBlock
            || !this.serverAddressInput
        ) {
            throw new Error('Failed to initialize extras of file upload dialog');
        }

        this.useServerAddress = await this.prop(this.useServerCheck, 'checked');
        this.encode = await this.prop(this.isEncodeCheck, 'checked');
    }

    async toggleServerAddress() {
        await this.click(this.useServerCheck);
        await this.parse();
    }

    async setFile(filename) {
        if (typeof filename !== 'string') {
            throw new Error('Invalid parameter');
        }

        if (!this.useServerAddress) {
            await this.toggleServerAddress();
        }

        await this.input(this.serverAddressInput, filename);
        await this.parse();
    }

    async selectTemplate(val) {
        await this.selectByValue(this.templateSel, val.toString());
        await this.parse();
    }

    async selectAccount(val) {
        await this.selectByValue(this.initialAccountSel, val.toString());
        await this.parse();
    }

    async selectEncoding(val) {
        if (this.encode === !!val) {
            return;
        }

        await this.click(this.isEncodeCheck);
        await this.parse();
    }

    async submit() {
        await this.parse();
        if (!this.submitBtn) {
            throw new Error('Invalid state of upload dialog');
        }

        await this.click(this.submitBtn);
    }
}
