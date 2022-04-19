import { copyObject } from 'jezve-test';
import { AppComponent } from '../AppComponent.js';
import { ImportRuleForm } from './ImportRuleForm.js';
import { ImportRuleItem } from './ImportRuleItem.js';
import { asyncMap } from '../../../common.js';
import { WarningPopup } from '../WarningPopup.js';
import { App } from '../../../Application.js';
import {
    query,
    queryAll,
    prop,
    click,
    isVisible,
    wait,
    waitForFunction,
} from '../../../env.js';

/* eslint-disable no-bitwise */

export class ImportRulesDialog extends AppComponent {
    async parseContent() {
        if (!this.elem) {
            throw new Error('Invalid import rules dialog element');
        }

        const res = {
            closeBtn: await query(this.elem, '.close-btn'),
            header: {
                elem: await query('.rules-header'),
                labelElem: await query('.rules-header label'),
                createBtn: await query('#createRuleBtn'),
            },
            loadingIndicator: { elem: await query(this.elem, '.rules-dialog__loading') },
            rulesList: { elem: await query(this.elem, '.rules-list') },
        };

        if (
            !res.closeBtn
            || !res.header.elem
            || !res.header.labelElem
            || !res.header.createBtn
            || !res.loadingIndicator.elem
            || !res.rulesList.elem
        ) {
            throw new Error('Failed to initialize import rules dialog');
        }

        res.rulesList.renderTime = await prop(res.rulesList.elem, 'dataset.time');
        res.header.title = await prop(res.header.labelElem, 'textContent');

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
        res.rules = cont.items.map((item) => copyObject(item.model));

        const isListState = cont.rulesList.visible && cont.header.title === 'Import rules';
        if (isListState) {
            res.state = 'list';
        } else {
            const isUpdate = (cont.header.title === 'Update import rule');
            res.state = (isUpdate) ? 'update' : 'create';
            if (cont.ruleForm) {
                res.rule = copyObject(cont.ruleForm.model);
            }
        }

        return res;
    }

    getExpectedState(model) {
        const isForm = this.isFormState(model);
        const res = {
            visibility: {
                rulesList: model.state === 'list',
                ruleForm: isForm,
            },
            values: {
                header: {},
            },
        };

        if (model.state === 'list') {
            res.values.header.title = 'Import rules';
            res.values.items = model.rules.map(
                (rule) => ImportRuleItem.getExpectedState(rule).values,
            );
        } else if (isForm) {
            res.values.header.title = (model.state === 'create')
                ? 'Create import rule'
                : 'Update import rule';

            res.values.ruleForm = ImportRuleForm.getExpectedState(model.rule).values;
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
        if (!this.isFormState()) {
            throw new Error('Invalid state');
        }

        return this.content.ruleForm.getExpectedRule();
    }

    /** Return validation result for expected import rule */
    isValidRule() {
        if (!this.isFormState()) {
            throw new Error('Invalid state');
        }

        return this.content.ruleForm.isValid();
    }

    async close() {
        await click(this.content.closeBtn);
    }

    async createRule() {
        if (!this.isListState()) {
            throw new Error('Invalid state');
        }

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
        if (Number.isNaN(ind) || ind < 0 || ind >= this.content.items.length) {
            throw new Error(`Invalid rule index: ${index}`);
        }

        if (!this.isListState()) {
            throw new Error('Invalid state');
        }

        this.model.state = 'update';
        const ruleItem = App.state.rules.getItemByIndex(ind);
        const ruleConditions = ruleItem.conditions.map((item) => ({
            fieldType: item.field_id,
            operator: item.operator,
            value: item.value,
            isFieldValue: (item.flags & 1) === 1,
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
        if (this.model.state !== 'list') {
            throw new Error('Invalid state');
        }

        const ind = parseInt(index, 10);
        if (Number.isNaN(ind) || ind < 0 || ind >= this.content.items.length) {
            throw new Error(`Invalid rule index: ${index}`);
        }

        this.model.rules.splice(ind, 1);
        this.expectedState = this.getExpectedState(this.model);

        await this.content.items[ind].clickDelete();
        await wait(this.content.ruleDeletePopupId, { visible: true });
        await this.parse();

        if (!await AppComponent.isVisible(this.content.delete_warning)) {
            throw new Error('Delete template warning popup not appear');
        }
        if (!this.content.delete_warning.content.okBtn) {
            throw new Error('OK button not found');
        }

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

        return this.checkState();
    }

    async submitRule() {
        if (!this.isFormState()) {
            throw new Error('Invalid state');
        }

        const valid = this.content.ruleForm.isValid();
        if (valid) {
            if (this.model.state === 'create') {
                this.model.rules.push(this.model.rule);
            } else {
                const index = this.model.rules.findIndex((rule) => rule.id === this.model.rule.id);
                if (index === -1) {
                    throw new Error('Invalid state');
                }
                this.model.rules[index] = this.model.rule;
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

        return this.checkState();
    }

    async cancelRule() {
        if (!this.isFormState()) {
            throw new Error('Invalid state');
        }

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
