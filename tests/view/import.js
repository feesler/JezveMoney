import { TestView } from './testview.js';
import { IconLink } from './component/iconlink.js';
import { ImportList } from './component/importlist.js';
import { ImportUploadDialog } from './component/importuploaddialog.js';
import { Component } from './component/component.js';
import { ImportViewSubmitError } from '../error/importviewsubmit.js';

/** Import view class */
export class ImportView extends TestView {
    async parseContent() {
        const res = {
            titleEl: await this.query('.content_wrap > .heading > h1'),
            uploadBtn: await IconLink.create(this, await this.query('#uploadBtn')),
            mainAccountSelect: { elem: await this.query('#acc_id') },
            addBtn: await IconLink.create(this, await this.query('#newItemBtn')),
            totalCountElem: { elem: await this.query('#trcount') },
            enabledCountElem: { elem: await this.query('#entrcount') },
            submitBtn: await this.query('#submitbtn'),
        };

        res.title = await this.prop(res.titleEl, 'textContent');
        res.mainAccount = await this.prop(res.mainAccountSelect.elem, 'value');
        res.totalCount = await this.prop(res.totalCountElem.elem, 'textContent');
        res.enabledCount = await this.prop(res.enabledCountElem.elem, 'textContent');

        if (
            !res.titleEl
            || !res.uploadBtn
            || !res.mainAccountSelect.elem
            || !res.addBtn
            || !res.totalCountElem.elem
            || !res.enabledCountElem.elem
            || !res.submitBtn
        ) {
            throw new Error('Invalid structure of import view');
        }

        res.itemsList = await ImportList.create(this, await this.query('#rowsContainer'), res.mainAccount);
        if (!res.itemsList) {
            throw new Error('Invalid structure of import view');
        }

        res.uploadDialog = await ImportUploadDialog.create(this, await this.query('#fileupload_popup'));

        return res;
    }

    async buildModel(cont) {
        const res = {};

        res.title = cont.title;
        res.totalCount = cont.totalCount;
        res.enabledCount = cont.enabledCount;
        res.mainAccount = cont.mainAccount;
        res.items = cont.itemsList.getItems();

        return res;
    }

    getExpectedState(model) {
        const res = {
            visibility: {
                uploadBtn: true,
                mainAccountSelect: true,
                addBtn: true,
                totalCountElem: true,
                enabledCountElem: true,
                itemsList: true,
            },
            values: {
                title: model.title,
                mainAccount: model.mainAccount,
                totalCount: model.totalCount,
                enabledCount: model.enabledCount,
            },
        };

        return res;
    }

    async launchUploadDialog() {
        await this.performAction(() => this.content.uploadBtn.click());

        await this.performAction(() => this.wait('#fileupload_popup', { visible: true }));

        if (!await Component.isVisible(this.content.uploadDialog)) {
            throw new Error('File upload dialog not appear');
        }
    }

    async setUploadFile(name, data) {
        this.uploadFilename = name;
        this.fileData = data;

        await this.performAction(() => this.content.uploadDialog.setFile(name, data));
    }

    async selectUploadTemplateById(val) {
        await this.performAction(() => this.content.uploadDialog.selectTemplateById(val));
    }

    async selectUploadTemplateByIndex(val) {
        await this.performAction(() => this.content.uploadDialog.selectTemplateByIndex(val));
    }

    async selectUploadAccount(val) {
        await this.performAction(() => this.content.uploadDialog.selectAccount(val));
    }

    async selectUploadEncoding(val) {
        await this.performAction(() => this.content.uploadDialog.selectEncoding(val));
    }

    /** Select file to upload */
    async upload() {
        await this.performAction(() => this.content.uploadDialog.upload());
    }

    async inputTemplateName(val) {
        await this.performAction(() => this.content.uploadDialog.inputTemplateName(val));
    }

    async selectTemplateColumn(name, index) {
        await this.performAction(() => this.content.uploadDialog.selectTemplateColumn(name, index));
    }

    /** Create new import template */
    async createTemplate() {
        await this.performAction(() => this.content.uploadDialog.createTemplate());
    }

    /** Update currently selected template */
    async updateTemplate() {
        await this.performAction(() => this.content.uploadDialog.updateTemplate());
    }

    /** Delete currently selected template */
    async deleteTemplate() {
        await this.performAction(() => this.content.uploadDialog.deleteTemplate());
    }

    /** Submit template */
    async submitTemplate() {
        await this.performAction(() => this.content.uploadDialog.submitTemplate());
    }

    /** Cancel create/update template */
    async cancelTemplate() {
        await this.performAction(() => this.content.uploadDialog.cancelTemplate());
    }

    /** Submit converted file data */
    async submitUploaded() {
        await this.performAction(() => this.content.uploadDialog.submit());
        await this.performAction(() => this.wait('#fileupload_popup', { hidden: true }));
    }

    /** Return current state of upload dialog */
    getUploadState() {
        return this.content.uploadDialog.getCurrentState();
    }

    /** Return expected template object */
    getExpectedTemplate() {
        return this.content.uploadDialog.getExpectedTemplate();
    }

    async isUploadState() {
        return Component.isVisible(this.content.uploadDialog);
    }

    async selectMainAccount(val) {
        await this.performAction(async () => {
            await this.selectByValue(this.content.mainAccountSelect.elem, val.toString());
            await this.onChange(this.content.mainAccountSelect.elem);
        });
    }

    async addItem() {
        await this.performAction(() => this.content.addBtn.click());
    }

    async enableItems(index, value) {
        if (typeof index === 'undefined') {
            throw new Error('No items specified');
        }

        const items = Array.isArray(index) ? index : [index];
        const enable = !!value;

        if (!this.content.itemsList) {
            throw new Error('No items available');
        }

        await this.performAction(async () => {
            for (const ind of items) {
                const item = this.content.itemsList.getItem(ind);
                if (item.model.enabled !== enable) {
                    await item.toggleEnable();
                } else {
                    throw new Error(`Item ${ind} already ${enable ? 'enabled' : 'disabled'}`);
                }
            }
        });
    }

    async runItemAction(index, { action, data }) {
        const item = this.content.itemsList.getItem(index);

        await this.performAction(() => item.runAction(action, data));

        return true;
    }

    async deleteItem(index) {
        if (typeof index === 'undefined') {
            throw new Error('No items specified');
        }

        const items = Array.isArray(index) ? index : [index];
        items.sort();
        let removed = 0;
        for (const ind of items) {
            await this.runItemAction(ind - removed, { action: 'clickDelete' });
            removed += 1;
        }
    }

    async submit() {
        const disabled = await this.prop(this.content.submitBtn, 'disabled');
        if (disabled) {
            throw new ImportViewSubmitError('Submit is not available');
        }

        await this.performAction(() => this.click(this.content.submitBtn));

        await this.performAction(() => this.wait('#notificationPopup', { visible: true }));
    }
}
