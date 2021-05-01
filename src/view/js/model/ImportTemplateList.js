'use strict';

/* global extend, List, ImportTemplate */

/**
 * @constructor ImportTemplateList class
 * @param {object[]} props - array of import rules
 */
function ImportTemplateList() {
    ImportTemplateList.parent.constructor.apply(this, arguments);
}

extend(ImportTemplateList, List);

/** Static alias for ImportTemplateList constructor */
ImportTemplateList.create = function (props) {
    return new ImportTemplateList(props);
};

/**
 * Create list item from specified object
 * @param {Object} obj
 */
ImportTemplateList.prototype.createItem = function (obj) {
    return new ImportTemplate(obj);
};
