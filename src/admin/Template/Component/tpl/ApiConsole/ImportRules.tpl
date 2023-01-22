<div id="listRuleForm" class="request-data-form">
    <h3>List import rules</h3>
    <form action="<?= BASEURL ?>api/importrule/list" method="get">
        <div class="std_margin">
            <label class="checkbox">
                <input name="full" type="checkbox" value="true">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">List for all users</span>
            </label>
        </div>
        <div class="std_margin">
            <label class="checkbox">
                <input name="extended" type="checkbox" value="true">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Extended</span>
            </label>
        </div>
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="readRuleForm" class="request-data-form">
    <h3>Read import rules by ids</h3>
    <div class="std_margin">
        <label for="readruleid">Id</label>
        <input id="readruleid" class="stretch-input" type="text">
    </div>
    <div class="form-controls">
        <input id="readrulebtn" class="btn submit-btn" type="button" value="Submit">
    </div>
</div>

<div id="createRuleForm" class="request-data-form">
    <h3>Create import rules</h3>
    <form action="<?= BASEURL ?>api/importrule/create" method="post">
        <div class="std_margin">
            <label for="create_rule_flags">Flags</label>
            <input id="create_rule_flags" class="stretch-input" name="flags" type="text">
        </div>
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="updateRuleForm" class="request-data-form">
    <h3>Update import rules</h3>
    <form action="<?= BASEURL ?>api/importrule/update" method="post">
        <div class="std_margin">
            <label for="update_rule_id">Id</label>
            <input id="update_rule_id" class="stretch-input" name="id" type="text">
        </div>
        <div class="std_margin">
            <label for="update_rule_flags">Flags</label>
            <input id="update_rule_flags" class="stretch-input" name="flags" type="text">
        </div>
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="delRuleForm" class="request-data-form">
    <h3>Delete import rules</h3>
    <div class="std_margin">
        <label for="delrules">Rules (comma separated ids)</label>
        <input id="delrules" class="stretch-input" type="text">
    </div>
    <div class="form-controls">
        <input id="delrulebtn" class="btn submit-btn" type="button" value="Submit">
    </div>
</div>