<?php

use JezveMoney\App\Template\Component\Button;

include(TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/tpl/Header.tpl");    ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <header class="heading">
                        <h1><?= e($headString) ?></h1>
                        <?php if ($this->action == "update") {        ?>
                            <div class="heading-actions">
                                <?= Button::render([
                                    "id" => "deleteBtn",
                                    "classNames" => "warning-btn",
                                    "title" => __("DELETE"),
                                    "icon" => "del",
                                ]) ?>
                            </div>
                        <?php    }    ?>
                    </header>
                    <main>
                        <form id="personForm" method="post" action="<?= e(BASEURL . "persons/" . $this->action) ?>/">
                            <?php if ($this->action == "update") {        ?>
                                <input id="pid" name="id" type="hidden" value="<?= e($pInfo->id) ?>">
                            <?php    }    ?>
                            <div id="name-inp-block" class="validation-block view-row std_margin">
                                <label for="nameInp"><?= __("PERSON_NAME") ?></label>
                                <input id="nameInp" class="stretch-input" name="name" type="text" autocomplete="off" value="<?= e($pInfo->name) ?>">
                                <div id="nameFeedback" class="feedback invalid-feedback"></div>
                            </div>

                            <div class="form-controls">
                                <input id="submitBtn" class="btn submit-btn" type="submit" value="<?= __("SUBMIT") ?>">
                                <a id="cancelBtn" class="btn cancel-btn" href="<?= e($nextAddress) ?>"><?= __("CANCEL") ?></a>
                            </div>
                            <input id="flags" name="flags" type="hidden" value="<?= e($pInfo->flags) ?>">
                        </form>
                    </main>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>