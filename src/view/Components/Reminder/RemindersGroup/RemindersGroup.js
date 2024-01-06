import { isFunction } from '@jezvejs/types';
import { createElement } from '@jezvejs/dom';
import { Component } from 'jezvejs';
import { ListContainer } from 'jezvejs/ListContainer';

import { App } from '../../../Application/App.js';
import { __, timeToDate } from '../../../utils/utils.js';

import { Reminder } from '../../../Models/Reminder.js';

import { NoDataMessage } from '../../Common/NoDataMessage/NoDataMessage.js';
import { ReminderListItem } from '../ReminderListItem/ReminderListItem.js';

import './RemindersGroup.scss';

/* CSS classes */
const GROUP_CLASS = 'reminders-group';
const HEADER_CLASS = 'reminders-group__header';
const HEADER_LINE_CLASS = 'reminders-group__header-line';
const TITLE_CLASS = 'reminders-group__title';
const LIST_CLASS = 'reminders-list';
const SELECT_MODE_CLASS = 'list_select';

export class RemindersGroup extends Component {
    constructor(props = {}) {
        super(props);

        this.state = { ...this.props };

        this.init();
    }

    get id() {
        return this.state.item.date;
    }

    init() {
        this.title = createElement('span', {
            props: { className: TITLE_CLASS },
        });
        this.separator = createElement('hr', {
            props: { className: HEADER_LINE_CLASS },
        });
        this.header = createElement('header', {
            props: { className: HEADER_CLASS },
            children: [
                this.title,
                this.separator,
            ],
        });

        this.list = ListContainer.create({
            listMode: 'list',
            ItemComponent: ReminderListItem,
            getItemProps: (item, state) => ({
                item: Reminder.createExtended(item),
                selected: item.selected,
                listMode: state.listMode,
                mode: state.mode,
                showControls: state.showControls,
            }),
            isListChanged: (state, prevState) => (
                state.items !== prevState.items
                || state.mode !== prevState.mode
                || state.listMode !== prevState.listMode
                || state.showControls !== prevState.showControls
            ),
            className: LIST_CLASS,
            itemSelector: ReminderListItem.selector,
            placeholderClass: 'list-item_placeholder',
            PlaceholderComponent: NoDataMessage,
            getPlaceholderProps: () => ({ title: __('reminders.noData') }),
            onItemClick: (id, e) => this.onItemClick(id, e),
        });

        this.elem = createElement('section', {
            props: { className: GROUP_CLASS },
            children: [
                this.header,
                this.list.elem,
            ],
        });

        this.render(this.state);
    }

    onItemClick(...args) {
        if (isFunction(this.state.onItemClick)) {
            this.state.onItemClick(...args);
        }
    }

    onSort(...args) {
        if (isFunction(this.state.onSort)) {
            this.state.onSort(...args);
        }
    }

    renderMonth(value) {
        const date = timeToDate(value);
        const monthName = App.formatDate(date, {
            locales: App.dateFormatLocale,
            options: { month: 'long' },
        });

        return `${monthName} ${date.getFullYear()}`;
    }

    render(state) {
        this.title.textContent = this.renderMonth(state.item.date);

        // Render list
        this.list.setState((listState) => ({
            ...listState,
            mode: state.mode,
            listMode: state.listMode,
            showControls: (state.listMode === 'list'),
            showDate: false,
            showResults: state.showResults,
            items: state.item.items,
            renderTime: state.renderTime,
        }));

        this.list.elem.classList.toggle(SELECT_MODE_CLASS, state.listMode === 'select');
    }
}
