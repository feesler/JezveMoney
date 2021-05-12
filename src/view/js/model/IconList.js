import { List } from './List.js';
import { Icon } from './Icon.js';

/**
 * Icons list class
 * @param {object[]} props - array of icons
 */
export class IconList extends List {
    /** Static alias for IconList constructor */
    static create(props) {
        return new IconList(props);
    }

    /**
     * Create list item from specified object
     * @param {Object} obj
     */
    createItem(obj) {
        return new Icon(obj);
    }
}
