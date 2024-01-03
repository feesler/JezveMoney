import { asArray } from '@jezvejs/types';
import { computedStyle, createElement, getClassName } from '@jezvejs/dom';
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
const LEGEND_MAX_HEIGHT_PROP = '--chart-legend-max-collapsed-height';

const defaultProps = {
    data: null,
    categories: [],
    expandedLegend: false,
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
        this.toggleLegendButton.hide();

        this.elem = createElement('div', {
            props: { className: CONTENT_CLASS },
            children: [
                this.legendList,
                this.toggleLegendButton.elem,
            ],
        });
    }

    getMaxLegendHeight() {
        if (!this.legendList) {
            return 0;
        }

        const value = computedStyle(this.legendList).getPropertyValue(LEGEND_MAX_HEIGHT_PROP);
        return (value.length > 0) ? parseInt(value, 10) : 0;
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
        e?.stopPropagation();

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

    renderToggleLegendButton(state, prevState) {
        if (
            state.data === prevState.data
            && state.categories === prevState.categories
            && state.expandedLegend === prevState.expandedLegend
        ) {
            return;
        }

        if (!this.toggleLegendButton || !this.legendList) {
            return;
        }

        const maxHeight = this.getMaxLegendHeight();
        const showToggleButton = maxHeight && this.legendList.scrollHeight > maxHeight;

        this.toggleLegendButton.show(showToggleButton);
        this.toggleLegendButton.setTitle(
            (state.expandedLegend)
                ? __('actions.showVisible')
                : __('actions.showAll'),
        );

        this.legendList.classList.toggle('expanded', state.expandedLegend);
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        const categories = asArray(state.categories);

        const items = categories.map((category, index) => (
            this.renderItem({ category, index }, state)
        ));

        this.legendList.replaceChildren(...items);

        this.renderToggleLegendButton(state, prevState);
    }
}
