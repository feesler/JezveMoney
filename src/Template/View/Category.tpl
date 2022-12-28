<?php

use JezveMoney\App\Template\Component\IconButton;

include(TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/tpl/Header.tpl");    ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <div class="heading">
                        <h1><?= e($headString) ?></h1>
                        <?php if ($this->action == "update") {        ?>
                            <div class="heading-actions">
                                <?= IconButton::render([
                                    "id" => "deleteBtn",
                                    "classNames" => "circle-icon",
                                    "title" => "Delete",
                                    "icon" => "del"
                                ]) ?>
                            </div>
                        <?php    }    ?>
                    </div>
                    <div>
                        <form id="categoryForm" method="post" action="<?= e(BASEURL . "categories/" . $this->action) ?>/">
                            <?php if ($this->action == "update") {        ?>
                                <input id="categoryId" name="id" type="hidden" value="<?= e($category->id) ?>">
                            <?php    }    ?>
                            <div id="name-inp-block" class="validation-block view-row std_margin">
                                <label for="nameInp">Name</label>
                                <input id="nameInp" class="stretch-input" name="name" type="text" autocomplete="off" value="<?= e($category->name) ?>">
                                <div id="nameFeedback" class="invalid-feedback"></div>
                            </div>

                            <div id="parent-block" class="view-row std_margin">
                                <label for="parent">Parent category</label>
                                <div>
                                    <select id="parent" name="parent_id"></select>
                                </div>
                            </div>

                            <div id="type-block" class="view-row std_margin">
                                <label for="type">Transaction type</label>
                                <div>
                                    <select id="type" name="type"></select>
                                </div>
                            </div>

                            <div class="form-controls">
                                <input id="submitBtn" class="btn submit-btn" type="submit" value="Submit">
                                <a id="cancelBtn" class="btn cancel-btn" href="<?= BASEURL ?>categories/">Cancel</a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>