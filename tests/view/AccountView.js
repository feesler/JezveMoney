import {
    assert,
    query,
    prop,
    navigation,
    click,
    copyObject,
} from 'jezve-test';
import { DropDown, IconButton } from 'jezvejs-test';
import { AppView } from './AppView.js';
import { Icon } from '../model/Icon.js';
import { isValidValue, normalize, trimToDigitsLimit } from '../common.js';
import { Tile } from './component/Tiles/Tile.js';
import { InputRow } from './component/InputRow.js';
import { WarningPopup } from './component/WarningPopup.js';
import { App } from '../Application.js';
import { __ } from '../model/locale.js';

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
        res.deleteBtn = await IconButton.create(this, await query('#deleteBtn'));
        res.tile = await Tile.create(this, await query('#accountTile'));

        res.formElem = await query('form');
        assert(res.formElem, 'Form element not found');

        const hiddenEl = await query('#accid');
        res.isUpdate = (!!hiddenEl);
        if (res.isUpdate) {
            res.id = parseInt(await prop(hiddenEl, 'value'), 10);
            assert(res.id, 'Wrong account id');
        }

        res.iconDropDown = await DropDown.createFromChild(this, await query('#icon'));

        res.name = await InputRow.create(this, await query('#name-inp-block'));
        assert(res.name, 'Account name input not found');

        res.currDropDown = await DropDown.createFromChild(this, await query('#currency'));

        res.balance = await InputRow.create(this, await query('#initbal-inp-block'));
        assert(res.name, 'Account balance input not found');

        res.flagsInp = await query('#flags');
        res.flags = parseInt(await prop(res.flagsInp, 'value'), 10);

        res.submitBtn = await query('.form-controls .submit-btn');
        assert(res.submitBtn, 'Submit button not found');

        res.cancelBtn = await query('.form-controls .cancel-btn');
        assert(res.cancelBtn, 'Cancel button not found');

        res.delete_warning = await WarningPopup.create(this, await query('#delete_warning'));

        return res;
    }

    async buildModel(cont) {
        const res = {
            locale: cont.locale,
        };

        res.isUpdate = cont.isUpdate;
        if (res.isUpdate) {
            res.id = cont.id;
        }

        // Name
        res.name = cont.name.content.value;
        res.nameTyped = this.nameTyped;

        // Iniital balance
        res.initbalance = cont.balance.content.value;
        res.fInitBalance = isValidValue(res.initbalance)
            ? normalize(res.initbalance)
            : res.initbalance;

        const origBalance = (res.isUpdate && this.origAccount) ? this.origAccount.balance : 0;
        const origInitBalance = (res.isUpdate && this.origAccount)
            ? this.origAccount.initbalance
            : 0;

        res.balance = origBalance + res.fInitBalance - origInitBalance;
        res.fBalance = res.balance;

        // Currency
        const selectedCurr = cont.currDropDown.content.textValue;
        res.currObj = App.currency.findByName(selectedCurr);
        assert(res.currObj, `Currency '${selectedCurr}' not found`);

        res.curr_id = res.currObj.id;

        // Icon
        let iconObj = App.icons.findByName(cont.iconDropDown.content.textValue);
        if (!iconObj) {
            iconObj = Icon.noIcon(this.locale);
        }
        res.tileIcon = iconObj;
        res.icon_id = iconObj.id;

        // Flags
        res.flags = cont.flags;

        return res;
    }

    setExpectedAccount(account) {
        this.origAccount = copyObject(account);

        this.model.name = account.name.toString();

        this.model.initbalance = account.initbalance.toString();
        this.model.fInitBalance = normalize(account.initbalance);

        this.model.balance = account.balance.toString();
        this.model.fBalance = account.balance;

        this.model.currObj = App.currency.getItem(account.curr_id);
        assert(this.model.currObj, `Unexpected currency ${account.curr_id}`);

        this.model.curr_id = this.model.currObj.id;
        this.model.icon_id = account.icon_id;
    }

    getExpectedAccount(model = this.model) {
        const res = {
            name: model.name,
            initbalance: model.fInitBalance,
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

        res.balance = normalize(origBalance + res.initbalance - origInitBalance);

        return res;
    }

    getExpectedState(model = this.model) {
        const account = this.getExpectedAccount(model);
        const accTile = Tile.renderAccount(account);

        if (!model.nameTyped && !model.isUpdate) {
            accTile.title = __('ACCOUNT_NAME_NEW', this.locale);
        }

        accTile.visible = true;

        const res = {
            header: {
                localeSelect: { value: model.locale },
            },
            heading: { visible: true },
            tile: accTile,
            name: { value: model.name.toString(), visible: true },
            balance: { value: model.initbalance.toString(), visible: true },
            currDropDown: { textValue: model.currObj.name, visible: true },
            iconDropDown: { textValue: model.tileIcon.name, visible: true },
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
        assert(this.content.delete_warning.content.okBtn, 'OK button not found');

        await navigation(() => click(this.content.delete_warning.content.okBtn));
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

    async inputBalance(val) {
        const decimal = trimToDigitsLimit(val, 2);
        const fNewValue = isValidValue(decimal) ? normalize(decimal) : decimal;
        this.model.initbalance = decimal;
        this.model.fInitBalance = fNewValue;
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.balance.input(val));
        return this.checkState();
    }

    async changeCurrency(val) {
        const currencyId = parseInt(val, 10);
        this.model.currObj = App.currency.getItem(currencyId);
        assert(this.model.currObj, `Unexpected currency ${val}`);

        this.model.curr_id = this.model.currObj.id;
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.currDropDown.setSelection(val));
        return this.checkState();
    }

    async changeIcon(val) {
        let iconObj = App.icons.getItem(val);
        if (val) {
            assert(iconObj, `Icon ${val} not found`);
        }

        if (!val) {
            iconObj = Icon.noIcon(this.locale);
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
