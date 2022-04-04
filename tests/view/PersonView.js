import { AppComponent } from './component/AppComponent.js';
import { AppView } from './AppView.js';
import { InputRow } from './component/InputRow.js';
import { IconLink } from './component/IconLink.js';
import { WarningPopup } from './component/WarningPopup.js';

/** Create or update account view tests */
export class PersonView extends AppView {
    async parseContent() {
        const res = {};

        res.headingElem = await this.query('.heading > h1');
        if (!res.headingElem) {
            throw new Error('Heading element not found');
        }
        res.heading = await this.prop(res.headingElem, 'textContent');

        res.formElem = await this.query('form');
        if (!res.formElem) {
            throw new Error('Form element not found');
        }

        const personIdInp = await this.query('#pid');
        res.isUpdate = !!personIdInp;
        if (res.isUpdate) {
            res.id = parseInt(await this.prop(personIdInp, 'value'), 10);
            if (!res.id) {
                throw new Error('Wrong account id');
            }
        }

        res.delBtn = await IconLink.create(this, await this.query('#del_btn'));

        res.name = await InputRow.create(this, await this.query(res.formElem, 'div.view-row'));
        if (!res.name) {
            throw new Error('Person name input not found');
        }

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

    async buildModel(cont) {
        const res = {};

        res.isUpdate = cont.isUpdate;
        if (res.isUpdate) {
            res.id = cont.id;
        }

        res.name = cont.name.content.value;
        res.flags = cont.flags;

        return res;
    }

    getExpectedPerson() {
        const res = {
            name: this.model.name,
            flags: this.model.flags,
        };

        if (this.model.isUpdate) {
            res.id = this.model.id;
        }

        return res;
    }

    isValid() {
        return (this.model.name && this.model.name.length > 0);
    }

    async clickDeleteButton() {
        if (!this.content.isUpdate || !this.content.delBtn) {
            throw new Error('Unexpected action clickDeleteButton');
        }

        return this.performAction(() => this.content.delBtn.click());
    }

    /** Click on delete button and confirm wanring popup */
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
        return this.performAction(() => this.content.name.input(val));
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
