import { isFunction } from '@jezvejs/types';
import { createElement, getClassName } from '@jezvejs/dom';
import { Button } from 'jezvejs/Button';
import { CloseButton } from 'jezvejs/CloseButton';

import { App } from '../../../Application/App.js';
import { __ } from '../../../utils/utils.js';

import { REMINDER_UPCOMING, Reminder } from '../../../Models/Reminder.js';

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
    selectButton: true,
    closeButton: true,
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

        this.titleElem = createElement('label', {
            props: { className: TITLE_CLASS },
            children: [this.titleTextElem],
        });

        this.controlsContainer = createElement('div', {
            props: { className: CONTROLS_CONTAINER_CLASS },
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
        if (state.title !== prevState?.title) {
            this.titleTextElem.textContent = state.title ?? '';
        }

        this.renderCloseButton(state, prevState);
    }

    renderCloseButton(state, prevState) {
        if (
            state.closeButton === prevState?.closeButton
            && state.reminder_id === prevState?.reminder_id
            && state.schedule_id === prevState?.schedule_id
            && state.disabled === prevState?.disabled
        ) {
            return;
        }

        if (!state.closeButton) {
            this.closeButton?.elem?.remove();
            this.closeButton = null;
            return;
        }

        if (!this.closeButton) {
            this.closeButton = CloseButton.create({
                onClick: (e) => this.onClose(e),
            });
            this.titleElem.append(this.closeButton.elem);
        }

        const reminderSelected = state.reminder_id || state.schedule_id;
        this.closeButton.show(!!reminderSelected);
        this.closeButton.enable(!state.disabled);
    }

    renderSelectButton(state, prevState) {
        if (
            state.selectButton === prevState?.selectButton
            && state.disabled === prevState?.disabled
        ) {
            return;
        }

        if (!state.selectButton) {
            this.selectButton?.elem?.remove();
            this.selectButton = null;
            return;
        }

        if (!this.selectButton) {
            this.selectButton = Button.create({
                className: SELECT_BUTTON_CLASS,
                title: __('transactions.selectReminder'),
                onClick: (e) => this.onClickSelect(e),
            });
            this.controlsContainer.append(this.selectButton.elem);
        }

        this.selectButton.enable(!state.disabled);
    }

    renderReminderItem(state, prevState) {
        if (
            state.reminder_id === prevState?.reminder_id
            && state.schedule_id === prevState?.schedule_id
            && state.reminder_date === prevState?.reminder_date
            && state.disabled === prevState?.disabled
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
                state: REMINDER_UPCOMING,
                date: state.reminder_date,
            });

        if (!this.reminderItem) {
            this.reminderItem = ReminderListItem.create({
                disabled: state.disabled,
                item: Reminder.createExtended(item),
            });
            this.contentContainer.prepend(this.reminderItem.elem);
        } else {
            this.reminderItem.setState((fieldState) => ({
                ...fieldState,
                disabled: state.disabled,
                item: Reminder.createExtended(item),
            }));
        }

        this.reminderItem.show();
    }

    renderContent(state, prevState) {
        this.renderSelectButton(state, prevState);
        this.renderReminderItem(state, prevState);
    }
}
