import {
    ce,
    isFunction,
    show,
    copyObject,
    addChilds,
    removeChilds,
    setEmptyClick,
    removeEmptyClick,
    getOffset,
    px,
    Component,
    Collapsible,
} from 'jezvejs';
import { ImportRule } from '../../../../js/model/ImportRule.js';
import { ImportConditionList } from '../../../../js/model/ImportConditionList.js';
import { ImportActionList } from '../../../../js/model/ImportActionList.js';
import { ImportConditionItem } from '../ConditionItem/ImportConditionItem.js';
import { ImportActionItem } from '../ActionItem/ImportActionItem.js';
import './style.scss';
import { IconLink } from '../../../IconLink/IconLink.js';

/** CSS classes */
const DEFAULT_BUTTON_CLASS = 'btn';
const DEFAULT_ICON_CLASS = 'icon';
/* Menu */
const MENU_CLASS = 'actions-menu';
const MENU_LIST_CLASS = 'actions-menu-list';
const MENU_BUTTON_CLASS = 'menu-btn';
const MENU_ICON_CLASS = 'menu-icon';
const UPDATE_BUTTON_CLASS = 'update-btn';
const DEL_BUTTON_CLASS = 'delete-btn';
const MENU_ICONLINK_CLASS = 'action-iconlink';

/** Strings */
const TITLE_CONDITIONS = 'Conditions';
const TITLE_ACTIONS = 'Actions';
const TITLE_NO_ACTIONS = 'No actions.';
const TITLE_NO_CONDITIONS = 'No conditions';

/**
 * ImportRuleItem component
 * @param {Object} props
 */
export class ImportRuleItem extends Component {
    static create(props) {
        return new ImportRuleItem(props);
    }

    constructor(...args) {
        super(...args);

        if (!this.props?.data) {
            throw new Error('Invalid props');
        }

        if (!(this.props.data instanceof ImportRule)) {
            throw new Error('Invalid rule item');
        }

        this.menuEmptyClickHandler = () => this.hideMenu();

        this.init();
        this.setData(this.props.data);
    }

    /** Main structure initialization */
    init() {
        this.propertyLabel = ce('span', { className: 'rule-item__property' });
        this.operatorLabel = ce('span', { className: 'rule-item__operator' });
        this.valueLabel = ce('span', { className: 'rule-item__value' });
        this.infoLabel = ce('span', { className: 'rule-item__info' });

        // Toggle expand/collapse
        this.toggleExtBtn = ce(
            'button',
            { className: 'btn icon-btn toggle-btn', type: 'button' },
            window.app.createIcon('toggle-ext', 'icon toggle-icon'),
        );

        this.topRow = window.app.createContainer('rule-item__main-top', [
            this.propertyLabel,
            this.operatorLabel,
            this.valueLabel,
        ]);
        this.bottomRow = window.app.createContainer('rule-item__main-bottom', [
            this.infoLabel,
        ]);

        this.infoContainer = window.app.createContainer('rule-item__main-info', [
            this.topRow,
            this.bottomRow,
        ]);

        this.createMenu();
        this.controls = window.app.createContainer('rule-item__main-controls', [
            this.menu,
            this.toggleExtBtn,
        ]);

        this.conditionsHeader = ce('label', { className: 'rule-item__header', textContent: TITLE_CONDITIONS });
        this.conditionsContainer = window.app.createContainer('rule-item__conditions', []);

        this.actionsHeader = ce('label', { className: 'rule-item__header', textContent: TITLE_ACTIONS });
        this.actionsContainer = window.app.createContainer('rule-item__actions', []);

        this.collapse = new Collapsible({
            className: 'rule-item',
            header: [this.infoContainer, this.controls],
            content: [
                this.conditionsHeader,
                this.conditionsContainer,
                this.actionsHeader,
                this.actionsContainer,
            ],
        });
        this.elem = this.collapse.elem;
    }

    createMenu() {
        const { createContainer, createIcon } = window.app;

        this.menuBtn = ce(
            'button',
            { className: `${DEFAULT_BUTTON_CLASS} ${MENU_BUTTON_CLASS}`, type: 'button' },
            createIcon('ellipsis', `${DEFAULT_ICON_CLASS} ${MENU_ICON_CLASS}`),
            { click: (e) => this.toggleMenu(e) },
        );

        this.updateBtn = IconLink.create({
            icon: 'update',
            title: 'Edit',
            className: [MENU_ICONLINK_CLASS, UPDATE_BUTTON_CLASS],
            onClick: (e) => this.onUpdate(e),
        });
        this.deleteBtn = IconLink.create({
            icon: 'del',
            title: 'Delete',
            className: [MENU_ICONLINK_CLASS, DEL_BUTTON_CLASS],
            onClick: (e) => this.onDelete(e),
        });

        this.menuList = createContainer(MENU_LIST_CLASS, [
            this.updateBtn.elem,
            this.deleteBtn.elem,
        ]);
        show(this.menuList, false);
        this.menu = createContainer(MENU_CLASS, [
            this.menuBtn,
            this.menuList,
        ]);
    }

    hideMenu() {
        show(this.menuList, false);
        this.menuList.style.top = '';
        this.menuList.style.left = '';
        this.menuList.style.width = '';

        removeEmptyClick(this.menuEmptyClickHandler);
    }

    toggleMenu(e) {
        e.stopPropagation();

        if (this.menuList.hasAttribute('hidden')) {
            show(this.menuList, true);

            const html = document.documentElement;
            const screenBottom = html.scrollTop + html.clientHeight;

            const offset = getOffset(this.menuList.offsetParent);
            const container = getOffset(this.menu);
            container.width = this.menu.offsetWidth;
            container.height = this.menu.offsetHeight;

            const listWidth = this.menuList.offsetWidth;
            const listHeight = this.menuList.offsetHeight;
            const totalListHeight = container.height + listHeight;
            const listBottom = container.top + totalListHeight;

            // Check vertical offset of menu list
            if (listBottom > html.scrollHeight) {
                this.menuList.style.top = px(container.top - offset.top - listHeight);
            } else {
                if (listBottom > screenBottom) {
                    html.scrollTop += listBottom - screenBottom;
                }
                this.menuList.style.top = px(
                    container.top - offset.top + container.height,
                );
            }

            const leftOffset = container.left - html.scrollLeft;
            // Check list overflows screen to the right
            // if rendered from the left of container
            if (leftOffset + listWidth > html.clientWidth) {
                const listLeft = container.left + container.width - listWidth - offset.left;
                if (listLeft < 0) {
                    this.menuList.style.left = px(0);
                    this.menuList.style.width = px(listWidth + listLeft);
                } else {
                    this.menuList.style.left = px(listLeft);
                }
            } else {
                this.menuList.style.left = px(container.left - offset.left);
            }

            setEmptyClick(this.menuEmptyClickHandler);
        } else {
            this.hideMenu();
        }
    }

    /** Set main state of component */
    setData(data) {
        if (!data) {
            throw new Error('Invalid data');
        }

        this.state = {
            ruleId: data.id,
            conditions: data.conditions,
            actions: data.actions,
        };

        this.render(this.state);
    }

    /** Return import rule object */
    getData() {
        const res = {
            flags: 0,
        };

        if (this.state.ruleId) {
            res.id = this.state.ruleId;
        }

        res.actions = copyObject(this.state.actions);
        res.conditions = copyObject(this.state.conditions);

        return res;
    }

    /** Update button 'click' event handler */
    onUpdate(e) {
        e.stopPropagation();

        if (!this.state.ruleId || !isFunction(this.props.onUpdate)) {
            return;
        }

        this.props.onUpdate(this.state.ruleId);
    }

    /** Delete button 'click' event handler */
    onDelete(e) {
        e.stopPropagation();

        if (!this.state.ruleId || !isFunction(this.props.onRemove)) {
            return;
        }

        this.props.onRemove(this.state.ruleId);
    }

    /** Set data for list container */
    setListContainerData(container, data) {
        if (!container) {
            throw new Error('Invalid list container');
        }

        removeChilds(container);
        const isValid = (Array.isArray(data) && data.length > 0);
        if (isValid) {
            addChilds(container, data.map((item) => item.elem));
        }

        show(container, isValid);
    }

    /** Render component state */
    render(state) {
        if (!state
            || !(state.actions instanceof ImportActionList)
            || !(state.conditions instanceof ImportConditionList)) {
            throw new Error('Invalid state');
        }

        if (state.ruleId) {
            this.elem.setAttribute('data-id', state.ruleId);
        }

        // Render conditions
        const conditionItems = state.conditions.map(
            (data) => ImportConditionItem.create({ data }),
        );
        show(this.conditionsHeader, (conditionItems.length > 0));
        this.setListContainerData(this.conditionsContainer, conditionItems);

        show(this.operatorLabel, (conditionItems.length > 0));
        show(this.valueLabel, (conditionItems.length > 0));

        const actionsTitle = (state.actions.length > 0)
            ? `${state.actions.length} action(s).`
            : TITLE_NO_ACTIONS;

        if (conditionItems.length > 0) {
            const firstCondition = conditionItems[0];

            this.propertyLabel.textContent = firstCondition.propertyLabel.textContent;
            this.operatorLabel.textContent = firstCondition.operatorLabel.textContent;

            if (firstCondition.state.isFieldValue) {
                this.valueLabel.classList.add('rule-item__value-property');
                this.valueLabel.classList.remove('rule-item__value');
            } else {
                this.valueLabel.classList.remove('rule-item__value-property');
                this.valueLabel.classList.add('rule-item__value');
            }

            this.valueLabel.textContent = firstCondition.valueLabel.textContent;
        } else {
            this.propertyLabel.textContent = TITLE_NO_CONDITIONS;
        }

        if (conditionItems.length > 1) {
            const conditionsTitle = `${conditionItems.length - 1} more condition(s).`;

            this.infoLabel.textContent = `${conditionsTitle} ${actionsTitle}`;
        } else {
            this.infoLabel.textContent = actionsTitle;
        }

        // Render actions
        const actionItems = state.actions.map(
            (item) => (new ImportActionItem({
                data: item,
            })),
        );
        show(this.actionsHeader, (actionItems.length > 0));
        this.setListContainerData(this.actionsContainer, actionItems);
    }
}
