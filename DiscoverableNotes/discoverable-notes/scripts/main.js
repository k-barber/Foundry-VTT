let original_method = Note.prototype._onClickLeft2;

Hooks.on("renderNoteConfig", function (app, html, data) {
    var content = `<div class="form-group" style="justify-content: center;">Discoverable Notes Settings</div>
    <div class="form-group">
        <label>Interaction Distance</label>
        <div class="form-fields">
            <input type="text" data-dtype="Number" name="interactionDistance" value="2">
        </div>
    </div>
    <div class="form-group">
        <label>Party Pickup</label>
        <div class="form-fields">
        </div>
    </div>
    <div class="form-group">
        <label>Pickup Permission</label>
        <div class="form-fields">
            <select data-dtype="String" name="pickupPermission">
                <option value="NONE">None</option>
                <option value="LIMITED">Limited</option>
                <option value="OBSERVER">Observer</option>
                <option value="OWNER">Owner</option>
            </select>
        </div>
    </div>
    <div class="form-group">
        <label>Updated Permission</label>
        <div class="form-fields">
            <select name="updatedPermission" data-dtype="String">
                <option value="NONE">None</option>
                <option value="LIMITED">Limited</option>
                <option value="OBSERVER">Observer</option>
                <option value="OWNER">Owner</option>
            </select>
        </div>
    </div>`
    html.find(".form-group").last().after(content);
});

function getDistance(obj1, obj2) {
    return Math.abs(obj1.x - obj2.x) + Math.abs(obj1.y - obj2.y);
}

// Returns the first selected token or owned token
function getFirstPlayerToken() {
    // Get first token ownted by the player 
    let selectedTokens = getSelectedOrOwnedTokens();
    if (!selectedTokens || selectedTokens.length == 0) return null;
    return selectedTokens[0];
}

// Returns a list of selected (or owned, if no token is selected)
function getSelectedOrOwnedTokens() {
    var controlled = canvas.tokens.controlled;
    if (controlled.length == 0) controlled = canvas.tokens.ownedTokens;
    return controlled;
}

// Get chracter name from token
function getCharacterName(token) {
    var tokenName = null;
    if (token.name) {
        tokenName = token.name;
    } else if (token.actor && token.actor.data && token.actor.data.name) {
        tokenName = token.actor.data.name;
    }
    return tokenName;
}

// Get token center
function getTokenCenter(token) {
    let tokenCenter = {
        x: token.x,
        y: token.y
    };
    tokenCenter.x += -20 + (token.w * 0.50);
    tokenCenter.y += -20 + (token.h * 0.50);
    return tokenCenter;
}

Hooks.once('init', () => {
    Note.prototype.refresh = function () {
        this.position.set(this.data.x, this.data.y);
        this.controlIcon.border.visible = this._hover;
        this.tooltip.visible = this._hover;
        this.visible = this.entry ? this.entry.hasPerm(game.user, game.settings.get("discoverable-notes", "PickupPermission")) : true;
        return this;
    };

    Note.prototype._canView = function (user) {
        return this.entry ? this.entry.hasPerm(game.user, game.settings.get("discoverable-notes", "PickupPermission")) : false
    }

    Note.prototype._onClickLeft2 = function (event) {
        if (!game.user.isGM && game.settings.get("discoverable-notes", "InteractionDistance") > 0) {
            let character = getFirstPlayerToken();
            if (!character) {
                ui.notifications.warn("No character selected.");
                return;
            }
            let dist = getDistance(this, getTokenCenter(character));
            let gridSize = canvas.dimensions.size;
            if ((dist / gridSize) > game.settings.get("discoverable-notes", "InteractionDistance")) {
                var tokenName = getCharacterName(character);
                if (tokenName) ui.notifications.warn("Note not within " + tokenName + "'s reach");
                else ui.notifications.warn("Note not in reach");
                return;
            }
        }
        original_method.apply(this, null);
    };
});