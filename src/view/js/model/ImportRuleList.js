import { List } from './List.js';
import { ImportRule } from './ImportRule.js';

/**
 * @constructor ImportRuleList class
 * @param {object[]} props - array of import rules
 */
export class ImportRuleList extends List {
    /** Static alias for ImportRuleList constructor */
    static create(props) {
        return new ImportRuleList(props);
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
        const data = item.getOriginal();

        this.forEach((rule) => {
            if (!rule.meetConditions(data)) {
                return;
            }

            applied = true;
            rule.runActions(item);
        });

        return applied;
    }
}
