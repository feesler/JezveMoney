<div id="listTplForm" class="request-data-form">
    <h3>List import templates</h3>
    <form action="<?= BASEURL ?>api/importtpl/list" method="get">
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="readTplForm" class="request-data-form">
    <h3>Read templates by ids</h3>
    <div class="std_margin">
        <label for="readtplid">Id</label>
        <input id="readtplid" class="input stretch-input" type="text">
    </div>
    <div class="form-controls">
        <input id="readtplbtn" class="btn submit-btn" type="button" value="Submit">
    </div>
</div>

<div id="createTplForm" class="request-data-form">
    <h3>Create import template</h3>
    <form action="<?= BASEURL ?>api/importtpl/create" method="post">
        <div class="std_margin">
            <label for="create_tpl_name">Name</label>
            <input id="create_tpl_name" class="input stretch-input" name="name" type="text">
        </div>

        <div class="std_margin">
            <label for="create_tpl_type">Type</label>
            <input id="create_tpl_type" class="input stretch-input" name="type_id" type="text">
        </div>

        <div class="std_margin">
            <label for="create_tpl_account">Default account (0 for disabled)</label>
            <input id="create_tpl_account" class="input stretch-input" name="account_id" type="text">
        </div>

        <div class="std_margin">
            <label for="create_first_row">First row (1-based)</label>
            <input id="create_first_row" class="input stretch-input" name="first_row" type="text">
        </div>

        <label>Columns (1-based)</label>
        <?php foreach ($tplColumns as $column) { ?>
            <div class="std_margin">
                <label for="create_tpl_<?= e($column["name"]) ?>"><?= e($column["title"]) ?></label>
                <input id="create_tpl_<?= e($column["name"]) ?>" class="input stretch-input" name="<?= e($column["name"]) ?>" type="text">
            </div>
        <?php   }   ?>

        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="returnState">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Return state</span>
            </label>
            <input class="input stretch-input" name="returnState" type="text" disabled hidden>
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="updateTplForm" class="request-data-form">
    <h3>Update import template</h3>
    <form action="<?= BASEURL ?>api/importtpl/update" method="post">
        <div class="std_margin">
            <label for="update_tpl_id">Id</label>
            <input id="update_tpl_id" class="input stretch-input" name="id" type="text">
        </div>

        <div class="std_margin">
            <label for="update_tpl_name">Name</label>
            <input id="update_tpl_name" class="input stretch-input" name="name" type="text">
        </div>

        <div class="std_margin">
            <label for="update_tpl_type">Type</label>
            <input id="update_tpl_type" class="input stretch-input" name="type_id" type="text">
        </div>

        <div class="std_margin">
            <label for="update_tpl_account">Default account (0 for disabled)</label>
            <input id="update_tpl_account" class="input stretch-input" name="account_id" type="text">
        </div>

        <div class="std_margin">
            <label for="update_first_row">First row (1-based)</label>
            <input id="update_first_row" class="input stretch-input" name="first_row" type="text">
        </div>

        <?php foreach ($tplColumns as $column) { ?>
            <div class="std_margin">
                <label for="update_tpl_<?= e($column["name"]) ?>"><?= e($column["title"]) ?></label>
                <input id="update_tpl_<?= e($column["name"]) ?>" class="input stretch-input" name="<?= e($column["name"]) ?>" type="text">
            </div>
        <?php   }   ?>

        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="returnState">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Return state</span>
            </label>
            <input class="input stretch-input" name="returnState" type="text" disabled hidden>
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="delTplForm" class="request-data-form">
    <h3>Delete import templates</h3>
    <form action="<?= BASEURL ?>api/importtpl/delete" method="post">
        <div class="std_margin">
            <label for="deltemplates">Templates (comma separated ids)</label>
            <input id="deltemplates" class="input stretch-input" name="id" type="text">
        </div>

        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="returnState">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Return state</span>
            </label>
            <input class="input stretch-input" name="returnState" type="text" disabled hidden>
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>