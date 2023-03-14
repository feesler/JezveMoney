<div id="listActForm" class="request-data-form">
    <h3>List import actions</h3>
    <form action="<?= BASEURL ?>api/importaction/list" method="get">
        <div class="std_margin">
            <label class="checkbox">
                <input name="full" type="checkbox" value="true">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">List for all users</span>
            </label>
        </div>
        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="rule">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Import rule id</span>
            </label>
            <input id="list_act_rule" class="stretch-input" name="rule" type="text" value="0" disabled>
        </div>
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="readActForm" class="request-data-form">
    <h3>Read import actions by ids</h3>
    <div class="std_margin">
        <label for="readactid">Id</label>
        <input id="readactid" class="stretch-input" type="text">
    </div>
    <div class="form-controls">
        <input id="readactbtn" class="btn submit-btn" type="button" value="Submit">
    </div>
</div>

<div id="createActForm" class="request-data-form">
    <h3>Create import action</h3>
    <form action="<?= BASEURL ?>api/importaction/create" method="post">
        <div class="std_margin">
            <label for="create_act_rule">Parent rule id</label>
            <input id="create_act_rule" class="stretch-input" name="rule_id" type="text">
        </div>

        <div class="std_margin">
            <label for="create_act_type">Action type (1-6)</label>
            <input id="create_act_type" class="stretch-input" name="action_id" type="text">
        </div>

        <div class="std_margin">
            <label for="create_act_value">Value</label>
            <input id="create_act_value" class="stretch-input" name="value" type="text">
        </div>

        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="returnState">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Return state</span>
            </label>
            <input class="stretch-input" name="returnState" type="text" disabled>
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="updateActForm" class="request-data-form">
    <h3>Update import action</h3>
    <form action="<?= BASEURL ?>api/importaction/update" method="post">
        <div class="std_margin">
            <label for="update_act_id">Id</label>
            <input id="update_act_id" class="stretch-input" name="id" type="text">
        </div>

        <div class="std_margin">
            <label for="update_act_rule">Parent rule id</label>
            <input id="update_act_rule" class="stretch-input" name="rule_id" type="text">
        </div>

        <div class="std_margin">
            <label for="update_act_type">Action type (1-6)</label>
            <input id="update_act_type" class="stretch-input" name="action_id" type="text">
        </div>

        <div class="std_margin">
            <label for="update_act_value">Value</label>
            <input id="update_act_value" class="stretch-input" name="value" type="text">
        </div>

        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="returnState">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Return state</span>
            </label>
            <input class="stretch-input" name="returnState" type="text" disabled>
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="delActForm" class="request-data-form">
    <h3>Delete import actions</h3>
    <form action="<?= BASEURL ?>api/importaction/delete" method="post">
        <div class="std_margin">
            <label for="delactions">Actions (comma separated ids)</label>
            <input id="delactions" class="stretch-input" name="id" type="text">
        </div>

        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="returnState">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Return state</span>
            </label>
            <input class="stretch-input" name="returnState" type="text" disabled>
        </div>

        <div class="form-controls">
            <input id="delactbtn" class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>