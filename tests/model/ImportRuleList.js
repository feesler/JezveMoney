import { asArray } from 'jezve-test';
import { List } from './List.js';
import { ImportRule } from './ImportRule.js';

export class ImportRuleList extends List {
    createItem(obj) {
        return new ImportRule(obj);
    }

    deleteEmptyRules() {
        const data = this.filter(
            (rule) => (rule.conditions.length > 0 && rule.actions.length > 0),
        );
        this.setData(data);

        return true;
    }

    deleteAccounts(accountIds) {
        const ids = asArray(accountIds);
        if (!ids.length) {
            return true;
        }

        const itemIds = ids.map((id) => parseInt(id, 10));
        const data = this.map((rule) => {
            const res = rule;

            res.conditions = res.conditions.filter(
                (condition) => {
                    if (!condition.isAccountField()
                        || condition.isPropertyValue()) {
                        return true;
                    }

                    const accountId = parseInt(condition.value, 10);
                    return !itemIds.includes(accountId);
                },
            );

            res.actions = res.actions.filter(
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

        this.setData(data);

        return this.deleteEmptyRules();
    }

    deletePersons(...ids) {
        if (!ids.length) {
            return true;
        }

        const itemIds = ids.map((id) => parseInt(id, 10));
        const data = this.map((rule) => {
            const res = rule;

            res.actions = res.actions.filter(
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

        this.setData(data);

        return this.deleteEmptyRules();
    }

    deleteCategories(...ids) {
        if (!ids.length) {
            return true;
        }

        const itemIds = ids.map((id) => parseInt(id, 10));
        const data = this.map((rule) => {
            const res = rule;

            res.actions = res.actions.filter(
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
        this.setData(data);

        return this.deleteEmptyRules();
    }

    deleteTemplate(...ids) {
        if (!ids.length) {
            return true;
        }

        const itemIds = ids.map((id) => parseInt(id, 10));
        const data = this.map((rule) => {
            const res = rule;

            res.conditions = res.conditions.filter(
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

        this.setData(data);

        return this.deleteEmptyRules();
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
