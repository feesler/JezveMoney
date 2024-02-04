import { ListModel } from './ListModel.js';
import { Icon } from './Icon.js';

/**
 * Icons list class
 * @param {object[]} props - array of icons
 */
export class IconListModel extends ListModel {
    /**
     * Create list item from specified object
     * @param {Object} obj
     */
    createItem(obj) {
        return new Icon(obj);
    }
}
