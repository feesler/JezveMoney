<div id="listCategoriesForm" class="request-data-form">
    <h3>List categories</h3>
    <form action="<?= BASEURL ?>api/category/list" method="get">
        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="parent_id">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Parent category</span>
            </label>
            <input class="input stretch-input" name="parent_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" value="" disabled hidden>
        </div>
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="readCategoryForm" class="request-data-form">
    <h3>Read category</h3>
    <div class="std_margin">
        <label for="read_category_id">Id</label>
        <input id="read_category_id" class="input stretch-input" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
    </div>
    <div class="form-controls">
        <input id="readCategoryBtn" class="btn submit-btn" type="button" value="Submit">
    </div>
</div>

<div id="createCategoryForm" class="request-data-form">
    <h3>Create category</h3>
    <form action="<?= BASEURL ?>api/category/create" method="post">
        <div class="std_margin">
            <label for="create_category_name">Name</label>
            <input id="create_category_name" class="input stretch-input" name="name" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="create_category_parent">Parent category (0 for no parent)</label>
            <input id="create_category_parent" class="input stretch-input" name="parent_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="create_category_type">Transaction type (0 for any)</label>
            <input id="create_category_type" class="input stretch-input" name="type" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
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

<div id="updateCategoryForm" class="request-data-form">
    <h3>Update category</h3>
    <form action="<?= BASEURL ?>api/category/update" method="post">
        <div class="std_margin">
            <label for="update_category_id">Id</label>
            <input id="update_category_id" class="input stretch-input" name="id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="update_category_name">Name</label>
            <input id="update_category_name" class="input stretch-input" name="name" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="update_category_parent">Parent category (0 for no parent)</label>
            <input id="update_category_parent" class="input stretch-input" name="parent_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="update_category_type">Transaction type (0 for any)</label>
            <input id="update_category_type" class="input stretch-input" name="type" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
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

<div id="delCategoryForm" class="request-data-form">
    <h3>Delete categories</h3>
    <form action="<?= BASEURL ?>api/category/delete" method="post">
        <div class="std_margin">
            <label for="delCategories">Categories (comma separated ids)</label>
            <input id="delCategories" class="input stretch-input" name="id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <label class="checkbox std_margin">
            <input type="checkbox" name="removeChild" checked>
            <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
            <span class="checkbox__label">Delete child categories</span>
        </label>
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

<div id="setCategoryPosForm" class="request-data-form">
    <h3>Set position of category</h3>
    <form action="<?= BASEURL ?>api/category/setpos" method="post">
        <div class="std_margin">
            <label for="category_pos_id">Id</label>
            <input id="category_pos_id" class="input stretch-input" name="id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="category_pos_pos">Position</label>
            <input id="category_pos_pos" class="input stretch-input" name="pos" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
        </div>
        <div class="std_margin">
            <label for="category_pos_parent">Parent category</label>
            <input id="category_pos_parent" class="input stretch-input" name="parent_id" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">
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