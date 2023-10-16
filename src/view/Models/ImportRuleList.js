import { List } from './List.js';
import { ImportRule } from './ImportRule.js';

/**
 * @constructor ImportRuleList class
 * @param {object[]} props - array of import rules
 */
export class ImportRuleList extends List {
    /**
     * Assign new data to the list
     * @param {Array} data - array of list items
     */
    setData(data) {
        if (!Array.isArray(data)) {
            throw new Error('Invalid list props');
        }

        this.splice(0, this.length, ...data.map((item) => this.createItem(item)));
    }

    /**
     * Create list item from specified object
     * @param {Object} obj
     */
    createItem(obj) {
        return new ImportRule(obj);
    }

    /**
     * Apply list of import rules to specified transaction
     * @param {Object} item - import transaction
     */
    applyTo(item) {
        let applied = false;
        const data = item.originalData;
        let res = item;

        this.forEach((rule) => {
            if (!rule.meetConditions(data)) {
                return;
            }

            if (!applied) {
                res = res.setRulesApplied(true);
                applied = true;
            }

            res = rule.runActions(res);
        });

        return res;
    }
}
