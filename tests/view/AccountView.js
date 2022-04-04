import { copyObject } from 'jezvejs';
import { AppComponent } from './component/AppComponent.js';
import { AppView } from './AppView.js';
import { Currency } from '../model/Currency.js';
import { Icon } from '../model/Icon.js';
import { isValidValue, normalize } from '../common.js';
import { Tile } from './component/Tile.js';
import { DropDown } from './component/DropDown.js';
import { InputRow } from './component/InputRow.js';
import { IconLink } from './component/IconLink.js';
import { WarningPopup } from './component/WarningPopup.js';

/** Create or update account view class */
export class AccountView extends AppView {
    constructor(...args) {
        super(...args);

        this.nameTyped = false;
    }

    async buildModel(cont) {
        const res = {};

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
        res.currObj = Currency.findByName(selectedCurr);
        if (!res.currObj) {
            throw new Error(`Currency '${selectedCurr}' not found`);
        }

        res.curr_id = res.currObj.id;

        // Icon
        let iconObj = Icon.findByName(cont.iconDropDown.content.textValue);
        if (!iconObj) {
            iconObj = Icon.noIcon();
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

        this.model.currObj = Currency.getById(account.curr_id);
        if (!this.model.currObj) {
            throw new Error(`Unexpected currency ${account.curr_id}`);
        }

        this.model.curr_id = this.model.currObj.id;
        this.model.icon_id = account.icon_id;

        this.setExpectedState();
    }

    getExpectedAccount() {
        const res = {
            name: this.model.name,
            initbalance: this.model.fInitBalance,
            curr_id: this.model.curr_id,
            icon_id: this.model.icon_id,
            flags: this.model.flags,
        };

        if (this.model.isUpdate) {
            res.id = this.model.id;
        }

        const origBalance = (this.model.isUpdate && this.origAccount)
            ? this.origAccount.balance
            : 0;
        const origInitBalance = (this.model.isUpdate && this.origAccount)
            ? this.origAccount.initbalance
            : 0;

        res.balance = normalize(origBalance + res.initbalance - origInitBalance);

        return res;
    }

    setExpectedState() {
        const account = this.getExpectedAccount();
        const accTile = Tile.renderAccount(account);

        if (!this.model.nameTyped && !this.model.isUpdate) {
            accTile.name = 'New account';
        }

        const res = {
            visibility: {
                heading: true,
                tile: true,
                iconDropDown: true,
                name: true,
                currDropDown: true,
            },
            values: {
                tile: accTile,
                name: { value: this.model.name.toString() },
                balance: { value: this.model.initbalance.toString() },
                currDropDown: { textValue: this.model.currObj.name },
                iconDropDown: { textValue: this.model.tileIcon.name },
            },
        };

        this.expectedState = res;

        return res;
    }

    async parseContent() {
        const res = {};

        res.heading = { elem: await this.query('.heading > h1') };
        if (!res.heading.elem) {
            throw new Error('Heading element not found');
        }
        res.heading.text = await this.prop(res.heading.elem, 'textContent');
        res.delBtn = await IconLink.create(this, await this.query('#del_btn'));
        res.tile = await Tile.create(this, await this.query('#acc_tile'));

        res.formElem = await this.query('form');
        if (!res.formElem) {
            throw new Error('Form element not found');
        }

        const hiddenEl = await this.query('#accid');
        res.isUpdate = (!!hiddenEl);
        if (res.isUpdate) {
            res.id = parseInt(await this.prop(hiddenEl, 'value'), 10);
            if (!res.id) {
                throw new Error('Wrong account id');
            }
        }

        let curChildren = (res.isUpdate) ? 3 : 2;

        res.iconDropDown = await DropDown.createFromChild(this, await this.query('#icon'));

        curChildren += 1;
        let elem = await this.query(`form > *:nth-child(${curChildren})`);
        res.name = await InputRow.create(this, elem);
        if (!res.name) {
            throw new Error('Account name input not found');
        }

        curChildren += 1;
        res.currDropDown = await DropDown.createFromChild(this, await this.query('#currency'));

        curChildren += 1;
        elem = await this.query(`form > *:nth-child(${curChildren})`);

        res.balance = await InputRow.create(this, elem);

        res.flagsInp = await this.query('#flags');
        res.flags = parseInt(await this.prop(res.flagsInp, 'value'), 10);

        res.submitBtn = await this.query('.acc_controls .submit-btn');
        if (!res.submitBtn) {
            throw new Error('Submit button not found');
        }

        res.cancelBtn = await this.query('.acc_controls .cancel-btn');
        if (!res.cancelBtn) {
            throw new Error('Cancel button not found');
        }

        res.delete_warning = await WarningPopup.create(this, await this.query('#delete_warning'));

        return res;
    }

    isValid() {
        return (this.model.name.length > 0)
            && this.model.initbalance.length
            && isValidValue(this.model.initbalance);
    }

    async clickDeleteButton() {
        if (!this.content.isUpdate || !this.content.delBtn) {
            throw new Error('Unexpected action clickDeleteButton');
        }

        return this.performAction(() => this.content.delBtn.click());
    }

    /** Click on delete button and confir wanring popup */
    async deleteSelfItem() {
        await this.clickDeleteButton();

        if (!await AppComponent.isVisible(this.content.delete_warning)) {
            throw new Error('Delete transaction warning popup not appear');
        }
        if (!this.content.delete_warning.content.okBtn) {
            throw new Error('OK button not found');
        }

        await this.navigation(() => this.click(this.content.delete_warning.content.okBtn));
    }

    async inputName(val) {
        if (this.model.name.length !== val.length) {
            this.model.nameTyped = true;
            this.nameTyped = true;
        }

        this.model.name = val;
        this.setExpectedState();

        await this.performAction(() => this.content.name.input(val));
        return this.checkState();
    }

    async inputBalance(val) {
        const fNewValue = isValidValue(val) ? normalize(val) : val;
        this.model.initbalance = val;
        this.model.fInitBalance = fNewValue;
        this.setExpectedState();

        await this.performAction(() => this.content.balance.input(val));
        return this.checkState();
    }

    async changeCurrency(val) {
        const currencyId = parseInt(val, 10);
        this.model.currObj = Currency.getById(currencyId);
        if (!this.model.currObj) {
            throw new Error(`Unexpected currency ${val}`);
        }

        this.model.curr_id = this.model.currObj.id;
        this.setExpectedState();

        await this.performAction(() => this.content.currDropDown.setSelection(val));
        return this.checkState();
    }

    async changeIcon(val) {
        let iconObj = Icon.getItem(val);
        if (val && !iconObj) {
            throw new Error(`Icon ${val} not found`);
        }

        if (!val) {
            iconObj = Icon.noIcon();
        }

        this.model.icon_id = iconObj.id;
        this.model.tileIcon = iconObj;
        this.setExpectedState();

        await this.performAction(() => this.content.iconDropDown.setSelection(val));
        return this.checkState();
    }

    async submit() {
        const action = () => this.click(this.content.submitBtn);

        if (this.isValid()) {
            await this.navigation(action);
        } else {
            await this.performAction(action);
        }
    }

    async cancel() {
        await this.navigation(() => this.click(this.content.cancelBtn));
    }
}
