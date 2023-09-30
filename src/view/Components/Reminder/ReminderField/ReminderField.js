import { createElement, getClassName, isFunction } from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { CloseButton } from 'jezvejs/CloseButton';

import { App } from '../../../Application/App.js';
import { __ } from '../../../utils/utils.js';

import { Reminder } from '../../../Models/Reminder.js';

import { Field } from '../../Common/Field/Field.js';
import { ReminderListItem } from '../ReminderListItem/ReminderListItem.js';
import { SelectReminderDialog } from '../SelectReminderDialog/SelectReminderDialog.js';

import './ReminderField.scss';

/* CSS classes */
const FIELD_CLASS = 'field reminder-field';
const TITLE_CLASS = 'field__title';
const CONTENT_CLASS = 'field__content';
const CONTROLS_CONTAINER_CLASS = 'controls-container';
const SELECT_BUTTON_CLASS = 'dashed-btn';

const defaultProps = {
    id: undefined,
    title: null,
    reminder_id: null,
    schedule_id: null,
    reminder_date: null,
    disabled: false,
    onSelect: null,
    onRemove: null,
};

/**
 * Reminder field component
 */
export class ReminderField extends Field {
    static userProps = {
        elem: ['id'],
    };

    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
            className: getClassName(FIELD_CLASS, props.className),
        });
    }

    init() {
        this.titleTextElem = createElement('span');
        this.closeButton = CloseButton.create({
            onClick: (e) => this.onClose(e),
        });

        this.titleElem = createElement('label', {
            props: { className: TITLE_CLASS },
            children: [this.titleTextElem, this.closeButton.elem],
        });

        this.selectButton = Button.create({
            className: SELECT_BUTTON_CLASS,
            title: __('transactions.selectReminder'),
            onClick: (e) => this.onClickSelect(e),
        });
        this.controlsContainer = createElement('div', {
            props: { className: CONTROLS_CONTAINER_CLASS },
            children: this.selectButton.elem,
        });

        this.contentContainer = createElement('div', {
            props: { className: CONTENT_CLASS },
            children: [this.controlsContainer],
        });

        this.elem = createElement('div', {
            props: { className: FIELD_CLASS },
            children: [this.titleElem, this.contentContainer],
        });
    }

    onClose() {
        if (isFunction(this.props.onRemove)) {
            this.props.onRemove();
        }
    }

    onClickSelect() {
        this.showSelectReminderDialog();
    }

    showSelectReminderDialog() {
        if (!this.selectDialog) {
            this.selectDialog = SelectReminderDialog.create({
                onChange: (reminder) => this.onReminderChanged(reminder),
                onCancel: null,
            });
        }

        this.selectDialog.show();
    }

    onReminderChanged(reminder) {
        if (isFunction(this.props.onSelect)) {
            this.props.onSelect(reminder);
        }

        this.selectDialog.hide();
    }

    renderTitle(state, prevState) {
        if (
            state.title === prevState?.title
            && state.reminder_id === prevState?.reminder_id
            && state.schedule_id === prevState?.schedule_id
        ) {
            return;
        }

        const reminderSelected = state.reminder_id || state.schedule_id;

        this.titleTextElem.textContent = state.title ?? '';
        this.closeButton.show(reminderSelected);
    }

    renderContent(state, prevState) {
        if (
            state.reminder_id === prevState?.reminder_id
            && state.schedule_id === prevState?.schedule_id
            && state.reminder_date === prevState?.reminder_date
        ) {
            return;
        }

        if (!state.reminder_id && !state.schedule_id) {
            this.reminderItem?.elem?.remove();
            this.reminderItem = null;
            return;
        }

        const item = (state.reminder_id)
            ? App.model.reminders.getItem(state.reminder_id)
            : ({
                schedule_id: state.schedule_id,
                date: state.reminder_date,
            });

        if (!this.reminderItem) {
            this.reminderItem = ReminderListItem.create({
                item,
            });
            this.contentContainer.prepend(this.reminderItem.elem);
        } else {
            this.reminderItem.setState((fieldState) => ({
                ...fieldState,
                item: Reminder.createExtended(item),
            }));
        }

        this.reminderItem.show();
    }
}
