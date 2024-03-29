import { assert } from '@jezvejs/assert';
import {
    query,
    navigation,
    evaluate,
} from 'jezve-test';
import { DropDown, Button } from 'jezvejs-test';
import { AppView } from './AppView.js';
import { Icon } from '../model/Icon.js';
import { isValidValue, normalize, trimToDigitsLimit } from '../common.js';
import { Tile } from './component/Tiles/Tile.js';
import { InputField } from './component/Fields/InputField.js';
import { WarningPopup } from './component/WarningPopup.js';
import { App } from '../Application.js';
import { __ } from '../model/locale.js';
import { accountTypes, ACCOUNT_TYPE_CREDIT_CARD, getAccountTypeName } from '../model/AccountListModel.js';

/** Account view class */
export class AccountView extends AppView {
    init() {
        this.nameTyped = false;
    }

    async parseContent() {
        const res = await evaluate(() => {
            const headingEl = document.querySelector('.heading > h1');
            const idInp = document.getElementById('accid');
            const flagsInp = document.getElementById('flags');

            return {
                heading: {
                    visible: !!headingEl && !headingEl.hidden,
                    text: headingEl?.textContent,
                },
                isUpdate: !!idInp,
                id: (idInp) ? parseInt(idInp.value, 10) : undefined,
                flags: parseInt(flagsInp.value, 10),
            };
        });

        if (res.isUpdate) {
            assert(res.id, 'Invalid account id');
        }

        res.deleteBtn = await Button.create(this, await query('#deleteBtn'));
        res.tile = await Tile.create(this, await query('#accountTile'));

        res.formElem = await query('form');
        assert(res.formElem, 'Form element not found');

        res.typeDropDown = await DropDown.create(this, await query('#typeField .dd__container'));

        res.iconDropDown = await DropDown.create(this, await query('#iconField .icon-select'));

        res.name = await InputField.create(this, await query('#nameField'));
        assert(res.name, 'Account name input not found');

        res.currDropDown = await DropDown.create(this, await query('#currencyField .dd__container'));

        res.balance = await InputField.create(this, await query('#initBalanceField'));
        assert(res.balance, 'Account balance input not found');

        res.limit = await InputField.create(this, await query('#initLimitField'));
        assert(res.limit, 'Credit limit field not found');

        res.submitBtn = await Button.create(this, await query('.form-controls .submit-btn'));
        assert(res.submitBtn, 'Submit button not found');

        res.cancelBtn = await Button.create(this, await query('.form-controls .cancel-btn'));
        assert(res.cancelBtn, 'Cancel button not found');

        res.delete_warning = await WarningPopup.create(this, await query('#delete_warning'));

        return res;
    }

    buildModel(cont) {
        const res = {
            locale: cont.locale,
        };

        res.isUpdate = cont.isUpdate;
        if (res.isUpdate) {
            res.id = cont.id;
        }

        // Type
        this.setModelType(cont.typeDropDown.value, res);

        // Name
        res.name = cont.name.value;
        res.nameTyped = this.nameTyped;

        // Currency
        this.setModelCurrency(cont.currDropDown.value, res);
        const { precision } = res.currObj;

        // Iniital balance
        res.initbalance = cont.balance.value;
        res.fInitBalance = isValidValue(res.initbalance)
            ? normalize(res.initbalance, precision)
            : res.initbalance;

        const origBalance = (res.isUpdate && this.origAccount) ? this.origAccount.balance : 0;
        const origInitBalance = (res.isUpdate && this.origAccount)
            ? this.origAccount.initbalance
            : 0;

        res.balance = normalize(origBalance + res.fInitBalance - origInitBalance, precision);
        res.fBalance = res.balance;

        // Credit limit
        res.initlimit = cont.limit.value;
        res.fInitLimit = isValidValue(res.initlimit)
            ? normalize(res.initlimit, precision)
            : res.initlimit;

        const origLimit = (res.isUpdate && this.origAccount) ? this.origAccount.limit : 0;
        const origInitLimit = (res.isUpdate && this.origAccount)
            ? this.origAccount.initlimit
            : 0;

        res.limit = normalize(origLimit + res.fInitLimit - origInitLimit, precision);
        res.fLimit = res.limit;

        // Icon
        this.setModelIcon(cont.iconDropDown.value, res);

        // Flags
        res.flags = cont.flags;

        return res;
    }

    setModelType(value, model = this.model) {
        const res = model;

        res.type = parseInt(value, 10);
        assert.isString(accountTypes[res.type], `Invalid account type: ${res.type}`);

        return res;
    }

    setModelCurrency(value, model = this.model) {
        const res = model;

        res.curr_id = parseInt(value, 10);
        res.currObj = App.currency.getItem(res.curr_id);
        assert(res.currObj, `Currency '${value}' not found`);

        return res;
    }

    setModelIcon(value, model = this.model) {
        const res = model;

        res.icon_id = parseInt(value, 10);
        res.tileIcon = (res.icon_id !== 0)
            ? App.icons.getItem(res.icon_id)
            : Icon.noIcon();
        assert(res.tileIcon, `Icon '${value}' not found`);

        return res;
    }

    setExpectedAccount(account) {
        this.origAccount = structuredClone(account);

        this.setModelType(account.type);
        this.model.name = account.name.toString();
        this.setModelCurrency(account.curr_id);
        const { precision } = this.model.currObj;

        this.model.initbalance = account.initbalance.toString();
        this.model.fInitBalance = normalize(account.initbalance, precision);

        this.model.balance = account.balance.toString();
        this.model.fBalance = normalize(account.balance, precision);

        this.setModelIcon(account.icon_id);
    }

    getExpectedAccount(model = this.model) {
        const res = {
            type: model.type,
            name: model.name,
            initbalance: model.fInitBalance,
            initlimit: model.fInitLimit,
            curr_id: model.curr_id,
            icon_id: model.icon_id,
            flags: model.flags,
        };
        const { precision } = model.currObj;

        if (model.isUpdate) {
            res.id = model.id;
        }

        const origBalance = (model.isUpdate && this.origAccount)
            ? this.origAccount.balance
            : 0;
        const origInitBalance = (model.isUpdate && this.origAccount)
            ? this.origAccount.initbalance
            : 0;

        res.balance = normalize(origBalance + res.initbalance - origInitBalance, precision);

        const origLimit = (model.isUpdate && this.origAccount) ? this.origAccount.limit : 0;
        const origInitLimit = (model.isUpdate && this.origAccount)
            ? this.origAccount.initlimit
            : 0;

        res.limit = normalize(origLimit + res.initlimit - origInitLimit, precision);

        return res;
    }

    getExpectedState(model = this.model, state = App.state) {
        const account = this.getExpectedAccount(model);
        const accTile = Tile.renderAccount(account);

        if (!model.nameTyped && !model.isUpdate) {
            accTile.title = __('accounts.nameNew');
        }

        accTile.visible = true;

        const isCreditCard = model.type === ACCOUNT_TYPE_CREDIT_CARD;

        const res = {
            header: this.getHeaderExpectedState(state),
            heading: {
                visible: true,
                text: (model.isUpdate) ? __('accounts.update') : __('accounts.create'),
            },
            tile: accTile,
            name: { value: model.name.toString(), visible: true },
            balance: { value: model.initbalance.toString(), visible: true },
            limit: {
                value: model.initlimit.toString(),
                visible: isCreditCard,
            },
            typeDropDown: {
                textValue: getAccountTypeName(model.type),
                visible: true,
            },
            currDropDown: {
                textValue: model.currObj.formatName(this.locale),
                visible: true,
            },
            iconDropDown: {
                textValue: __(`icons.byName.${model.tileIcon.name}`),
                visible: true,
            },
            submitBtn: {
                title: __('actions.submit'),
                visible: true,
            },
            cancelBtn: {
                title: __('actions.cancel'),
                visible: true,
            },
        };

        return res;
    }

    isValid() {
        // Check empty name
        if (this.model.name.length === 0) {
            return false;
        }
        // Check same name exists
        const account = App.state.accounts.findByName(this.model.name);
        if (account && this.model.id !== account.id) {
            return false;
        }

        if (this.model.initbalance.length === 0 || !isValidValue(this.model.initbalance)) {
            return false;
        }

        const isCreditCard = this.model.type === ACCOUNT_TYPE_CREDIT_CARD;
        if (
            isCreditCard
            && (this.model.initlimit.length === 0 || !isValidValue(this.model.initlimit))
        ) {
            return false;
        }

        return true;
    }

    async clickDeleteButton() {
        assert(this.content.isUpdate && this.content.deleteBtn, 'Unexpected action clickDeleteButton');

        return this.performAction(() => this.content.deleteBtn.click());
    }

    /** Click on delete button and confir wanring popup */
    async deleteSelfItem() {
        await this.clickDeleteButton();

        assert(this.content.delete_warning?.content?.visible, 'Delete transaction warning popup not appear');

        await navigation(() => this.content.delete_warning.clickOk());
    }

    async inputName(val) {
        if (this.model.name.length !== val.length) {
            this.model.nameTyped = true;
            this.nameTyped = true;
        }

        this.model.name = val;

        return this.runTestAction(() => this.content.name.input(val));
    }

    onBalanceChanged(value) {
        const { precision } = this.model.currObj;
        const fNewValue = isValidValue(value) ? normalize(value, precision) : value;
        this.model.initbalance = value;
        this.model.fInitBalance = fNewValue;
    }

    onLimitChanged(value) {
        const { precision } = this.model.currObj;
        const fNewValue = isValidValue(value) ? normalize(value, precision) : value;
        this.model.initlimit = value;
        this.model.fInitLimit = fNewValue;
    }

    async inputBalance(val) {
        const { precision } = this.model.currObj;
        const decimal = trimToDigitsLimit(val, precision);
        this.onBalanceChanged(decimal);

        return this.runTestAction(() => this.content.balance.input(val));
    }

    async inputLimit(val) {
        const { precision } = this.model.currObj;
        const decimal = trimToDigitsLimit(val, precision);
        this.onLimitChanged(decimal);

        return this.runTestAction(() => this.content.limit.input(val));
    }

    async changeCurrency(val) {
        const currencyId = parseInt(val, 10);
        this.model.currObj = App.currency.getItem(currencyId);
        assert(this.model.currObj, `Unexpected currency ${val}`);

        this.model.curr_id = this.model.currObj.id;

        const { precision } = this.model.currObj;
        const decimal = trimToDigitsLimit(this.model.initbalance, precision);
        this.onBalanceChanged(decimal);

        return this.runTestAction(() => this.content.currDropDown.setSelection(val));
    }

    async changeType(val) {
        const type = parseInt(val, 10);
        assert.isString(accountTypes[type], `Invalid account type: ${val}`);

        this.model.type = type;

        return this.runTestAction(() => this.content.typeDropDown.setSelection(val));
    }

    async changeIcon(val) {
        let iconObj = App.icons.getItem(val);
        if (val) {
            assert(iconObj, `Icon ${val} not found`);
        }

        if (!val) {
            iconObj = Icon.noIcon();
        }

        this.model.icon_id = iconObj.id;
        this.model.tileIcon = iconObj;

        return this.runTestAction(() => this.content.iconDropDown.setSelection(val));
    }

    async submit() {
        const action = () => this.content.submitBtn.click();

        if (this.isValid()) {
            await navigation(action);
        } else {
            await this.performAction(action);
        }
    }

    async cancel() {
        await navigation(() => this.content.cancelBtn.click());
    }
}
