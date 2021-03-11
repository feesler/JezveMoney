import { TestView } from './testview.js';
import { IconLink } from './component/iconlink.js';
import { ImportList } from './component/importlist.js';
import { ImportUploadDialog } from './component/importuploaddialog.js';
import { ImportRulesDialog } from './component/importrulesdialog.js';
import { Component } from './component/component.js';
import { DropDown } from './component/dropdown.js';
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
            mainAccountSelect: await DropDown.createFromChild(this, await this.query('#acc_id')),
            addBtn: await IconLink.create(this, await this.query('#newItemBtn')),
            clearBtn: await IconLink.create(this, await this.query('#clearFormBtn')),
            totalCount: { elem: await this.query('#trcount') },
            enabledCount: { elem: await this.query('#entrcount') },
            rulesCheck: { elem: await this.query('#rulesCheck') },
            rulesBtn: { elem: await this.query('#rulesBtn') },
            rulesCount: { elem: await this.query('#rulescount') },
            submitBtn: await this.query('#submitbtn'),
        };

        res.title.value = await this.prop(res.title.elem, 'textContent');
        res.totalCount.value = await this.prop(res.totalCount.elem, 'textContent');
        res.enabledCount.value = await this.prop(res.enabledCount.elem, 'textContent');

        if (
            !res.title.elem
            || !res.uploadBtn
            || !res.mainAccountSelect
            || !res.addBtn
            || !res.clearBtn
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
        const mainAccountId = res.mainAccountSelect.value;
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

        const uploadVisible = await Component.isVisible(cont.uploadDialog);
        const rulesVisible = await Component.isVisible(cont.rulesDialog);
        if (uploadVisible && !rulesVisible) {
            res.state = 'upload';
        } else if (!uploadVisible && rulesVisible) {
            res.state = 'rules';
        } else if (!uploadVisible && !rulesVisible) {
            res.state = 'main';
        } else {
            throw new Error('Invalid state of import view');
        }

        res.title = cont.title.value;
        res.totalCount = parseInt(cont.totalCount.value, 10);
        res.enabledCount = parseInt(cont.enabledCount.value, 10);
        res.mainAccount = parseInt(cont.mainAccountSelect.value, 10);
        res.rulesEnabled = cont.rulesCheck.checked;
        res.rulesCount = parseInt(cont.rulesCount.value, 10);
        res.items = cont.itemsList.getItems();
        res.invalidated = cont.itemsList.invalidated;

        return res;
    }

    getExpectedState(model) {
        const res = {
            visibility: {
                uploadBtn: true,
                mainAccountSelect: true,
                addBtn: true,
                clearBtn: true,
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

    isRulesEnabled() {
        return this.model.rulesEnabled;
    }

    isRulesState() {
        return this.model.state === 'rules';
    }

    assertStateId(state) {
        if (this.model.state !== state) {
            throw new Error('Invalid state of import view');
        }
    }

    checkMainState() {
        this.assertStateId('main');
    }

    checkUploadState() {
        this.assertStateId('upload');
    }

    checkRulesState() {
        this.assertStateId('rules');
    }

    async launchUploadDialog() {
        this.checkMainState();

        await this.performAction(() => this.content.uploadBtn.click());
        await this.performAction(() => this.wait(this.uploadPopupId, { visible: true }));

        if (!await Component.isVisible(this.content.uploadDialog)) {
            throw new Error('File upload dialog not appear');
        }
    }

    async closeUploadDialog() {
        this.checkUploadState();

        await this.performAction(() => this.content.uploadDialog.close());
        await this.performAction(() => this.wait(this.uploadPopupId, { visible: true }));

        if (await Component.isVisible(this.content.uploadDialog)) {
            throw new Error('File upload dialog not closed');
        }
    }

    async setUploadFile(name, data) {
        this.checkUploadState();

        this.uploadFilename = name;
        this.fileData = data;

        await this.performAction(() => this.content.uploadDialog.setFile(name, data));
    }

    async selectUploadTemplateById(val) {
        this.checkUploadState();

        await this.performAction(() => this.content.uploadDialog.selectTemplateById(val));
    }

    async selectUploadTemplateByIndex(val) {
        this.checkUploadState();

        await this.performAction(() => this.content.uploadDialog.selectTemplateByIndex(val));
    }

    async selectUploadAccount(val) {
        this.checkUploadState();

        await this.performAction(() => this.content.uploadDialog.selectAccount(val));
    }

    async selectUploadEncoding(val) {
        this.checkUploadState();

        await this.performAction(() => this.content.uploadDialog.selectEncoding(val));
    }

    /** Select file to upload */
    async upload() {
        this.checkUploadState();

        await this.performAction(() => this.content.uploadDialog.upload());
    }

    async inputTemplateName(val) {
        this.checkUploadState();

        await this.performAction(() => this.content.uploadDialog.inputTemplateName(val));
    }

    async selectTemplateColumn(name, index) {
        this.checkUploadState();

        await this.performAction(() => this.content.uploadDialog.selectTemplateColumn(name, index));
    }

    /** Create new import template */
    async createTemplate() {
        this.checkUploadState();

        await this.performAction(() => this.content.uploadDialog.createTemplate());
    }

    /** Update currently selected template */
    async updateTemplate() {
        this.checkUploadState();

        await this.performAction(() => this.content.uploadDialog.updateTemplate());
    }

    /** Delete currently selected template */
    async deleteTemplate() {
        this.checkUploadState();

        await this.performAction(() => this.content.uploadDialog.deleteTemplate());
    }

    /** Submit template */
    async submitTemplate() {
        this.checkUploadState();

        await this.performAction(() => this.content.uploadDialog.submitTemplate());
    }

    /** Cancel create/update template */
    async cancelTemplate() {
        this.checkUploadState();

        await this.performAction(() => this.content.uploadDialog.cancelTemplate());
    }

    /** Submit converted file data */
    async submitUploaded() {
        this.checkUploadState();

        await this.performAction(() => this.content.uploadDialog.submit());
        await this.performAction(() => this.wait(this.uploadPopupId, { hidden: true }));
    }

    /** Return current state of upload dialog */
    getUploadState() {
        this.checkUploadState();

        return this.content.uploadDialog.getCurrentState();
    }

    /** Return expected template object */
    getExpectedTemplate() {
        this.checkUploadState();

        return this.content.uploadDialog.getExpectedTemplate();
    }

    async selectMainAccount(val) {
        this.checkMainState();

        await this.performAction(() => this.content.mainAccountSelect.selectItem(val));
    }

    checkRulesFormState() {
        this.checkRulesState();
        if (!this.content.rulesDialog.isFormState()) {
            throw new Error('Invalid state');
        }
    }

    checkRulesListState() {
        this.checkRulesState();
        if (!this.content.rulesDialog.isListState()) {
            throw new Error('Invalid state');
        }
    }

    async launchRulesDialog() {
        this.checkMainState();

        await this.performAction(() => this.click(this.content.rulesBtn.elem));
        await this.performAction(() => this.wait(this.rulesPopupId, { visible: true }));

        this.checkRulesListState();

        return true;
    }

    async closeRulesDialog() {
        this.checkRulesState();

        await this.performAction(() => this.content.rulesDialog.close());
        await this.performAction(() => this.wait(this.rulesPopupId, { hidden: true }));

        this.checkMainState();

        return true;
    }

    async createRule() {
        this.checkRulesListState();

        await this.performAction(() => this.content.rulesDialog.createRule());
        return true;
    }

    async updateRule(index) {
        this.checkRulesListState();

        await this.performAction(() => this.content.rulesDialog.updateRule(index));
        return true;
    }

    async deleteRule(index) {
        this.checkRulesListState();

        this.model.rulesCount -= 1;
        this.expectedState = this.getExpectedState(this.model);

        await this.performAction(() => this.content.rulesDialog.deleteRule(index));

        return this.checkState();
    }

    async addRuleCondition() {
        this.checkRulesFormState();

        const { ruleForm } = this.content.rulesDialog;
        await this.performAction(() => ruleForm.addCondition());

        return true;
    }

    async deleteRuleCondition(index) {
        this.checkRulesFormState();

        const { ruleForm } = this.content.rulesDialog;
        await this.performAction(() => ruleForm.deleteCondition(index));

        return true;
    }

    async runOnRuleCondition(index, action) {
        this.checkRulesFormState();

        const { ruleForm } = this.content.rulesDialog;
        await this.performAction(() => ruleForm.runOnCondition(index, action));

        return true;
    }

    getRuleConditions() {
        this.checkRulesFormState();

        const { ruleForm } = this.content.rulesDialog;
        return copyObject(ruleForm.model.conditions);
    }

    getRuleActions() {
        this.checkRulesFormState();

        const { ruleForm } = this.content.rulesDialog;
        return copyObject(ruleForm.model.actions);
    }

    async addRuleAction() {
        this.checkRulesFormState();

        const { ruleForm } = this.content.rulesDialog;
        await this.performAction(() => ruleForm.addAction());

        return true;
    }

    async deleteRuleAction(index) {
        this.checkRulesFormState();

        const { ruleForm } = this.content.rulesDialog;
        await this.performAction(() => ruleForm.deleteAction(index));

        return true;
    }

    async runOnRuleAction(index, action) {
        this.checkRulesFormState();

        const { ruleForm } = this.content.rulesDialog;
        await this.performAction(() => ruleForm.runOnAction(index, action));

        return true;
    }

    isValidRule() {
        this.checkRulesFormState();

        return this.content.rulesDialog.isValidRule();
    }

    async submitRule() {
        this.checkRulesFormState();

        if (this.isValidRule()) {
            const rulesState = this.getRulesState();
            if (rulesState === 'create') {
                this.model.rulesCount += 1;
            }
        }
        this.expectedState = this.getExpectedState(this.model);

        await this.performAction(() => this.content.rulesDialog.submitRule());

        return this.checkState();
    }

    async cancelRule() {
        this.checkRulesFormState();

        this.expectedState = this.getExpectedState(this.model);

        await this.performAction(() => this.content.rulesDialog.cancelRule());

        return this.checkState();
    }

    getRulesState() {
        this.checkRulesState();

        return this.content.rulesDialog.getState();
    }

    /** Return expected import rule object */
    getExpectedRule() {
        this.checkRulesState();

        return this.content.rulesDialog.getExpectedRule();
    }

    async addItem() {
        this.checkMainState();

        await this.performAction(() => this.content.addBtn.click());
    }

    async deleteAllItems() {
        this.checkMainState();

        await this.performAction(() => this.content.clearBtn.click());
    }

    async enableItems(index, value) {
        this.checkMainState();

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
        this.checkMainState();

        const item = this.content.itemsList.getItem(index);

        await this.performAction(() => item.runAction(action, data));

        return true;
    }

    async deleteItem(index) {
        this.checkMainState();

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
        this.checkMainState();

        const disabled = await this.prop(this.content.submitBtn, 'disabled');
        if (disabled) {
            throw new ImportViewSubmitError('Submit is not available');
        }

        await this.performAction(() => this.click(this.content.submitBtn));
        await this.waitForFunction(async () => {
            await this.parse();

            if (this.model.invalidated) {
                return true;
            }

            const notification = await Component.isVisible(this.msgPopup, true);
            if (notification) {
                return true;
            }

            return false;
        });
    }
}
