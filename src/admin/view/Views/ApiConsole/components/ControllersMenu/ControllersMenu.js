import {
    Component,
    removeChilds,
    createElement,
    addChilds,
    getClassName,
} from 'jezvejs';
import './ControllersMenu.scss';

/* CSS classes */
const MENU_CLASS = 'menu-list';
const MENU_ITEM_CLASS = 'menu-item';
const SUB_MENU_CLASS = 'sub-menu-list';
const SUB_MENU_ITEM_CLASS = 'sub-menu-item';
const ACTIVE_ITEM_CLASS = 'active';

const controllers = [
    {
        name: 'state',
        title: 'Common',
        methods: [
            { title: 'Read state', formId: 'readStateForm' },
            { title: 'Main state', formId: 'mainStateForm' },
            { title: 'DB version', formId: 'dbVersionForm' },
        ],
    },
    {
        name: 'account',
        title: 'Accounts',
        methods: [
            { title: 'List', formId: 'listAccForm' },
            { title: 'Read', formId: 'readAccForm' },
            { title: 'Create', formId: 'createAccForm' },
            { title: 'Update', formId: 'updateAccForm' },
            { title: 'Show', formId: 'showAccForm' },
            { title: 'Hide', formId: 'hideAccForm' },
            { title: 'Delete', formId: 'delAccForm' },
            { title: 'Set position', formId: 'setAccPosForm' },
        ],
    },
    {
        name: 'person',
        title: 'Persons',
        methods: [
            { title: 'List', formId: 'listPersonsForm' },
            { title: 'Read', formId: 'readPersonForm' },
            { title: 'Create', formId: 'createPersonForm' },
            { title: 'Update', formId: 'updatePersonForm' },
            { title: 'Show', formId: 'showPersonForm' },
            { title: 'Hide', formId: 'hidePersonForm' },
            { title: 'Delete', formId: 'delPersonForm' },
            { title: 'Set position', formId: 'setPersonPosForm' },
        ],
    },
    {
        name: 'transaction',
        title: 'Transactions',
        methods: [
            { title: 'List', formId: 'listTrForm' },
            { title: 'Read', formId: 'readTrForm' },
            { title: 'Create', formId: 'createTrForm' },
            { title: 'Create debt', formId: 'createDebtForm' },
            { title: 'Update', formId: 'updateTrForm' },
            { title: 'Update debt', formId: 'updateDebtForm' },
            { title: 'Delete', formId: 'delTrForm' },
            { title: 'Set category', formId: 'setTrCategoryForm' },
            { title: 'Set position', formId: 'setTrPosForm' },
            { title: 'Statistics', formId: 'statisticsForm' },
        ],
    },
    {
        name: 'schedule',
        title: 'Schedule',
        methods: [
            { title: 'List', formId: 'listScheduledTrForm' },
            { title: 'Read', formId: 'readScheduledTrForm' },
            { title: 'Create', formId: 'createScheduledTrForm' },
            { title: 'Create debt', formId: 'createScheduledDebtForm' },
            { title: 'Update', formId: 'updateScheduledTrForm' },
            { title: 'Update debt', formId: 'updateScheduledDebtForm' },
            { title: 'Delete', formId: 'delScheduledTrForm' },
            { title: 'Finish', formId: 'finishScheduledTrForm' },
        ],
    },
    {
        name: 'reminder',
        title: 'Reminders',
        methods: [
            { title: 'List', formId: 'listReminderForm' },
            { title: 'Read', formId: 'readReminderForm' },
            { title: 'Upcoming', formId: 'upcomingRemindersForm' },
            { title: 'Confirm', formId: 'confirmReminderForm' },
            { title: 'Cancel', formId: 'cancelReminderForm' },
        ],
    },
    {
        name: 'category',
        title: 'Categories',
        methods: [
            { title: 'List', formId: 'listCategoriesForm' },
            { title: 'Read', formId: 'readCategoryForm' },
            { title: 'Create', formId: 'createCategoryForm' },
            { title: 'Update', formId: 'updateCategoryForm' },
            { title: 'Delete', formId: 'delCategoryForm' },
            { title: 'Set position', formId: 'setCategoryPosForm' },
        ],
    },
    {
        name: 'importtpl',
        title: 'Import templates',
        methods: [
            { title: 'List', formId: 'listTplForm' },
            { title: 'Read', formId: 'readTplForm' },
            { title: 'Create', formId: 'createTplForm' },
            { title: 'Update', formId: 'updateTplForm' },
            { title: 'Delete', formId: 'delTplForm' },
        ],
    },
    {
        name: 'importrule',
        title: 'Import rules',
        methods: [
            { title: 'List', formId: 'listRuleForm' },
            { title: 'Read', formId: 'readRuleForm' },
            { title: 'Create', formId: 'createRuleForm' },
            { title: 'Update', formId: 'updateRuleForm' },
            { title: 'Delete', formId: 'delRuleForm' },
        ],
    },
    {
        name: 'importcond',
        title: 'Import conditions',
        methods: [
            { title: 'List', formId: 'listCondForm' },
            { title: 'Read', formId: 'readCondForm' },
            { title: 'Create', formId: 'createCondForm' },
            { title: 'Update', formId: 'updateCondForm' },
            { title: 'Delete', formId: 'delCondForm' },
        ],
    },
    {
        name: 'importaction',
        title: 'Import actions',
        methods: [
            { title: 'List', formId: 'listActForm' },
            { title: 'Read', formId: 'readActForm' },
            { title: 'Create', formId: 'createActForm' },
            { title: 'Update', formId: 'updateActForm' },
            { title: 'Delete', formId: 'delActForm' },
        ],
    },
    {
        name: 'currency',
        title: 'Currency',
        methods: [
            { title: 'List', formId: 'listCurrForm' },
            { title: 'Read', formId: 'readCurrForm' },
            { title: 'Create', formId: 'createCurrForm' },
            { title: 'Update', formId: 'updateCurrForm' },
            { title: 'Delete', formId: 'delCurrForm' },
        ],
    },
    {
        name: 'usercurrency',
        title: 'User currency',
        methods: [
            { title: 'List', formId: 'listUserCurrencyForm' },
            { title: 'Read', formId: 'readUserCurrencyForm' },
            { title: 'Create', formId: 'createUserCurrencyForm' },
            { title: 'Update', formId: 'updateUserCurrencyForm' },
            { title: 'Delete', formId: 'delUserCurrencyForm' },
            { title: 'Set position', formId: 'setUserCurrencyPosForm' },
        ],
    },
    {
        name: 'icon',
        title: 'Icon',
        methods: [
            { title: 'List', formId: 'listIconForm' },
            { title: 'Read', formId: 'readIconForm' },
            { title: 'Create', formId: 'createIconForm' },
            { title: 'Update', formId: 'updateIconForm' },
            { title: 'Delete', formId: 'delIconForm' },
        ],
    },
    {
        name: 'user',
        title: 'User',
        methods: [
            { title: 'Login', formId: 'loginForm' },
            { title: 'Logout', formId: 'logoutForm' },
            { title: 'Register', formId: 'registerForm' },
        ],
    },
    {
        name: 'profile',
        title: 'Profile',
        methods: [
            { title: 'Read profile', formId: 'readProfileForm' },
            { title: 'Change name', formId: 'changeNameForm' },
            { title: 'Change password', formId: 'changePwdForm' },
            { title: 'Update settings', formId: 'updateSettingsForm' },
            { title: 'Reset data', formId: 'resetForm' },
        ],
    },
];

const defaultProps = {
    activeController: null,
    activeMethod: null,
    onMethodSelect: null,
};

/**
 * API controllers menu component
 */
export class ControllersMenu extends Component {
    static userProps = {
        elem: ['id'],
    };

    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        this.state = {
            ...this.props,
            items: controllers,
        };

        this.init();
        this.postInit();
        this.render(this.state);
    }

    init() {
        this.elem = createElement('ul', {
            props: { className: MENU_CLASS },
            events: { click: (e) => this.onClick(e) },
        });
    }

    postInit() {
        this.setClassNames();
        this.setUserProps();
    }

    onClick(e) {
        const targetEl = e.target;

        this.activateMenu(targetEl);

        const formId = targetEl?.dataset?.target;
        if (formId) {
            this.props.onMethodSelect?.(formId);
        }
    }

    /**
     * Activate specified menu item, expand sub menu if available
     * and collapse submenus of other items
     * @param {Element} menuElem - menu item element to activate
     */
    activateMenu(menuElem) {
        const subItemEl = menuElem.closest(`.${SUB_MENU_ITEM_CLASS}`);
        const formId = subItemEl?.dataset?.target;
        if (formId) {
            this.acivateMethod(formId);
            return;
        }

        const mainItemEl = menuElem.closest(`.${MENU_ITEM_CLASS}`);
        const controller = mainItemEl?.dataset?.id;
        this.acivateController(controller);
    }

    acivateController(activeController) {
        if (!activeController) {
            return;
        }

        this.setState({
            ...this.state,
            activeController,
            items: this.state.items.map((item) => ({
                ...item,
                active: (item.name === activeController),
            })),
        });
    }

    acivateMethod(activeMethod) {
        this.setState({
            ...this.state,
            activeMethod,
        });
    }

    renderMethodItem(method, state) {
        const active = method.formId === state.activeMethod;

        return createElement('li', {
            props: {
                className: getClassName(SUB_MENU_ITEM_CLASS, (active && ACTIVE_ITEM_CLASS)),
                dataset: { target: method.formId },
                textContent: method.title,
            },
        });
    }

    renderMethodsList(item, state) {
        return createElement('ul', {
            props: { className: SUB_MENU_CLASS },
            children: item.methods.map((method) => this.renderMethodItem(method, state)),
        });
    }

    renderControllerItem(item, state) {
        const active = item.name === state.activeController;

        const titleBtn = createElement('button', { props: { textContent: item.title } });

        return createElement('li', {
            props: {
                className: getClassName(MENU_ITEM_CLASS, (active && ACTIVE_ITEM_CLASS)),
                dataset: { id: item.name },
            },
            children: [
                titleBtn,
                this.renderMethodsList(item, state),
            ],
        });
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        const elems = state.items.map((item) => this.renderControllerItem(item, state));
        removeChilds(this.elem);
        addChilds(this.elem, elems);
    }
}
