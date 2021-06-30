import { TestComponent, copyObject } from 'jezve-test';
import { ImportRuleForm } from './ImportRuleForm.js';
import { ImportRuleItem } from './ImportRuleItem.js';
import { asyncMap } from '../../../common.js';
import { WarningPopup } from '../WarningPopup.js';
import { App } from '../../../Application.js';

/* eslint-disable no-bitwise */

export class ImportRulesDialog extends TestComponent {
    async parse() {
        if (!this.elem) {
            throw new Error('Invalid import rules dialog element');
        }

        this.closeBtn = await this.query(this.elem, '.close-btn');

        this.header = {
            elem: await this.query('.rules-header'),
            labelElem: await this.query('.rules-header label'),
            createBtn: await this.query('#createRuleBtn'),
        };
        this.loadingIndicator = { elem: await this.query(this.elem, '.rules-dialog__loading') };
        this.rulesList = { elem: await this.query(this.elem, '.rules-list') };
        if (
            !this.closeBtn
            || !this.header.elem
            || !this.header.labelElem
            || !this.header.createBtn
            || !this.loadingIndicator.elem
            || !this.rulesList.elem
        ) {
            throw new Error('Failed to initialize import rules dialog');
        }

        this.rulesList.renderTime = await this.prop(this.rulesList.elem, 'dataset.time');
        this.header.title = await this.prop(this.header.labelElem, 'textContent');

        const listItems = await this.queryAll(this.rulesList.elem, '.rule-item');
        this.items = await asyncMap(
            listItems,
            (item) => ImportRuleItem.create(this.parent, item),
        );

        this.loadingIndicator.visible = await this.isVisible(this.loadingIndicator.elem, true);
        this.rulesList.visible = await this.isVisible(this.rulesList.elem, true);

        const ruleFormElem = await this.query(this.elem, '.rule-form');
        if (ruleFormElem) {
            this.ruleForm = await ImportRuleForm.create(this.parent, ruleFormElem);
        }

        this.ruleDeletePopupId = '#rule_delete_warning';
        const popupElem = await this.query(this.ruleDeletePopupId);
        this.delete_warning = await WarningPopup.create(this, popupElem);

        this.model = this.buildModel(this);
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

        return this.ruleForm.getExpectedRule();
    }

    /** Return validation result for expected import rule */
    isValidRule() {
        if (!this.isFormState()) {
            throw new Error('Invalid state');
        }

        return this.ruleForm.isValid();
    }

    async close() {
        await this.click(this.closeBtn);
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

        await this.click(this.header.createBtn);
        await this.waitForFunction(async () => {
            await this.parse();
            return this.model.state === 'create';
        });

        return this.checkState();
    }

    async updateRule(index) {
        const ind = parseInt(index, 10);
        if (Number.isNaN(ind) || ind < 0 || ind >= this.items.length) {
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

        await this.items[ind].clickUpdate();
        await this.waitForFunction(async () => {
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
        if (Number.isNaN(ind) || ind < 0 || ind >= this.items.length) {
            throw new Error(`Invalid rule index: ${index}`);
        }

        this.model.rules.splice(ind, 1);
        this.expectedState = this.getExpectedState(this.model);

        await this.items[ind].clickDelete();
        await this.wait(this.ruleDeletePopupId, { visible: true });
        await this.parse();

        if (!await TestComponent.isVisible(this.delete_warning)) {
            throw new Error('Delete template warning popup not appear');
        }
        if (!this.delete_warning.okBtn) {
            throw new Error('OK button not found');
        }

        const prevTime = this.model.renderTime;

        await this.click(this.delete_warning.okBtn);
        await this.wait(this.ruleDeletePopupId, { hidden: true });
        await this.waitForFunction(async () => {
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

        const valid = this.ruleForm.isValid();
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

        await this.ruleForm.submit();
        await this.waitForFunction(async () => {
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

        await this.ruleForm.cancel();
        await this.waitForFunction(async () => {
            await this.parse();
            return !this.model.loading && this.isListState();
        });

        return this.checkState();
    }
}
