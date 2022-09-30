<div class="rules-dialog" hidden>
    <div class="rules-header">
        <label>Import rules</label>
        <input class="btn link-btn create-btn" type="button" value="Create">
    </div>
    <div id="searchField" class="input-group search-field">
        <input id="searchInp" class="input-group__input stretch-input" name="search" type="text" autocomplete="off" placeholder="Type to filter" value="">
        <button id="clearSearchBtn" class="input-group__inner-btn" type="button" hidden>
            <?= svgIcon("close", "input-group__inner-btn__icon") ?>
        </button>
        <button class="input-group__inner-btn search-btn" type="button"><?= svgIcon("search", "icon search-icon") ?></button>
    </div>
    <div class="rules-list"></div>
</div>