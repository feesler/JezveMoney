<?php include(ADMIN_TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <div class="container">
            <div class="content">
                <div class="content_wrap admin_cont_wrap">
                    <h2>Colors</h2>

                    <table class="admin-tbl">
                        <thead>
                            <tr>
                                <th>id</th>
                                <th>value</th>
                                <th>type</th>
                            </tr>
                        </thead>
                        <tbody id="items-list">
                            <?php foreach ($itemsData as $item) {        ?>
                                <tr data-id=<?= e($item->id) ?>>
                                    <td><?= e($item->id) ?></td>
                                    <td><?= e($item->value) ?></td>
                                    <td><?= e($item->type) ?></td>
                                </tr>
                            <?php    }    ?>
                        </tbody>
                    </table>

                    <div class="form-controls">
                        <input id="createbtn" class="btn submit-btn" type="button" value="create">
                        <input id="updbtn" class="btn submit-btn" type="button" value="update" hidden>
                        <input id="del_btn" class="btn submit-btn" type="button" value="delete" hidden>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<form id="item-frm" method="post" action="<?= BASEURL ?>api/color/create" hidden>
    <input id="color_id" name="id" type="hidden">

    <div class="field form-row">
        <label for="color_value" class="field__title">Value</label>
        <input id="color_value" class="input stretch-input" name="value" type="text">
    </div>

    <div class="field form-row">
        <label for="color_type" class="field__title">Type</label>
        <input id="color_type" class="input stretch-input" name="type" type="text">
    </div>

    <div class="form-controls">
        <input class="btn submit-btn" type="submit" value="Submit">
    </div>
</form>

<?php include(ADMIN_TPL_PATH . "Footer.tpl");    ?>