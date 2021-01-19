import { TestView } from './testview.js';
import { IconLink } from './component/iconlink.js';
import { ImportList } from './component/importlist.js';
import { ImportUploadDialog } from './component/importuploaddialog.js';
import { ImportRulesDialog } from './component/importrulesdialog.js';
import { Component } from './component/component.js';
import { ImportViewSubmitError } from '../error/importviewsubmit.js';
import { copyObject } from '../common.js';

/** Import view class */
export class ImportView extends TestView {
    constructor(...args) {
        super(...args);

        this.uploadPopupId = '#fileupload_popup';
        this.rulesPopupId = '#rules_popup';
    }

    async parseContent() {
        const res = {
            title: { elem: await this.query('.content_wrap > .heading > h1') },
            uploadBtn: await IconLink.create(this, await this.query('#uploadBtn')),
            mainAccountSelect: { elem: await this.query('#acc_id') },
            addBtn: await IconLink.create(this, await this.query('#newItemBtn')),
            totalCount: { elem: await this.query('#trcount') },
            enabledCount: { elem: await this.query('#entrcount') },
            rulesCheck: { elem: await this.query('#rulesCheck') },
            rulesBtn: { elem: await this.query('#rulesBtn') },
            rulesCount: { elem: await this.query('#rulescount') },
            submitBtn: await this.query('#submitbtn'),
        };

        res.title.value = await this.prop(res.title.elem, 'textContent');
        const mainAccountId = await this.prop(res.mainAccountSelect.elem, 'value');
        res.mainAccountSelect.value = mainAccountId;
        res.totalCount.value = await this.prop(res.totalCount.elem, 'textContent');
        res.enabledCount.value = await this.prop(res.enabledCount.elem, 'textContent');

        if (
            !res.title.elem
            || !res.uploadBtn
            || !res.mainAccountSelect.elem
            || !res.addBtn
            || !res.totalCount.elem
            || !res.enabledCount.elem
            || !res.rulesCheck.elem
            || !res.rulesBtn.elem
            || !res.rulesCount.elem
            || !res.submitBtn
        ) {
            throw new Error('Invalid structure of import view');
        }

        res.rulesCheck.checked = await this.prop(res.rulesCheck.elem, 'checked');
        res.rulesCount.value = await this.prop(res.rulesCount.elem, 'textContent');

        const rowsContainer = await this.query('#rowsContainer');
        res.itemsList = await ImportList.create(this, rowsContainer, mainAccountId);
        if (!res.itemsList) {
            throw new Error('Invalid structure of import view');
        }

        const uploadDialogPopup = await this.query(this.uploadPopupId);
        res.uploadDialog = await ImportUploadDialog.create(this, uploadDialogPopup);

        const rulesDialogPopup = await this.query(this.rulesPopupId);
        res.rulesDialog = await ImportRulesDialog.create(this, rulesDialogPopup);

        return res;
    }

    async buildModel(cont) {
        const res = {};

        res.title = cont.title.value;
        res.totalCount = parseInt(cont.totalCount.value, 10);
        res.enabledCount = parseInt(cont.enabledCount.value, 10);
        res.mainAccount = parseInt(cont.mainAccountSelect.value, 10);
        res.rulesEnabled = cont.rulesCheck.checked;
        res.rulesCount = parseInt(cont.rulesCount.value, 10);
        res.items = cont.itemsList.getItems();

        return res;
    }

    getExpectedState(model) {
        const res = {
            visibility: {
                uploadBtn: true,
                mainAccountSelect: true,
                addBtn: true,
                totalCount: true,
                enabledCount: true,
                rulesCount: true,
                itemsList: true,
            },
            values: {
                title: model.title.toString(),
                mainAccountSelect: model.mainAccount.toString(),
                totalCount: model.totalCount.toString(),
                enabledCount: model.enabledCount.toString(),
                rulesCheck: { checked: model.rulesEnabled },
                rulesCount: model.rulesCount.toString(),
            },
        };

        return res;
    }

    async launchUploadDialog() {
        await this.performAction(() => this.content.uploadBtn.click());
        await this.performAction(() => this.wait(this.uploadPopupId, { visible: true }));

        if (!await Component.isVisible(this.content.uploadDialog)) {
            throw new Error('File upload dialog not appear');
        }
    }

    async closeUploadDialog() {
        await this.performAction(() => this.content.uploadDialog.close());
        await this.performAction(() => this.wait(this.uploadPopupId, { visible: true }));

        if (await Component.isVisible(this.content.uploadDialog)) {
            throw new Error('File upload dialog not closed');
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
        await this.performAction(() => this.wait(this.uploadPopupId, { hidden: true }));
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

    async launchRulesDialog() {
        await this.performAction(() => this.click(this.content.rulesBtn.elem));
        await this.performAction(() => this.wait(this.rulesPopupId, { visible: true }));

        if (!await Component.isVisible(this.content.rulesDialog)) {
            throw new Error('Import rules dialog not appear');
        }

        return true;
    }

    async closeRulesDialog() {
        await this.performAction(() => this.content.rulesDialog.close());
        await this.performAction(() => this.wait(this.rulesPopupId, { hidden: true }));

        if (await Component.isVisible(this.content.rulesDialog)) {
            throw new Error('Import rules dialog not closed');
        }

        return true;
    }

    async createRule() {
        await this.performAction(() => this.content.rulesDialog.createRule());
        return true;
    }

    async updateRule(index) {
        await this.performAction(() => this.content.rulesDialog.updateRule(index));
        return true;
    }

    async deleteRule(index) {
        this.model.rulesCount -= 1;
        this.expectedState = this.getExpectedState(this.model);

        await this.performAction(() => this.content.rulesDialog.deleteRule(index));

        return this.checkState();
    }

    async addRuleCondition() {
        await this.performAction(() => this.content.rulesDialog.ruleForm.addCondition());
        return true;
    }

    async deleteRuleCondition(index) {
        const { ruleForm } = this.content.rulesDialog;
        await this.performAction(() => ruleForm.deleteCondition(index));
        return true;
    }

    async runOnRuleCondition(index, action) {
        const { ruleForm } = this.content.rulesDialog;
        await this.performAction(() => ruleForm.runOnCondition(index, action));
        return true;
    }

    getRuleConditions() {
        const res = copyObject(this.content.rulesDialog.ruleForm.model.conditions);
        return res;
    }

    getRuleActions() {
        const res = copyObject(this.content.rulesDialog.ruleForm.model.actions);
        return res;
    }

    async addRuleAction() {
        await this.performAction(() => this.content.rulesDialog.ruleForm.addAction());
        return true;
    }

    async deleteRuleAction(index) {
        const { ruleForm } = this.content.rulesDialog;
        await this.performAction(() => ruleForm.deleteAction(index));

        return true;
    }

    async runOnRuleAction(index, action) {
        const { ruleForm } = this.content.rulesDialog;
        await this.performAction(() => ruleForm.runOnAction(index, action));

        return true;
    }

    async submitRule() {
        const rulesState = this.getRulesState();
        if (rulesState === 'create') {
            this.model.rulesCount += 1;
        }
        this.expectedState = this.getExpectedState(this.model);

        await this.performAction(() => this.content.rulesDialog.submitRule());

        return this.checkState();
    }

    async cancelRule() {
        this.expectedState = this.getExpectedState(this.model);

        await this.performAction(() => this.content.rulesDialog.cancelRule());

        return this.checkState();
    }

    /** Return expected import rule object */
    getRulesState() {
        const { state, isUpdate } = this.content.rulesDialog.model;

        if (state === 'form') {
            return isUpdate ? 'update' : 'create';
        }

        return state;
    }

    /** Return expected import rule object */
    getExpectedRule() {
        return this.content.rulesDialog.getExpectedRule();
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
