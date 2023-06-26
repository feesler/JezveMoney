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
                        <form id="categoryForm" method="post" action="<?= e(BASEURL . "categories/" . $this->action) ?>/">
                            <?php if ($this->action == "update") {        ?>
                                <input id="categoryId" name="id" type="hidden" value="<?= e($category->id) ?>">
                            <?php    }    ?>
                            <div id="parentCategoryField" class="field form-row">
                                <label for="parent" class="field__title"><?= __("categories.parent") ?></label>
                                <select id="parent" name="parent_id"></select>
                            </div>

                            <hr class="form-separator">

                            <div id="typeField" class="field form-row">
                                <label for="type" class="field__title"><?= __("categories.transactionType") ?></label>
                                <select id="type" name="type"></select>
                            </div>
                        </form>
                    </main>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>