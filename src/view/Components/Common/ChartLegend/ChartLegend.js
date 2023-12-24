import { asArray } from '@jezvejs/types';
import { createElement, getClassName } from '@jezvejs/dom';
import { Component } from 'jezvejs';
import { Button } from 'jezvejs/Button';

import { __ } from '../../../utils/utils.js';
import { getDataCategoryName } from '../../../utils/statistics.js';

import './ChartLegend.scss';

/* CSS classes */
const CONTENT_CLASS = 'chart-legend__content';
const LIST_CLASS = 'chart__legend-list';
const ITEM_CLASS = 'chart-legend__item';
const ITEM_SELECTOR = `.${ITEM_CLASS}`;
const ITEM_ACTIVE_CLASS = 'chart-legend__item_active';
const ITEM_TITLE_CLASS = 'chart-legend__item-title';

const defaultProps = {
    categories: [],
    activateCategoryOnClick: true,
    onClick: null,
    setActiveCategory: null,
    setLegendCategories: null,
    toggleExpandLegend: null,
};

/**
 * Statistics chart legend component
 */
export class ChartLegend extends Component {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        this.state = {
            ...this.props,
        };

        this.init();
        this.render(this.state);
    }

    init() {
        this.legendList = createElement('ul', {
            props: { className: LIST_CLASS },
            events: { click: (e) => this.onClick(e) },
        });

        // Toggle collapse/expand button
        this.toggleLegendButton = this.createToggleShowAllButton({
            onClick: (e) => this.notifyEvent('toggleExpandLegend', e),
        });

        this.elem = createElement('div', {
            props: { className: CONTENT_CLASS },
            children: [
                this.legendList,
                this.toggleLegendButton.elem,
            ],
        });
    }

    createToggleShowAllButton(props = {}) {
        return Button.create({
            className: 'link-btn',
            type: 'button',
            title: __('actions.showAll'),
            ...props,
        });
    }

    onClick(e) {
        if (this.state.activateCategoryOnClick) {
            this.activateCategory(e);
        }

        this.notifyEvent('onClick', e);
    }

    activateCategory(e) {
        const listItem = e.target.closest(ITEM_SELECTOR);
        if (!listItem) {
            return;
        }

        const { category } = listItem.dataset;
        const activeCategory = this.state.activeCategory?.toString() ?? null;
        const isActive = (
            !!category
            && category.toString() === activeCategory
        );

        this.notifyEvent('setActiveCategory', (isActive) ? null : category);
    }

    renderItem(item, state) {
        const { category, index } = item;
        const categoryReport = (state.filter.report === 'category');
        const id = (categoryReport) ? category : (index + 1);
        const strCategory = category?.toString();

        const res = createElement('li', {
            props: {
                className: getClassName(
                    ITEM_CLASS,
                    `legend-item-${id}`,
                ),
                dataset: {
                    category,
                },
            },
            children: createElement('span', {
                props: {
                    className: ITEM_TITLE_CLASS,
                    textContent: getDataCategoryName(category, state),
                },
            }),
        });

        res.classList.toggle(ITEM_ACTIVE_CLASS, state.activeCategory === strCategory);

        return res;
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        const categories = asArray(state.categories);

        setTimeout(() => {
            this.notifyEvent('setLegendCategories', categories);
        });

        const items = categories.map((category, index) => (
            this.renderItem({ category, index }, state)
        ));

        this.legendList.replaceChildren(...items);
    }
}
