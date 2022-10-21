<form <?= $attributes ?> class="validation-block">
    <div class="input-group">
        <input class="input-group__input stretch-input" name="stdate" type="text" autocomplete="off" value="<?= e($start) ?>">
        <div class="input-group__text">-</div>
        <input class="input-group__input stretch-input" name="enddate" type="text" autocomplete="off" value="<?= e($end) ?>">
        <button class="input-group__inner-btn clear-btn" type="button" <?= hidden($hideClearButton) ?>>
            <?= svgIcon("close", "input-group__inner-btn__icon") ?>
        </button>
        <button class="btn icon-btn input-group__btn dp-btn" type="button">
            <?= useIcon("calendar-icon", "icon calendar-icon") ?>
        </button>
    </div>
    <input type="submit" hidden>
    <div class="calendar"></div>
    <div class="invalid-feedback">Input correct date range.</div>
</form>