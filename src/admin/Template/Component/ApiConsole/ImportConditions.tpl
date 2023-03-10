<div id="listCondForm" class="request-data-form">
    <h3>List import conditions</h3>
    <form action="<?= BASEURL ?>api/importcond/list" method="get">
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
            <input id="list_cond_rule" class="stretch-input" name="rule" type="text" value="0" disabled>
        </div>
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="readCondForm" class="request-data-form">
    <h3>Read import conditions by ids</h3>
    <div class="std_margin">
        <label for="readcondid">Id</label>
        <input id="readcondid" class="stretch-input" type="text">
    </div>
    <div class="form-controls">
        <input id="readcondbtn" class="btn submit-btn" type="button" value="Submit">
    </div>
</div>

<div id="createCondForm" class="request-data-form">
    <h3>Create import condition</h3>
    <form action="<?= BASEURL ?>api/importcond/create" method="post">
        <div class="std_margin">
            <label for="create_cond_rule">Parent rule id</label>
            <input id="create_cond_rule" class="stretch-input" name="rule_id" type="text">
        </div>

        <div class="std_margin">
            <label for="create_cond_field">Field type (1-8)</label>
            <input id="create_cond_field" class="stretch-input" name="field_id" type="text">
        </div>

        <div class="std_margin">
            <label for="create_cond_op">Operator (1-5)</label>
            <input id="create_cond_op" class="stretch-input" name="operator" type="text">
        </div>

        <div class="std_margin">
            <label for="create_cond_value">Value</label>
            <input id="create_cond_value" class="stretch-input" name="value" type="text">
        </div>

        <div class="std_margin">
            <label for="create_cond_flags">Flags</label>
            <input id="create_cond_flags" class="stretch-input" name="flags" type="text">
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

<div id="updateCondForm" class="request-data-form">
    <h3>Update import condition</h3>
    <form action="<?= BASEURL ?>api/importcond/update" method="post">
        <div class="std_margin">
            <label for="update_cond_id">Id</label>
            <input id="update_cond_id" class="stretch-input" name="id" type="text">
        </div>

        <div class="std_margin">
            <label for="update_cond_rule">Parent rule id</label>
            <input id="update_cond_rule" class="stretch-input" name="rule_id" type="text">
        </div>

        <div class="std_margin">
            <label for="update_cond_field">Field type (1-8)</label>
            <input id="update_cond_field" class="stretch-input" name="field_id" type="text">
        </div>

        <div class="std_margin">
            <label for="update_cond_op">Operator (1-5)</label>
            <input id="update_cond_op" class="stretch-input" name="operator" type="text">
        </div>

        <div class="std_margin">
            <label for="update_cond_value">Value</label>
            <input id="update_cond_value" class="stretch-input" name="value" type="text">
        </div>

        <div class="std_margin">
            <label for="update_cond_flags">Flags</label>
            <input id="update_cond_flags" class="stretch-input" name="flags" type="text">
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

<div id="delCondForm" class="request-data-form">
    <h3>Delete import conditions</h3>
    <form action="<?= BASEURL ?>api/importcond/delete" method="post">
        <div class="std_margin">
            <label for="delconds">Conditions (comma separated ids)</label>
            <input id="delconds" class="stretch-input" name="id" type="text">
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
            <input id="delcondbtn" class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>