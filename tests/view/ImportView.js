import {
    assert,
    query,
    prop,
    attr,
    click,
    wait,
    waitForFunction,
    copyObject,
} from 'jezve-test';
import { DropDown, Checkbox } from 'jezvejs/tests';
import { AppView } from './AppView.js';
import { IconLink } from './component/IconLink.js';
import { ImportList } from './component/Import/ImportList.js';
import { ImportUploadDialog } from './component/Import/ImportUploadDialog.js';
import { ImportRulesDialog } from './component/Import/ImportRulesDialog.js';
import { ImportViewSubmitError } from '../error/ImportViewSubmitError.js';
import { findSimilarTransaction } from '../model/import.js';
import { App } from '../Application.js';

/** Import view class */
export class ImportView extends AppView {
    constructor(...args) {
        super(...args);

        this.uploadPopupId = '#fileupload_popup';
        this.rulesPopupId = '#rules_popup';
    }

    async parseContent() {
        const res = {
            title: { elem: await query('.content_wrap > .heading > h1') },
            uploadBtn: await IconLink.create(this, await query('#uploadBtn')),
            notAvailMsg: { elem: await query('#notavailmsg') },
            addBtn: await IconLink.create(this, await query('#newItemBtn')),
            clearBtn: await IconLink.create(this, await query('#clearFormBtn')),
            totalCount: { elem: await query('#trcount') },
            enabledCount: { elem: await query('#entrcount') },
            rulesCheck: await Checkbox.create(this, await query('#rulesCheck')),
            rulesBtn: { elem: await query('#rulesBtn') },
            rulesCount: { elem: await query('#rulescount') },
            submitBtn: { elem: await query('#submitbtn') },
            submitProgress: { elem: await query('.content_wrap > .loading-indicator') },
        };

        assert(
            res.title.elem
            && res.uploadBtn.elem
            && res.addBtn.elem
            && res.clearBtn.elem
            && res.totalCount.elem
            && res.enabledCount.elem
            && res.rulesCheck.elem
            && res.rulesBtn.elem
            && res.rulesCount.elem
            && res.submitBtn.elem
            && res.submitProgress.elem,
            'Invalid structure of import view',
        );

        const importEnabled = !res.notAvailMsg.elem;

        res.title.value = await prop(res.title.elem, 'textContent');

        const disabledAttr = await attr(res.uploadBtn.elem, 'disabled');
        res.uploadBtn.content.disabled = disabledAttr != null;
        res.totalCount.value = await prop(res.totalCount.elem, 'textContent');
        res.enabledCount.value = await prop(res.enabledCount.elem, 'textContent');
        res.rulesCount.value = await prop(res.rulesCount.elem, 'textContent');
        res.submitBtn.disabled = await prop(res.submitBtn.elem, 'disabled');

        if (importEnabled) {
            res.mainAccountSelect = await DropDown.createFromChild(this, await query('#acc_id'));
            assert(res.mainAccountSelect, 'Invalid structure of import view');
        }

        const rowsContainer = await query('#rowsContainer');
        res.renderTime = await prop(rowsContainer, 'dataset.time');

        if (importEnabled) {
            const mainAccountId = res.mainAccountSelect.content.value;
            res.itemsList = await ImportList.create(this, rowsContainer, mainAccountId);
            assert(res.itemsList, 'Invalid structure of import view');
        }

        const uploadDialogPopup = await query(this.uploadPopupId);
        res.uploadDialog = await ImportUploadDialog.create(this, uploadDialogPopup);

        const rulesDialogPopup = await query(this.rulesPopupId);
        res.rulesDialog = await ImportRulesDialog.create(this, rulesDialogPopup);

        return res;
    }

    async buildModel(cont) {
        const res = {
            enabled: !cont.notAvailMsg.visible,
        };

        const uploadVisible = !!cont.uploadDialog?.content?.visible;
        const rulesVisible = !!cont.rulesDialog?.content?.visible;
        if (!res.enabled) {
            res.state = 'notavailable';
        } else if (uploadVisible && !rulesVisible) {
            res.state = 'upload';
        } else if (!uploadVisible && rulesVisible) {
            res.state = 'rules';
        } else if (!uploadVisible && !rulesVisible) {
            res.state = 'main';
        } else {
            throw new Error('Invalid state of import view');
        }

        res.title = cont.title.value;
        res.totalCount = (res.enabled) ? parseInt(cont.totalCount.value, 10) : 0;
        res.enabledCount = (res.enabled) ? parseInt(cont.enabledCount.value, 10) : 0;
        res.mainAccount = (res.enabled) ? parseInt(cont.mainAccountSelect.content.value, 10) : 0;
        res.rulesEnabled = cont.rulesCheck.checked;
        res.rulesCount = (res.enabled) ? parseInt(cont.rulesCount.value, 10) : 0;
        res.renderTime = cont.renderTime;
        res.items = (cont.itemsList) ? cont.itemsList.getItems() : [];
        res.invalidated = (cont.itemsList) ? cont.itemsList.model.invalidated : false;
        res.submitInProgress = cont.submitProgress.visible;

        return res;
    }

    getExpectedState(model) {
        const res = {
            notAvailMsg: { visible: !model.enabled },
            addBtn: { visible: model.enabled },
            clearBtn: { visible: model.enabled },
            uploadBtn: { visible: true, disabled: !model.enabled },
            title: { value: model.title.toString(), visible: true },
            totalCount: { value: model.totalCount.toString(), visible: model.enabled },
            enabledCount: { value: model.enabledCount.toString(), visible: model.enabled },
            rulesCheck: { checked: model.rulesEnabled, visible: model.enabled },
            rulesCount: { value: model.rulesCount.toString(), visible: model.enabled },
            submitBtn: { visible: model.enabled },
        };

        if (model.enabled) {
            res.mainAccountSelect = { value: model.mainAccount.toString(), visible: true };
            res.itemsList = { visible: true };
            res.submitBtn.disabled = !model.items.some((item) => item.enabled);
        }

        return res;
    }

    isRulesEnabled() {
        return this.model.rulesEnabled;
    }

    isRulesState() {
        return this.model.state === 'rules';
    }

    assertStateId(state) {
        assert(this.model.state === state, 'Invalid state of import view');
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

    async enableRules(value) {
        this.checkMainState();

        assert(
            value !== this.isRulesEnabled(),
            value ? 'Rules already enabled' : 'Result already disabled',
        );
        await this.performAction(() => this.content.rulesCheck.toggle());
    }

    async launchUploadDialog() {
        this.checkMainState();

        this.expectedState = this.getExpectedState(this.model);
        this.expectedState.uploadDialog = {
            visible: true,
            initialAccount: { value: this.model.mainAccount.toString() },
        };

        await this.performAction(() => this.content.uploadBtn.click());
        await this.performAction(() => wait(this.uploadPopupId, { visible: true }));

        return this.checkState();
    }

    async closeUploadDialog() {
        this.checkUploadState();

        await this.performAction(() => this.content.uploadDialog.close());
        await this.performAction(() => wait(this.uploadPopupId, { hidden: true }));

        assert(!this.content.uploadDialog?.content?.visible, 'File upload dialog not closed');
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

        this.model.mainAccount = parseInt(val, 10);
        this.expectedState = this.getExpectedState(this.model);

        this.expectedState.itemsList = {};
        this.expectedState.itemsList.items = this.content.itemsList.content.items.map(
            (item) => {
                const model = item.onChangeMainAccount(item.model, val);
                return copyObject(item.getExpectedState(model));
            },
        );

        await this.performAction(() => this.content.uploadDialog.selectAccount(val));

        return this.checkState();
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

    /** Run action and wait until list finish to load */
    async waitForList(action) {
        const prevTime = this.model.renderTime;

        await action.call(this);

        await waitForFunction(async () => {
            await this.parse();
            return (
                !this.content.itemsList.model.isLoading
                && prevTime !== this.content.renderTime
            );
        });
    }

    /** Submit converted file data */
    async submitUploaded(importData) {
        this.checkUploadState();

        const expectedUpload = this.content.uploadDialog.getExpectedUploadResult(importData);
        const isValid = expectedUpload != null;
        if (isValid) {
            // Apply rules if enabled
            if (this.isRulesEnabled()) {
                for (const item of expectedUpload) {
                    App.state.rules.applyTo(item);
                }
            }

            // Disable transactions similar to already existing
            const skipList = [];
            for (const item of expectedUpload) {
                const tr = findSimilarTransaction(item, skipList);
                if (tr) {
                    skipList.push(tr.id);
                    item.enabled = false;
                }
            }
        }

        // Prepare expected state of previously created import items
        const expectedList = this.content.itemsList.getExpectedState();
        // Append uploaded items if valid
        if (isValid) {
            const uploadedItems = ImportList.render(expectedUpload, App.state);
            expectedList.items = expectedList.items.concat(uploadedItems.items);

            this.model.items = this.model.items.concat(expectedUpload);
        }

        this.model.totalCount = expectedList.items.length;
        const enabledItems = expectedList.items.filter((item) => item.enabled);
        this.model.enabledCount = enabledItems.length;

        this.expectedState = this.getExpectedState(this.model);

        this.expectedState.itemsList = expectedList;
        this.expectedState.uploadDialog = { visible: !isValid };

        if (isValid) {
            await this.waitForList(async () => {
                await this.content.uploadDialog.submit();
                await wait(this.uploadPopupId, { hidden: true });
            });
        } else {
            await this.performAction(() => this.content.uploadDialog.submit());
        }

        return this.checkState();
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

        await this.waitForList(
            () => this.content.mainAccountSelect.selectItem(val),
        );
    }

    checkRulesFormState() {
        this.checkRulesState();
        assert(this.content.rulesDialog.isFormState(), 'Invalid state');
    }

    checkRulesListState() {
        this.checkRulesState();
        assert(this.content.rulesDialog.isListState(), 'Invalid state');
    }

    async launchRulesDialog() {
        this.checkMainState();

        await this.performAction(() => click(this.content.rulesBtn.elem));
        await this.performAction(() => wait(this.rulesPopupId, { visible: true }));

        this.checkRulesListState();

        return true;
    }

    async closeRulesDialog() {
        this.checkRulesState();

        await this.performAction(() => this.content.rulesDialog.close());
        await this.performAction(() => wait(this.rulesPopupId, { hidden: true }));

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

        const { ruleForm } = this.content.rulesDialog.content;
        await this.performAction(() => ruleForm.addCondition());

        return true;
    }

    async deleteRuleCondition(index) {
        this.checkRulesFormState();

        const { ruleForm } = this.content.rulesDialog.content;
        await this.performAction(() => ruleForm.deleteCondition(index));

        return true;
    }

    async runOnRuleCondition(index, action) {
        this.checkRulesFormState();

        const { ruleForm } = this.content.rulesDialog.content;
        await this.performAction(() => ruleForm.runOnCondition(index, action));

        return true;
    }

    getRuleConditions() {
        this.checkRulesFormState();

        const { ruleForm } = this.content.rulesDialog.content;
        return copyObject(ruleForm.model.conditions);
    }

    getRuleActions() {
        this.checkRulesFormState();

        const { ruleForm } = this.content.rulesDialog.content;
        return copyObject(ruleForm.model.actions);
    }

    async addRuleAction() {
        this.checkRulesFormState();

        const { ruleForm } = this.content.rulesDialog.content;
        await this.performAction(() => ruleForm.addAction());

        return true;
    }

    async deleteRuleAction(index) {
        this.checkRulesFormState();

        const { ruleForm } = this.content.rulesDialog.content;
        await this.performAction(() => ruleForm.deleteAction(index));

        return true;
    }

    async runOnRuleAction(index, action) {
        this.checkRulesFormState();

        const { ruleForm } = this.content.rulesDialog.content;
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

        const expectedList = this.content.itemsList.getExpectedState();
        const mainAccount = App.state.accounts.getItem(this.model.mainAccount);
        const expectedItem = {
            enabled: true,
            typeField: { value: 'expense', disabled: false },
            amountField: {
                value: '',
                disabled: false,
                dropDown: {
                    value: mainAccount.curr_id.toString(),
                    disabled: false,
                },
            },
            destAmountField: { value: '', disabled: true },
            destAccountField: { disabled: true },
            dateField: { value: App.dates.now, disabled: false },
            commentField: { value: '', disabled: false },
            personField: { disabled: true },
        };
        expectedList.items.push(expectedItem);

        this.model.totalCount += 1;
        this.model.enabledCount += 1;

        this.expectedState = this.getExpectedState(this.model);
        this.expectedState.itemsList = expectedList;
        this.expectedState.submitBtn.disabled = false;

        await this.performAction(() => this.content.addBtn.click());

        return this.checkState();
    }

    async deleteAllItems() {
        this.checkMainState();

        await this.performAction(() => this.content.clearBtn.click());
    }

    async enableItems(index, value) {
        this.checkMainState();

        assert(typeof index !== 'undefined', 'No items specified');

        const items = Array.isArray(index) ? index : [index];
        const enable = !!value;

        assert(this.content.itemsList, 'No items available');

        await this.performAction(async () => {
            for (const ind of items) {
                const item = this.content.itemsList.getItem(ind);
                assert(item.model.enabled !== enable, `Item ${ind} already ${enable ? 'enabled' : 'disabled'}`);

                await item.toggleEnable();
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

        assert(typeof index !== 'undefined', 'No items specified');

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

        const disabled = await prop(this.content.submitBtn.elem, 'disabled');
        if (disabled) {
            throw new ImportViewSubmitError('Submit is not available');
        }

        await this.performAction(() => click(this.content.submitBtn.elem));
        await waitForFunction(async () => {
            await this.parse();

            if (this.model.invalidated) {
                return true;
            }

            const notification = this.content.msgPopup?.content?.visible;
            if (notification && !this.model.submitInProgress) {
                return true;
            }

            return false;
        });
    }
}
