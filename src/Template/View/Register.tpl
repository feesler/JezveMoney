<?php include(TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/Header.tpl");        ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <main class="form-container">
                        <div class="register-form">
                            <h1><?= __("REGISTRATION") ?></h1>

                            <form id="form" action="<?= BASEURL ?>register/" method="post">
                                <div class="form-controls">
                                    <input class="btn submit-btn" type="submit" value="<?= __("SUBMIT") ?>">
                                    <a class="alter-link" href="<?= BASEURL ?>login/"><?= __("CANCEL") ?></a>
                                </div>
                            </form>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(TPL_PATH . "Footer.tpl");    ?>