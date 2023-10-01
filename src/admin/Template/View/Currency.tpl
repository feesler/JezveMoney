<?php include(ADMIN_TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <div class="container">
            <div class="content">
                <div class="content_wrap admin_cont_wrap">
                    <h2>Currencies</h2>

                    <table class="admin-tbl">
                        <thead>
                            <tr>
                                <th>id</th>
                                <th>name</th>
                                <th>code</th>
                                <th>sign</th>
                                <th>precision</th>
                                <th>flags</th>
                            </tr>
                        </thead>
                        <tbody id="items-list">
                            <?php foreach ($itemsData as $currInfo) {        ?>
                                <tr data-id=<?= e($currInfo->id) ?>>
                                    <td><?= e($currInfo->id) ?></td>
                                    <td><?= e($currInfo->name) ?></td>
                                    <td><?= e($currInfo->code) ?></td>
                                    <td><?= e($currInfo->sign) ?></td>
                                    <td><?= e($currInfo->precision) ?></td>
                                    <td><?= e($currInfo->flags) ?></td>
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

<form id="item-frm" method="post" action="<?= BASEURL ?>api/currency/create" hidden>
    <input id="curr_id" name="id" type="hidden">

    <div class="field form-row">
        <label for="curr_name" class="field__title">Name</label>
        <input id="curr_name" class="input stretch-input" name="name" type="text">
    </div>

    <div class="field form-row">
        <label for="curr_code" class="field__title">Code</label>
        <input id="curr_code" class="input stretch-input" name="code" type="text">
    </div>

    <div class="field form-row">
        <label for="curr_sign" class="field__title">Sign</label>
        <input id="curr_sign" class="input stretch-input" name="sign" type="text">
    </div>

    <div class="field form-row">
        <label for="curr_precision" class="field__title">Precision</label>
        <input id="curr_precision" class="input stretch-input" name="precision" type="text">
    </div>

    <div class="field form-row">
        <div class="checkbox-wrap">
            <label for="isbefore"><input id="isbefore" name="flags" type="radio" value="1">Sign before value</label>
        </div>
        <div class="checkbox-wrap">
            <label for="isafter"><input id="isafter" name="flags" type="radio" value="0">Sign after value</label>
        </div>
    </div>

    <div class="field form-row">
        <label class="checkbox std_margin">
            <input id="trailingZerosCheck" type="checkbox">
            <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
            <span class="checkbox__label">Format trailing zeros</span>
        </label>
    </div>

    <div class="form-controls">
        <input class="btn submit-btn" type="submit" value="Submit">
    </div>
</form>

<?php include(ADMIN_TPL_PATH . "Footer.tpl");    ?>