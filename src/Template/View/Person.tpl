<?php include(TPL_PATH . "Header.tpl"); ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/Header.tpl");    ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <header id="heading" class="heading">
                        <h1><?= e($headString) ?></h1>
                        <div class="heading-actions"></div>
                    </header>

                    <main>
                        <form id="personForm" method="post" action="<?= e(BASEURL . "persons/" . $this->action) ?>/">
                            <?php if ($this->action == "update") {        ?>
                                <input id="pid" name="id" type="hidden" value="<?= e($pInfo->id) ?>">
                            <?php    }    ?>
                            <div id="name-inp-block" class="field form-row validation-block">
                                <label for="nameInp" class="field__title"><?= __("PERSON_NAME") ?></label>
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