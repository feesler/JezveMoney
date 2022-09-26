import {
    copyObject,
    TestComponent,
    assert,
    hasFlag,
    query,
    queryAll,
    prop,
    click,
    input,
    isVisible,
    wait,
    waitForFunction,
} from 'jezve-test';
import { IMPORT_COND_OP_FIELD_FLAG } from '../../../model/ImportCondition.js';
import { ImportRuleForm } from './ImportRuleForm.js';
import { ImportRuleItem } from './ImportRuleItem.js';
import { asyncMap } from '../../../common.js';
import { WarningPopup } from '../WarningPopup.js';
import { App } from '../../../Application.js';

export class ImportRulesDialog extends TestComponent {
    async parseContent() {
        assert(this.elem, 'Invalid import rules dialog element');

        const res = {
            closeBtn: await query(this.elem, '.close-btn'),
            header: {
                elem: await query(this.elem, '.rules-header'),
                labelElem: await query(this.elem, '.rules-header label'),
                createBtn: await query(this.elem, '.create-btn'),
            },
            loadingIndicator: { elem: await query(this.elem, '.loading-indicator') },
            searchField: { elem: await query(this.elem, '.search-field') },
            searchInp: { elem: await query(this.elem, '#searchInp') },
            clearSearchBtn: { elem: await query(this.elem, '#clearSearchBtn') },
            rulesList: { elem: await query(this.elem, '.rules-list') },
        };

        assert(
            res.closeBtn
            && res.header.elem
            && res.header.labelElem
            && res.header.createBtn
            && res.loadingIndicator.elem
            && res.searchField.elem
            && res.searchInp.elem
            && res.clearSearchBtn.elem
            && res.rulesList.elem,
            'Failed to initialize import rules dialog',
        );

        res.rulesList.renderTime = await prop(res.rulesList.elem, 'dataset.time');
        res.header.title = await prop(res.header.labelElem, 'textContent');

        res.searchInp.value = await prop(res.searchInp.elem, 'value');

        const listItems = await queryAll(res.rulesList.elem, '.rule-item');
        res.items = await asyncMap(
            listItems,
            (item) => ImportRuleItem.create(this.parent, item),
        );

        res.loadingIndicator.visible = await isVisible(res.loadingIndicator.elem, true);
        res.rulesList.visible = await isVisible(res.rulesList.elem, true);

        const ruleFormElem = await query(this.elem, '.rule-form');
        if (ruleFormElem) {
            res.ruleForm = await ImportRuleForm.create(this.parent, ruleFormElem);
        }

        res.ruleDeletePopupId = '#rule_delete_warning';
        const popupElem = await query(res.ruleDeletePopupId);
        res.delete_warning = await WarningPopup.create(this, popupElem);

        return res;
    }

    buildModel(cont) {
        const res = {};

        res.loading = cont.loadingIndicator.visible;
        res.renderTime = cont.rulesList.renderTime;
        res.filter = cont.searchInp.value;
        res.rules = cont.items.map((item) => copyObject(item.model));

        const isListState = cont.rulesList.visible && cont.header.title === 'Import rules';
        if (isListState) {
            res.state = 'list';
        } else {
            const isUpdate = (cont.header.title === 'Update import rule');
            res.state = (isUpdate) ? 'update' : 'create';
            if (cont.ruleForm) {
                res.rule = copyObject(cont.ruleForm.model);
                res.ruleItem = cont.ruleForm.getExpectedRule();
            }
        }

        return res;
    }

    getExpectedState(model) {
        const isForm = this.isFormState(model);
        const isList = this.isListState(model);
        const res = {
            header: {},
            searchField: { visible: isList },
            rulesList: { visible: isList },
        };

        if (isList) {
            res.header.title = 'Import rules';

            const filteredRules = (model.filter !== '')
                ? App.state.rules.filter((rule) => rule.isMatchFilter(model.filter))
                : App.state.rules.data;

            res.items = filteredRules.map((rule) => ImportRuleItem.render(rule));
        } else if (isForm) {
            res.header.title = (model.state === 'create')
                ? 'Create import rule'
                : 'Update import rule';

            res.ruleForm = ImportRuleForm.getExpectedState(model.rule);
        }

        return res;
    }

    getState(model = this.model) {
        return model.state;
    }

    isListState(model = this.model) {
        return (model.state === 'list');
    }

    isFormState(model = this.model) {
        return (model.state === 'create' || model.state === 'update');
    }

    /** Return expected import rule object */
    getExpectedRule() {
        assert(this.isFormState(), 'Invalid state');

        return this.content.ruleForm.getExpectedRule();
    }

    /** Return validation result for expected import rule */
    isValidRule() {
        assert(this.isFormState(), 'Invalid state');

        return this.content.ruleForm.isValid();
    }

    async close() {
        await click(this.content.closeBtn);
    }

    async inputSearch(value) {
        assert(this.isListState(), 'Invalid state');

        this.model.filter = value.toString();
        this.expectedState = this.getExpectedState(this.model);

        await this.performAction(() => input(this.content.searchInp.elem, value));

        return this.checkState();
    }

    async clearSearch() {
        assert(this.isListState(), 'Invalid state');

        this.model.filter = '';
        this.expectedState = this.getExpectedState(this.model);

        await this.performAction(() => click(this.content.clearSearchBtn.elem));

        return this.checkState();
    }

    async createRule() {
        assert(this.isListState(), 'Invalid state');

        this.model.state = 'create';
        this.model.rule = {
            conditions: [],
            actions: [],
        };
        this.expectedState = this.getExpectedState(this.model);

        await click(this.content.header.createBtn);
        await waitForFunction(async () => {
            await this.parse();
            return this.model.state === 'create';
        });

        return this.checkState();
    }

    async updateRule(index) {
        const ind = parseInt(index, 10);
        assert.arrayIndex(this.content.items, ind);

        assert(this.isListState(), 'Invalid state');

        this.model.state = 'update';
        const ruleItem = App.state.rules.getItemByIndex(ind);
        const ruleConditions = ruleItem.conditions.map((item) => ({
            fieldType: item.field_id,
            operator: item.operator,
            value: item.value,
            isFieldValue: hasFlag(item.flags, IMPORT_COND_OP_FIELD_FLAG),
        }));
        const ruleActions = ruleItem.actions.map((item) => ({
            actionType: item.action_id,
            value: item.value,
        }));
        this.model.rule = {
            id: ruleItem.id,
            conditions: ruleConditions,
            actions: ruleActions,
        };
        this.expectedState = this.getExpectedState(this.model);

        await this.content.items[ind].clickUpdate();
        await waitForFunction(async () => {
            await this.parse();
            return this.model.state === 'update';
        });

        return this.checkState();
    }

    async deleteRule(index) {
        assert(this.model.state === 'list', 'Invalid state');

        const ind = parseInt(index, 10);
        assert.arrayIndex(this.content.items, ind);

        const id = App.state.rules.indexToId(ind);
        App.state.deleteRules(id);

        this.expectedState = this.getExpectedState(this.model);

        await this.content.items[ind].clickDelete();
        await wait(this.content.ruleDeletePopupId, { visible: true });
        await this.parse();

        assert(this.content.delete_warning?.content?.visible, 'Delete template warning popup not appear');
        assert(this.content.delete_warning.content.okBtn, 'OK button not found');

        const prevTime = this.model.renderTime;

        await click(this.content.delete_warning.content.okBtn);
        await wait(this.content.ruleDeletePopupId, { hidden: true });
        await waitForFunction(async () => {
            await this.parse();
            return (
                !this.model.loading
                && this.isListState()
                && prevTime !== this.model.renderTime
            );
        });

        await App.state.fetchAndTest();
        return this.checkState();
    }

    async submitRule() {
        assert(this.isFormState(), 'Invalid state');

        const valid = this.content.ruleForm.isValid();
        if (valid) {
            if (this.model.state === 'create') {
                const createResult = App.state.createRule(this.model.ruleItem);
                assert(createResult, 'Failed to update import rule');
            } else {
                const updateResult = App.state.updateRule(this.model.ruleItem);
                assert(updateResult, 'Failed to update import rule');
            }
            this.model.state = 'list';
        }
        this.expectedState = this.getExpectedState(this.model);

        const prevTime = this.model.renderTime;

        await this.content.ruleForm.submit();
        await waitForFunction(async () => {
            await this.parse();
            return !valid || (
                !this.model.loading
                && this.model.renderTime !== prevTime
                && this.isListState()
            );
        });

        await App.state.fetchAndTest();
        return this.checkState();
    }

    async cancelRule() {
        assert(this.isFormState(), 'Invalid state');

        this.model.state = 'list';
        this.expectedState = this.getExpectedState(this.model);

        await this.content.ruleForm.cancel();
        await waitForFunction(async () => {
            await this.parse();
            return !this.model.loading && this.isListState();
        });

        return this.checkState();
    }
}
