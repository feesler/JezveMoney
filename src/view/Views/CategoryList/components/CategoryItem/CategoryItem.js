import { createElement, getClassName } from 'jezvejs';
import { ListContainer } from 'jezvejs/ListContainer';

import { listData } from '../../../../utils/utils.js';

import { CollapsibleListItem } from '../../../../Components/List/CollapsibleListItem/CollapsibleListItem.js';

import './CategoryItem.scss';

/** CSS classes */
const CONTAINER_CLASS = 'category-item';
const TITLE_CLASS = 'category-item__title';
const CHILD_CONTAINER_CLASS = 'category-item__children categories-list';

const CATEGORY_COLOR_PROP = '--category-color';

const defaultProps = {
    selected: false,
    listMode: 'list',
    showControls: false,
    animated: false,
};

/**
 * Categories list item component
 */
export class CategoryItem extends CollapsibleListItem {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
            className: getClassName(CONTAINER_CLASS, props.className),
        });
    }

    init() {
        super.init();

        this.titleElem = createElement('div', { props: { className: TITLE_CLASS } });
        this.contentElem.append(this.titleElem);
    }

    renderContent(state) {
        const { item } = state;

        this.titleElem.textContent = item.name;
        this.titleElem.setAttribute('title', item.name);
    }

    createChildContainer() {
        if (this.childContainer) {
            return;
        }

        this.childContainer = ListContainer.create({
            ItemComponent: CategoryItem,
            getItemProps: (item, { listMode }) => ({
                item,
                selected: item.selected,
                listMode,
                showControls: (listMode === 'list'),
            }),
            className: CHILD_CONTAINER_CLASS,
            itemSelector: '.category-item',
            sortModeClass: 'list_sort',
            listMode: 'list',
        });

        this.setCollapsibleContent(this.childContainer.elem);
        this.expand();
    }

    renderChildren(state, prevState) {
        const { item, listMode } = state;
        const prevItem = prevState?.item;
        if (
            item.parent_id === prevItem?.parent_id
            && item.children === prevItem?.children
            && listMode === prevState?.listMode
        ) {
            return;
        }

        if (item.parent_id !== 0 || !item.children) {
            this.setCollapsibleContent(null);
            this.childContainer = null;
            return;
        }

        this.createChildContainer();

        this.childContainer.setState((listState) => ({
            ...listState,
            items: listData(item.children),
            listMode,
            renderTime: Date.now(),
        }));
    }

    render(state, prevState = {}) {
        super.render(state, prevState);

        this.renderChildren(state, prevState);

        this.elem.style.setProperty(CATEGORY_COLOR_PROP, state.item.color);
    }
}
