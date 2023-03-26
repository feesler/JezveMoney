import {
    assert,
    query,
    prop,
    navigation,
    click,
    copyObject,
} from 'jezve-test';
import { DropDown, Button } from 'jezvejs-test';
import { AppView } from './AppView.js';
import { Icon } from '../model/Icon.js';
import { isValidValue, normalize, trimToDigitsLimit } from '../common.js';
import { Tile } from './component/Tiles/Tile.js';
import { InputRow } from './component/InputRow.js';
import { WarningPopup } from './component/WarningPopup.js';
import { App } from '../Application.js';
import { __ } from '../model/locale.js';
import { accountTypes, ACCOUNT_TYPE_CREDIT_CARD, getAccountTypeName } from '../model/AccountsList.js';

/** Account view class */
export class AccountView extends AppView {
    constructor(...args) {
        super(...args);

        this.nameTyped = false;
    }

    async parseContent() {
        const res = {};

        res.heading = { elem: await query('.heading > h1') };
        assert(res.heading.elem, 'Heading element not found');
        res.heading.text = await prop(res.heading.elem, 'textContent');
        res.deleteBtn = await Button.create(this, await query('#deleteBtn'));
        res.tile = await Tile.create(this, await query('#accountTile'));

        res.formElem = await query('form');
        assert(res.formElem, 'Form element not found');

        const hiddenEl = await query('#accid');
        res.isUpdate = (!!hiddenEl);
        if (res.isUpdate) {
            res.id = parseInt(await prop(hiddenEl, 'value'), 10);
            assert(res.id, 'Wrong account id');
        }

        res.typeDropDown = await DropDown.createFromChild(this, await query('#type'));

        res.iconDropDown = await DropDown.create(this, await query('#iconField .icon-select'));

        res.name = await InputRow.create(this, await query('#name-inp-block'));
        assert(res.name, 'Account name input not found');

        res.currDropDown = await DropDown.createFromChild(this, await query('#currency'));

        res.balance = await InputRow.create(this, await query('#initbal-inp-block'));
        assert(res.name, 'Account balance input not found');

        res.limit = await InputRow.create(this, await query('#limitField'));
        assert(res.limit, 'Credit limit field not found');

        res.flagsInp = await query('#flags');
        res.flags = parseInt(await prop(res.flagsInp, 'value'), 10);

        res.submitBtn = await query('.form-controls .submit-btn');
        assert(res.submitBtn, 'Submit button not found');

        res.cancelBtn = await query('.form-controls .cancel-btn');
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

        // Iniital balance
        res.initbalance = cont.balance.value;
        res.fInitBalance = isValidValue(res.initbalance)
            ? normalize(res.initbalance, res.currObj.precision)
            : res.initbalance;

        const origBalance = (res.isUpdate && this.origAccount) ? this.origAccount.balance : 0;
        const origInitBalance = (res.isUpdate && this.origAccount)
            ? this.origAccount.initbalance
            : 0;

        res.balance = origBalance + res.fInitBalance - origInitBalance;
        res.fBalance = res.balance;

        // Credit limit
        res.limit = cont.limit.value;
        res.fLimit = isValidValue(res.limit)
            ? normalize(res.limit, res.currObj.precision)
            : res.limit;

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
        this.origAccount = copyObject(account);

        this.setModelType(account.type);
        this.model.name = account.name.toString();
        this.setModelCurrency(account.curr_id);

        this.model.initbalance = account.initbalance.toString();
        this.model.fInitBalance = normalize(account.initbalance, this.model.currObj.precision);

        this.model.balance = account.balance.toString();
        this.model.fBalance = account.balance;

        this.setModelIcon(account.icon_id);
    }

    getExpectedAccount(model = this.model) {
        const res = {
            type: model.type,
            name: model.name,
            initbalance: model.fInitBalance,
            limit: model.fLimit,
            curr_id: model.curr_id,
            icon_id: model.icon_id,
            flags: model.flags,
        };

        if (model.isUpdate) {
            res.id = model.id;
        }

        const origBalance = (model.isUpdate && this.origAccount)
            ? this.origAccount.balance
            : 0;
        const origInitBalance = (model.isUpdate && this.origAccount)
            ? this.origAccount.initbalance
            : 0;

        res.balance = normalize(
            origBalance + res.initbalance - origInitBalance,
            model.currObj.precision,
        );

        return res;
    }

    getExpectedState(model = this.model) {
        const account = this.getExpectedAccount(model);
        const accTile = Tile.renderAccount(account);

        if (!model.nameTyped && !model.isUpdate) {
            accTile.title = __('ACCOUNT_NAME_NEW', this.locale);
        }

        accTile.visible = true;

        const isCreditCard = model.type === ACCOUNT_TYPE_CREDIT_CARD;

        const res = {
            heading: { visible: true },
            tile: accTile,
            name: { value: model.name.toString(), visible: true },
            balance: { value: model.initbalance.toString(), visible: true },
            limit: {
                value: model.limit.toString(),
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
                textValue: __(model.tileIcon.name, this.locale),
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

        return (
            this.model.initbalance.length > 0
            && isValidValue(this.model.initbalance)
            && this.model.limit.length > 0
            && isValidValue(this.model.limit)
        );
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
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.name.input(val));
        return this.checkState();
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
        this.model.limit = value;
        this.model.fLimit = fNewValue;
    }

    async inputBalance(val) {
        const { precision } = this.model.currObj;
        const decimal = trimToDigitsLimit(val, precision);
        this.onBalanceChanged(decimal);
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.balance.input(val));
        return this.checkState();
    }

    async inputLimit(val) {
        const { precision } = this.model.currObj;
        const decimal = trimToDigitsLimit(val, precision);
        this.onLimitChanged(decimal);
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.limit.input(val));
        return this.checkState();
    }

    async changeCurrency(val) {
        const currencyId = parseInt(val, 10);
        this.model.currObj = App.currency.getItem(currencyId);
        assert(this.model.currObj, `Unexpected currency ${val}`);

        this.model.curr_id = this.model.currObj.id;

        const { precision } = this.model.currObj;
        const decimal = trimToDigitsLimit(this.model.initbalance, precision);
        this.onBalanceChanged(decimal);
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.currDropDown.setSelection(val));
        return this.checkState();
    }

    async changeType(val) {
        const type = parseInt(val, 10);
        assert.isString(accountTypes[type], `Invalid account type: ${val}`);

        this.model.type = type;
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.typeDropDown.setSelection(val));
        return this.checkState();
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
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.iconDropDown.setSelection(val));
        return this.checkState();
    }

    async submit() {
        const action = () => click(this.content.submitBtn);

        if (this.isValid()) {
            await navigation(action);
        } else {
            await this.performAction(action);
        }
    }

    async cancel() {
        await navigation(() => click(this.content.cancelBtn));
    }
}
