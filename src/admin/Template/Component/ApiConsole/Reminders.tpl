<div id="listReminderForm" class="request-data-form">
    <h3>List</h3>
    <form action="<?= BASEURL ?>api/reminder/list" method="get">
        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="schedule_id">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Schedule id</span>
            </label>
            <input class="input stretch-input" name="schedule_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" value="" disabled hidden>
        </div>

        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="state">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">State</span>
            </label>
            <input class="input stretch-input" name="state" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" value="" disabled hidden>
        </div>

        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="date">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Date</span>
            </label>
            <input class="input stretch-input" name="date" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" value="" disabled hidden>
        </div>

        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="transaction_id">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Transaction id</span>
            </label>
            <input class="input stretch-input" name="transaction_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" value="" disabled hidden>
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="readReminderForm" class="request-data-form">
    <h3>Read by ids</h3>
    <div class="std_margin">
        <label for="read_reminder_id">Id</label>
        <input id="read_reminder_id" class="input stretch-input" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
    </div>
    <div class="form-controls">
        <input id="readRemindersBtn" class="btn submit-btn" type="button" value="Submit">
    </div>
</div>

<div id="confirmReminderForm" class="request-data-form">
    <h3>Confirm reminder</h3>
    <form action="<?= BASEURL ?>api/reminder/confirm" method="post">
        <div class="std_margin">
            <label for="confirm_reminder_id">Reminder id</label>
            <input id="confirm_reminder_id" class="input stretch-input" name="id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="transaction_id">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Transaction id</span>
            </label>
            <input class="input stretch-input" name="transaction_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" value="" disabled hidden>
        </div>

        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="returnState">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Return state</span>
            </label>
            <input class="input stretch-input" name="returnState" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" disabled hidden>
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="cancelReminderForm" class="request-data-form">
    <h3>Cancel reminder</h3>
    <form action="<?= BASEURL ?>api/reminder/cancel" method="post">
        <div class="std_margin">
            <label for="cancel_reminder_id">Reminder id</label>
            <input id="cancel_reminder_id" class="input stretch-input" name="id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>

        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="returnState">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Return state</span>
            </label>
            <input class="input stretch-input" name="returnState" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" disabled hidden>
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>