import {
    test,
    assert,
    setBlock,
    baseUrl,
    goTo,
    asArray,
} from 'jezve-test';
import { generateId } from '../../common.js';
import { CategoryListView } from '../../view/CategoryListView.js';
import { CategoryView } from '../../view/CategoryView.js';
import { App } from '../../Application.js';
import { __ } from '../../model/locale.js';
import { Category } from '../../model/Category.js';

/** Navigate to categories list page */
const checkNavigation = async () => {
    if (!(App.view instanceof CategoryListView)) {
        await App.view.navigateToCategories();
    }
};

/**
 * Navigate to create category view from categories list view
 * @param {Object} options - object with optional category fields
 */
export const create = async () => {
    await test('Create category', async () => {
        await checkNavigation();

        const expected = CategoryView.getExpectedState({
            locale: App.view.locale,
            name: '',
            color: '#023047',
            parent_id: 0,
            type: 0,
            isUpdate: false,
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

        const item = App.view.getItemByIndex(index);
        assert(item, 'Invalid category index');
        const category = App.state.categories.getItem(item.model.id);
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
export const updateById = (id) => {
    const sortedCategories = App.state.getSortedCategories();
    return update(sortedCategories.getIndexById(id));
};

/** Navigate to create child category view for specified parent category */
export const addSubcategory = async (id) => {
    const sortedCategories = App.state.getSortedCategories();
    const category = sortedCategories.getItem(id);
    assert(category && category.parent_id === 0, 'Invalid category');

    const index = sortedCategories.getIndexById(id);
    assert.arrayIndex(sortedCategories.data, index, 'Invalid category');

    await test(`Add subcategory for '${category.name}'`, async () => {
        await checkNavigation();

        const expected = CategoryView.getExpectedState({
            locale: App.view.locale,
            name: '',
            color: '#023047',
            parent_id: category.id,
            type: category.type,
            isUpdate: false,
        });

        await App.view.goToAddSubcategory(index);
        assert.instanceOf(App.view, CategoryView, 'Invalid view');

        return App.view.checkState(expected);
    });
};

export const showDetails = async ({ index, directNavigate = false }) => {
    const ind = parseInt(index, 10);
    assert(!Number.isNaN(ind), 'Position of category not specified');

    await test(`Show details of category [${index}]`, async () => {
        await checkNavigation();
        return App.view.showDetails(index, directNavigate);
    });
};

export const closeDetails = async (directNavigate = false) => {
    await test('Close category details', async () => {
        await checkNavigation();
        return App.view.closeDetails(directNavigate);
    });
};

/** Input category name */
export const inputName = async (name) => {
    await test(`Input name '${name}'`, async () => {
        assert.instanceOf(App.view, CategoryView, 'Invalid view');
        return App.view.inputName(name);
    });
};

/** Input category color */
export const inputColor = async (color) => {
    await test(`Input color ${color}`, async () => {
        assert.instanceOf(App.view, CategoryView, 'Invalid view');
        return App.view.inputColor(color);
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
    const typeName = Category.typeToString(type);

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

            const expected = CategoryListView.getInitialState();
            App.view.checkState(expected);
        }

        return App.state.fetchAndTest();
    });
};

export const deleteFromContextMenu = async (index, removeChildren = true) => {
    const options = (removeChildren) ? 'remove children' : 'keep children';
    await test(`Delete category from context menu [${index}] ${options}`, async () => {
        await checkNavigation();

        const item = App.view.getItemByIndex(index);
        const { id } = item.model;

        await App.view.deleteFromContextMenu(index, removeChildren);

        App.state.deleteCategories({ id, removeChildren });

        const expected = CategoryListView.getInitialState();
        App.view.checkState(expected);

        return App.state.fetchAndTest();
    });
};

export const del = async (indexes, removeChildren = true) => {
    const categories = asArray(indexes);
    assert(categories.length > 0, 'Invalid category indexes');

    const options = (removeChildren) ? 'remove children' : 'keep children';
    await test(`Delete categories [${categories.join()}] ${options}`, async () => {
        await checkNavigation();

        const id = categories.map((ind) => {
            const item = App.view.getItemByIndex(ind);
            return item.model.id;
        });

        await App.view.deleteCategories(categories, removeChildren);

        App.state.deleteCategories({ id, removeChildren });

        const expected = CategoryListView.getInitialState();
        App.view.checkState(expected);

        return App.state.fetchAndTest();
    });
};

export const delFromUpdate = async (index, removeChildren = true) => {
    const options = (removeChildren) ? 'remove children' : 'keep children';
    await test(`Delete category from update view [${index}] ${options}`, async () => {
        await checkNavigation();

        await App.view.goToUpdateCategory(index);
        assert.instanceOf(App.view, CategoryView, 'Invalid view');

        await App.view.deleteSelfItem(removeChildren);
        assert.instanceOf(App.view, CategoryListView, 'Invalid view');

        const id = App.state.categories.indexToId(index);
        App.state.deleteCategories({ id, removeChildren });

        const expected = CategoryListView.getInitialState();
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

export const toggleSortByName = async () => {
    await test('Toggle sort by name', async () => {
        await checkNavigation();
        return App.view.toggleSortByName();
    });
};

export const toggleSortByDate = async () => {
    await test('Toggle sort by date', async () => {
        await checkNavigation();
        return App.view.toggleSortByDate();
    });
};

export const sortManually = async () => {
    await test('Sort manually', async () => {
        await checkNavigation();
        await App.view.setSortMode();
        return App.view.setListMode();
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
            notification: { success: false, message: __('categories.errors.update') },
        };
        App.view.checkState(expected);
        await App.view.closeNotification();

        return true;
    });
};
