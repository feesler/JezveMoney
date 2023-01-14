import {
    test,
    assert,
    setBlock,
    baseUrl,
    goTo,
    asArray,
} from 'jezve-test';
import { generateId } from '../common.js';
import { CategoryListView } from '../view/CategoryListView.js';
import { CategoryView } from '../view/CategoryView.js';
import { App } from '../Application.js';
import { Transaction } from '../model/Transaction.js';
import { __ } from '../model/locale.js';

/** Navigate to categories list page */
const checkNavigation = async () => {
    if (!(App.view instanceof CategoryListView)) {
        await App.view.navigateToCategories();
    }
};

/**
 * Navigate to create category view from categories list view
 * @param {Object} params
 */
export const create = async () => {
    await test('Create category', async () => {
        await checkNavigation();

        const expected = CategoryView.getExpectedState({
            locale: App.view.locale,
            isUpdate: false,
            name: '',
            parent_id: 0,
            type: 0,
        });

        await App.view.goToCreateCategory();
        assert.instanceOf(App.view, CategoryView, 'Invalid view');

        return App.view.checkState(expected);
    });
};

/** Navigate to update category view by position */
export const update = async (index) => {
    await test(`Update category [${index}]`, async () => {
        await checkNavigation();

        const category = App.state.categories.getItemByIndex(index);
        assert(category, 'Invalid category index');

        const expected = CategoryView.getExpectedState({
            locale: App.view.locale,
            ...category,
            isUpdate: true,
        });

        await App.view.goToUpdateCategory(index);
        assert.instanceOf(App.view, CategoryView, 'Invalid view');

        return App.view.checkState(expected);
    });
};

/** Navigate to update category view by id */
export const updateById = (id) => update(App.state.categories.getIndexById(id));

/** Input category name */
export const inputName = async (name) => {
    await test(`Input name '${name}'`, async () => {
        assert.instanceOf(App.view, CategoryView, 'Invalid view');
        return App.view.inputName(name);
    });
};

/** Select parent category */
export const selectParentCategory = async (id) => {
    const category = App.state.categories.getItem(id);
    assert(category, 'Invalid category id');

    await test(`Change parent category to '${category.name}'`, async () => {
        assert.instanceOf(App.view, CategoryView, 'Invalid view');
        return App.view.selectParentCategory(id);
    });
};

/** Select transaction type */
export const selectType = async (type) => {
    const typeName = (type === 0)
        ? 'Any'
        : Transaction.typeToString(type);

    await test(`Change transaction type to '${typeName}'`, async () => {
        assert.instanceOf(App.view, CategoryView, 'Invalid view');
        return App.view.selectType(type);
    });
};

/** Submit category form */
export const submit = async () => {
    await test('Submit category', async () => {
        assert.instanceOf(App.view, CategoryView, 'Invalid view');

        const validInput = App.view.isValid();
        const { isUpdate } = App.view;
        const expectedCategory = App.view.getExpectedCategory();

        await App.view.submit();

        if (validInput) {
            assert.instanceOf(App.view, CategoryListView, 'Fail to submit category');

            if (isUpdate) {
                App.state.updateCategory(expectedCategory);
            } else {
                App.state.createCategory(expectedCategory);
            }

            const expected = CategoryListView.render(App.state);
            App.view.checkState(expected);
        }

        return App.state.fetchAndTest();
    });
};

export const del = async (indexes) => {
    const categories = asArray(indexes);
    assert(categories.length > 0, 'Invalid category indexes');

    await test(`Delete categories [${categories.join()}]`, async () => {
        await checkNavigation();

        await App.view.deleteCategories(categories);

        const ids = App.state.categories.indexesToIds(categories);
        App.state.deleteCategories(ids);

        const expected = CategoryListView.render(App.state);
        App.view.checkState(expected);

        return App.state.fetchAndTest();
    });
};

export const delFromUpdate = async (index) => {
    await test(`Delete category from update view [${index}]`, async () => {
        await checkNavigation();

        await App.view.goToUpdateCategory(index);
        assert.instanceOf(App.view, CategoryView, 'Invalid view');

        await App.view.deleteSelfItem();
        assert.instanceOf(App.view, CategoryListView, 'Invalid view');

        const id = App.state.categories.indexToId(index);
        App.state.deleteCategories(id);
        const expected = CategoryListView.render(App.state);
        App.view.checkState(expected);

        return App.state.fetchAndTest();
    });
};

export const toggleSelect = async (indexes) => {
    const inds = asArray(indexes);

    await test(`Toggle select items [${inds.join()}]`, async () => {
        await checkNavigation();

        await App.view.selectCategories(indexes);
        // Click by items again to inverse selection
        return App.view.selectCategories(indexes);
    });
};

export const selectAll = async () => {
    await test('Select all categories', async () => {
        await checkNavigation();
        return App.view.selectAll();
    });
};

export const deselectAll = async () => {
    await test('Deselect all categories', async () => {
        await checkNavigation();
        return App.view.deselectAll();
    });
};

/** Check navigation to update not existing category */
export const securityTests = async () => {
    setBlock('Category security', 2);

    let id;
    do {
        id = generateId();
    } while (App.state.categories.getItem(id) != null);

    const requestURL = `${baseUrl()}categories/update/${id}`;

    await test('Access to not existing category', async () => {
        await goTo(requestURL);
        assert(!(App.view instanceof CategoryView), 'Invalid view');

        const expected = {
            msgPopup: { success: false, message: __('ERR_CATEGORY_UPDATE', App.view.locale) },
        };
        App.view.checkState(expected);
        await App.view.closeNotification();

        return true;
    });
};
