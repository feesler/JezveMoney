import {
    assert,
    query,
    prop,
    navigation,
    click,
} from 'jezve-test';
import { Button } from 'jezvejs-test';
import { AppView } from './AppView.js';
import { InputField } from './component/Fields/InputField.js';
import { WarningPopup } from './component/WarningPopup.js';
import { App } from '../Application.js';

/** Create or update person test view */
export class PersonView extends AppView {
    async parseContent() {
        const res = {};

        res.headingElem = await query('.heading > h1');
        assert(res.headingElem, 'Heading element not found');
        res.heading = await prop(res.headingElem, 'textContent');

        res.formElem = await query('form');
        assert(res.formElem, 'Form element not found');

        const personIdInp = await query('#pid');
        res.isUpdate = !!personIdInp;
        if (res.isUpdate) {
            res.id = parseInt(await prop(personIdInp, 'value'), 10);
            assert(res.id, 'Wrong account id');
        }

        res.deleteBtn = await Button.create(this, await query('#deleteBtn'));

        res.name = await InputField.create(this, await query('#nameField'));
        assert(res.name, 'Person name input not found');

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

        res.name = cont.name.content.value;
        res.flags = cont.flags;

        return res;
    }

    setExpectedPerson(person) {
        this.model.name = person.name.toString();
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

    getExpectedState(model = this.model, state = App.state) {
        const res = {
            header: this.getHeaderExpectedState(state),
            name: {
                visible: true,
                value: model.name.toString(),
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
        const person = App.state.persons.findByName(this.model.name);
        return !person || this.model.id === person.id;
    }

    async clickDeleteButton() {
        assert(this.content.isUpdate && this.content.deleteBtn, 'Unexpected action clickDeleteButton');

        return this.performAction(() => this.content.deleteBtn.click());
    }

    /** Click on delete button and confirm wanring popup */
    async deleteSelfItem() {
        await this.clickDeleteButton();

        assert(this.content.delete_warning?.content?.visible, 'Delete transaction warning popup not appear');

        await navigation(() => this.content.delete_warning.clickOk());
    }

    async inputName(val) {
        this.model.name = val;
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.name.input(val));
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
