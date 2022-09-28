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
import { findSimilarTransaction } from '../model/import.js';
import { App } from '../Application.js';
import { ImportTransactionItem } from './component/Import/ImportTransactionItem.js';

/** Import view class */
export class ImportView extends AppView {
    constructor(...args) {
        super(...args);

        this.uploadPopupId = '#fileupload_popup';
        this.rulesPopupId = '#rules_popup';
        this.originalItemData = null;
    }

    async parseContent() {
        const res = {
            title: { elem: await query('.content_wrap > .heading > h1') },
            uploadBtn: await IconLink.create(this, await query('#uploadBtn')),
            actionsMenuBtn: { elem: await query('#toggleActionsMenuBtn') },
            actionsList: { elem: await query('#actionsList') },
            notAvailMsg: { elem: await query('#notavailmsg') },
            addBtn: await IconLink.create(this, await query('#newItemBtn')),
            clearBtn: await IconLink.create(this, await query('#clearFormBtn')),
            totalCount: { elem: await query('#trcount') },
            enabledCount: { elem: await query('#entrcount') },
            rulesCheck: await Checkbox.create(this, await query('#rulesCheck')),
            rulesBtn: { elem: await query('#rulesBtn') },
            submitBtn: { elem: await query('#submitbtn') },
            submitProgress: { elem: await query('.content_wrap > .loading-indicator') },
        };

        assert(
            res.title.elem
            && res.uploadBtn.elem
            && res.actionsMenuBtn.elem
            && res.actionsList.elem
            && res.clearBtn.elem
            && res.totalCount.elem
            && res.enabledCount.elem
            && res.rulesCheck.elem
            && res.rulesBtn.elem
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
            menuOpen: cont.actionsList.visible,
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
        res.renderTime = cont.renderTime;
        res.items = (cont.itemsList) ? cont.itemsList.getItems() : [];
        res.invalidated = (cont.itemsList) ? cont.itemsList.model.invalidated : false;
        res.submitInProgress = cont.submitProgress.visible;

        return res;
    }

    getExpectedState(model = this.model) {
        const showMenuItems = model.enabled && model.menuOpen;
        const res = {
            notAvailMsg: { visible: !model.enabled },
            addBtn: { visible: showMenuItems },
            clearBtn: { visible: showMenuItems },
            uploadBtn: { visible: true, disabled: !model.enabled },
            title: { value: model.title.toString(), visible: true },
            totalCount: { value: model.totalCount.toString(), visible: model.enabled },
            enabledCount: { value: model.enabledCount.toString(), visible: model.enabled },
            rulesCheck: { checked: model.rulesEnabled, visible: showMenuItems },
            rulesBtn: { visible: showMenuItems },
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
        assert(this.model.state === state, `Invalid state of import view: ${this.model.state}. ${state} is expected`);
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

    async openActionsMenu() {
        if (this.model.menuOpen) {
            return true;
        }

        this.model.menuOpen = true;
        this.expectedState = this.getExpectedState();
        await this.performAction(() => click(this.content.actionsMenuBtn.elem));

        return this.checkState();
    }

    async enableRules(value) {
        this.checkMainState();
        assert(
            value !== this.isRulesEnabled(),
            value ? 'Rules already enabled' : 'Result already disabled',
        );
        await this.openActionsMenu();
        await this.performAction(() => this.content.rulesCheck.toggle());
    }

    async launchUploadDialog() {
        this.checkMainState();

        this.expectedState = this.getExpectedState();
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

        this.expectedState = this.getExpectedState();
        this.expectedState.uploadDialog = { visible: false };

        await this.performAction(() => this.content.uploadDialog.close());
        await this.performAction(() => wait(this.uploadPopupId, { hidden: true }));

        return this.checkState();
    }

    async setUploadFile(name, data) {
        this.checkUploadState();

        this.uploadFilename = name;
        this.fileData = data;

        await this.performAction(() => this.content.uploadDialog.setFile(name));
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
        this.expectedState = this.getExpectedState();

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

    async inputTemplateFirstRow(val) {
        this.checkUploadState();

        await this.performAction(() => this.content.uploadDialog.inputTemplateFirstRow(val));
    }

    async decreaseTemplateFirstRow(val) {
        this.checkUploadState();

        await this.performAction(() => this.content.uploadDialog.decreaseTemplateFirstRow(val));
    }

    async increaseTemplateFirstRow(val) {
        this.checkUploadState();

        await this.performAction(() => this.content.uploadDialog.increaseTemplateFirstRow(val));
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

        this.expectedState = this.getExpectedState();

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
        await this.openActionsMenu();

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

    async inputRulesSearch(value) {
        this.checkRulesListState();

        await this.performAction(() => this.content.rulesDialog.inputSearch(value));
        return true;
    }

    async clearRulesSearch() {
        this.checkRulesListState();

        await this.performAction(() => this.content.rulesDialog.clearSearch());
        return true;
    }

    async iterateRulesList() {
        this.checkRulesListState();

        await this.performAction(() => this.content.rulesDialog.iteratePages());
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

        this.expectedState = this.getExpectedState();

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

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.rulesDialog.submitRule());

        return this.checkState();
    }

    async cancelRule() {
        this.checkRulesFormState();

        this.expectedState = this.getExpectedState();

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

    /**
     * Validate current form if active
     * If invalid form expected, then run action and check expected state
     * @param {Function} action
     * @returns form validation result
     */
    async validateSaveForm(action) {
        const { formIndex } = this.content.itemsList.model;
        if (formIndex === -1) {
            return true;
        }

        const form = this.content.itemsList.getItem(formIndex);
        const expectedTransaction = form.getExpectedTransaction(form.model);
        const isValid = App.state.checkTransactionCorrectness(expectedTransaction);
        if (isValid) {
            return true;
        }

        form.model.invalidated = true;
        this.model.menuOpen = false;
        const expected = this.getExpectedState();
        const itemsExpected = this.content.itemsList.getExpectedState();

        this.expectedState = {
            ...expected,
            itemsList: {
                ...expected.itemsList,
                ...itemsExpected,
            },
        };

        await action();

        this.checkState();

        return false;
    }

    async addItem() {
        this.checkMainState();
        await this.openActionsMenu();

        const addAction = () => this.performAction(() => this.content.addBtn.click());
        const isValid = await this.validateSaveForm(addAction);
        if (!isValid) {
            return true;
        }

        const { formIndex } = this.content.itemsList.model;
        const mainAccount = App.state.accounts.getItem(this.model.mainAccount);

        if (formIndex !== -1) {
            const currentForm = this.content.itemsList.getItem(formIndex);
            currentForm.model.isForm = false;
        }

        const expectedList = this.content.itemsList.getExpectedState();
        const expectedItem = {
            isForm: true,
            enabled: true,
            typeField: { value: 'expense', disabled: false },
            srcAmountField: { value: '', disabled: true },
            destAmountField: {
                value: '',
                disabled: false,
                dropDown: {
                    value: mainAccount.curr_id.toString(),
                    disabled: false,
                },
            },
            transferAccountField: { disabled: true },
            dateField: { value: App.dates.now, disabled: false },
            commentField: { value: '', disabled: false },
            personField: { disabled: true },
        };
        expectedList.items.push(expectedItem);

        this.model.totalCount += 1;
        this.model.enabledCount += 1;
        this.model.menuOpen = false;

        this.expectedState = this.getExpectedState();
        this.expectedState.itemsList.items = expectedList.items;
        this.expectedState.submitBtn.disabled = false;
        this.originalItemData = null;

        await addAction();

        return this.checkState();
    }

    async updateItemByPos(pos) {
        this.checkMainState();

        const item = this.content.itemsList.getItem(pos);
        if (item.content.isForm) {
            return true;
        }
        // Get current form
        const { formIndex } = this.content.itemsList.model;
        const updateAction = () => this.runItemAction(pos, { action: 'clickUpdate' });

        const isValid = await this.validateSaveForm(updateAction);
        if (!isValid) {
            return true;
        }

        if (formIndex !== -1) {
            const currentForm = this.content.itemsList.getItem(formIndex);
            currentForm.model.isForm = false;
        }

        const newForm = this.content.itemsList.getItem(pos);

        this.originalItemData = newForm.getExpectedTransaction();
        this.originalItemData.type = newForm.model.type;
        this.originalItemData.enabled = newForm.model.enabled;
        const mainAccount = App.state.accounts.getItem(this.model.mainAccount);
        this.originalItemData.mainAccount = mainAccount;

        newForm.model.isForm = true;
        this.expectedState = {
            itemsList: this.content.itemsList.getExpectedState(),
        };

        await updateAction();

        return this.checkState();
    }

    async saveItem() {
        this.checkMainState();

        const { formIndex } = this.content.itemsList.model;
        assert(formIndex !== -1, 'Invalid state: import transaction form not available');

        const saveAction = () => this.runItemAction(formIndex, { action: 'clickSave' });

        const isValid = await this.validateSaveForm(saveAction);
        if (!isValid) {
            return true;
        }

        const currentForm = this.content.itemsList.getItem(formIndex);
        currentForm.model.isForm = false;

        this.expectedState = {
            itemsList: this.content.itemsList.getExpectedState(),
        };

        await saveAction();

        return this.checkState();
    }

    async cancelItem() {
        this.checkMainState();

        const { formIndex } = this.content.itemsList.model;
        assert(formIndex !== -1, 'Invalid state: import transaction form not available');

        const cancelAction = () => this.runItemAction(formIndex, { action: 'clickCancel' });

        const isValid = await this.validateSaveForm(cancelAction);
        if (!isValid) {
            return true;
        }

        const expectedList = this.content.itemsList.getExpectedState();
        if (this.originalItemData) {
            const expectedItem = ImportTransactionItem.render(this.originalItemData, App.state);
            expectedList.items[formIndex] = expectedItem;
        } else {
            this.model.totalCount -= 1;

            const currentForm = this.content.itemsList.getItem(formIndex);
            if (currentForm.model.enabled) {
                this.model.enabledCount += 1;
            }
        }

        this.expectedState = this.getExpectedState();
        this.expectedState.itemsList.items = expectedList.items;
        this.originalItemData = null;

        await cancelAction();

        return this.checkState();
    }

    async deleteAllItems() {
        this.checkMainState();
        await this.openActionsMenu();

        this.originalItemData = null;

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

        const { formIndex } = this.content.itemsList.model;

        const items = Array.isArray(index) ? index : [index];
        items.sort();
        if (items.includes(formIndex)) {
            this.originalItemData = null;
        }

        let removed = 0;
        for (const ind of items) {
            await this.runItemAction(ind - removed, { action: 'clickDelete' });
            removed += 1;
        }
    }

    async submit() {
        this.checkMainState();

        const enabledItems = this.content.itemsList.getEnabledItems();
        const disabled = await prop(this.content.submitBtn.elem, 'disabled');
        assert(disabled === (enabledItems.length === 0), 'Submit is not available');
        if (disabled) {
            return true;
        }

        const submitAction = () => this.performAction(() => click(this.content.submitBtn.elem));
        const isValid = await this.validateSaveForm(submitAction);
        if (!isValid) {
            return true;
        }

        for (const item of enabledItems) {
            const expectedTransaction = item.getExpectedTransaction(item.model);
            const createRes = App.state.createTransaction(expectedTransaction);
            assert(createRes, 'Failed to create transaction');
        }

        await submitAction();

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

        this.expectedState = {
            msgPopup: {
                success: true,
                message: 'All transactions have been successfully imported',
            },
            itemsList: { items: [] },
        };

        await this.checkState();
        await this.closeNotification();
        return true;
    }
}
