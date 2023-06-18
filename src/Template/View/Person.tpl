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
                            <div class="form-controls">
                                <input id="submitBtn" class="btn submit-btn" type="submit" value="<?= __("actions.submit") ?>">
                                <a id="cancelBtn" class="btn cancel-btn" href="<?= e($nextAddress) ?>"><?= __("actions.cancel") ?></a>
                            </div>
                            <?php if ($this->action == "update") {        ?>
                                <input id="pid" name="id" type="hidden" value="<?= e($pInfo->id) ?>">
                            <?php    }    ?>
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