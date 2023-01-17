import { asArray } from 'jezve-test';
import { List } from './List.js';
import { ImportRule } from './ImportRule.js';

export class ImportRuleList extends List {
    createItem(obj) {
        return new ImportRule(obj);
    }

    deleteEmptyRules() {
        this.data = this.filter(
            (rule) => (rule.conditions.length > 0 && rule.actions.length > 0),
        );
    }

    deleteAccounts(accountIds) {
        const ids = asArray(accountIds);
        if (!ids.length) {
            return;
        }

        const itemIds = ids.map((id) => parseInt(id, 10));
        this.data = this.map((rule) => {
            const res = rule;

            res.conditions.data = res.conditions.filter(
                (condition) => {
                    if (!condition.isAccountField()
                        || condition.isPropertyValue()) {
                        return true;
                    }

                    const accountId = parseInt(condition.value, 10);
                    return !itemIds.includes(accountId);
                },
            );

            res.actions.data = res.actions.filter(
                (action) => {
                    if (!action.isAccountValue()) {
                        return true;
                    }

                    const accountId = parseInt(action.value, 10);
                    return !itemIds.includes(accountId);
                },
            );

            return res;
        });

        this.deleteEmptyRules();
    }

    deletePersons(...ids) {
        if (!ids.length) {
            return;
        }

        const itemIds = ids.map((id) => parseInt(id, 10));
        this.data = this.map((rule) => {
            const res = rule;

            res.actions.data = res.actions.filter(
                (action) => {
                    if (!action.isPersonValue()) {
                        return true;
                    }

                    const personId = parseInt(action.value, 10);
                    return !itemIds.includes(personId);
                },
            );

            return res;
        });

        this.deleteEmptyRules();
    }

    deleteCategories(...ids) {
        if (!ids.length) {
            return;
        }

        const itemIds = ids.map((id) => parseInt(id, 10));
        this.data = this.map((rule) => {
            const res = rule;

            res.actions.data = res.actions.filter(
                (action) => {
                    if (!action.isCategoryValue()) {
                        return true;
                    }

                    const categoryId = parseInt(action.value, 10);
                    return !itemIds.includes(categoryId);
                },
            );

            return res;
        });

        this.deleteEmptyRules();
    }

    deleteTemplate(...ids) {
        if (!ids.length) {
            return;
        }

        const itemIds = ids.map((id) => parseInt(id, 10));
        this.data = this.map((rule) => {
            const res = rule;

            res.conditions.data = res.conditions.filter(
                (condition) => {
                    if (!condition.isTemplateField()
                        || condition.isPropertyValue()) {
                        return true;
                    }

                    const templateId = parseInt(condition.value, 10);
                    return !itemIds.includes(templateId);
                },
            );

            return res;
        });

        this.deleteEmptyRules();
    }

    applyTo(transaction) {
        this.forEach((rule) => {
            if (!rule.meetConditions(transaction.original)) {
                return;
            }

            transaction.setRulesApplied(true);
            rule.runActions(transaction);
        });
    }
}
