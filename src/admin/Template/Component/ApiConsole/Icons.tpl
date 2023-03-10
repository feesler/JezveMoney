<div id="listIconForm" class="request-data-form">
    <h3>Get icons</h3>
    <form action="<?= BASEURL ?>api/icon/list" method="get">
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="readIconForm" class="request-data-form">
    <h3>Read icon</h3>
    <div class="std_margin">
        <label for="read_icon_id">Id</label>
        <input id="read_icon_id" class="stretch-input" type="text">
    </div>
    <div class="form-controls">
        <input id="read_icon_btn" class="btn submit-btn" type="button" value="Submit">
    </div>
</div>

<div id="createIconForm" class="request-data-form">
    <h3>Create icon</h3>
    <form action="<?= BASEURL ?>api/icon/create" method="post">
        <div class="std_margin">
            <label for="create_icon_name">Name</label>
            <input id="create_icon_name" class="stretch-input" name="name" type="text">
        </div>

        <div class="std_margin">
            <label for="create_icon_file">File name</label>
            <input id="create_icon_file" class="stretch-input" name="file" type="text">
        </div>

        <div class="std_margin">
            <label for="create_icon_type">Type (0 - No type, 1 - Tile icon)</label>
            <input id="create_icon_type" class="stretch-input" name="type" type="text">
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

<div id="updateIconForm" class="request-data-form">
    <h3>Update icon</h3>
    <form action="<?= BASEURL ?>api/icon/update" method="post">
        <div class="std_margin">
            <label for="update_icon_id">Id</label>
            <input id="update_icon_id" class="stretch-input" name="id" type="text">
        </div>

        <div class="std_margin">
            <label for="update_icon_name">Name</label>
            <input id="update_icon_name" class="stretch-input" name="name" type="text">
        </div>

        <div class="std_margin">
            <label for="update_icon_file">File name</label>
            <input id="update_icon_file" class="stretch-input" name="file" type="text">
        </div>

        <div class="std_margin">
            <label for="update_icon_type">Type (0 - No type, 1 - Tile icon)</label>
            <input id="update_icon_type" class="stretch-input" name="type" type="text">
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

<div id="delIconForm" class="request-data-form">
    <h3>Delete icons</h3>
    <form action="<?= BASEURL ?>api/icon/delete" method="post">
        <div class="std_margin">
            <label for="del_icons">Icons (comma separated ids)</label>
            <input id="del_icons" class="stretch-input" name="id" type="text">
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
            <input id="deliconbtn" class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>