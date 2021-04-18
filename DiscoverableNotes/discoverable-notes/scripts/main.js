let original_method = function () {
    if (this.entry) this.entry.sheet.render(true);
}

let permission_ints = {
    "NONE": 0,
    "LIMITED": 1,
    "OBSERVER": 2,
    "OWNER": 3
}

Hooks.on("closeNoteConfig", function (Note, form) {
    var config = {
        overwriteDefaults: Note.object.data.DN_overwriteDefaults,
        interactionDistance: Note.object.data.DN_interactionDistance,
        partyPickup: Note.object.data.DN_partyPickup,
        pickupPermission: Note.object.data.DN_pickupPermission,
        updatedPermission: Note.object.data.DN_updatedPermission
    }
    console.log(config);
    Note.object.setFlag("discoverable-notes", "config", config);
});

Hooks.on("renderNoteConfig", function (data, html) {
    var content = `<div class="form-group" style="justify-content: center;margin-top: 20px;font-size: 16px;margin-bottom: 10px;">Discoverable Notes Settings</div>
    <script>
        function DN_disable_enable() {
            var elements = document.getElementsByClassName("DN_inputs");
            var box = document.getElementById("DN_overwrite");
            for (var i = 0; i < elements.length; i ++){
                if (box.checked){
                    elements[i].disabled = false;
                } else {
                    elements[i].disabled = true;
                }
            }
        }
    </script>
    <div class="form-group">
        <label>Overwrite Defaults</label>
        <div class="form-fields">
            <input id="DN_overwrite" type="checkbox" name="DN_overwriteDefaults" data-dtype="Boolean" onChange="DN_disable_enable()">
        </div>
    </div>
    <div class="form-group">
        <label>Interaction Distance</label>
        <div class="form-fields">
            <input class="DN_inputs" type="text" data-dtype="Number" name="DN_interactionDistance">
        </div>
    </div>
    <div class="form-group">
        <label>Party Pickup</label>
        <div class="form-fields">
            <input class="DN_inputs" type="checkbox" name="DN_partyPickup" data-dtype="Boolean">
        </div>
    </div>
    <div class="form-group">
        <label>Pickup Permission</label>
        <div class="form-fields">
            <select class="DN_inputs" data-dtype="String" name="DN_pickupPermission">
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
            <select class="DN_inputs" name="DN_updatedPermission" data-dtype="String">
                <option value="NONE">None</option>
                <option value="LIMITED">Limited</option>
                <option value="OBSERVER">Observer</option>
                <option value="OWNER">Owner</option>
            </select>
        </div>
    </div>`
    html.find(".form-group").last().after(content);
    var note = data.object;
    var input = (name) => html.find(`input[name="${name}"]`);
    var config;
    if (hasProperty((note.data), "flags.discoverable-notes") &&
        (config = note.getFlag('discoverable-notes', 'config')) &&
        config.overwriteDefaults == true) {
        // Has edited properties
        input("DN_overwriteDefaults").checked = config.overwrite;
        input("DN_interactionDistance").prop("value", config.interactionDistance);
        input("DN_partyPickup").checked = config.partyPickup;
        var item = $("select[name='DN_pickupPermission'] option[value='" + config.pickupPermission + "']")[0];
        item.setAttribute("selected", true);
        item = $("select[name='DN_updatedPermission'] option[value='" + config.updatedPermission + "']")[0];
        item.setAttribute("selected", true);
    } else {
        input("DN_overwriteDefaults").prop("checked", false);
        input("DN_interactionDistance").prop("value", game.settings.get("discoverable-notes", "InteractionDistance"));
        input("DN_partyPickup").prop("checked", game.settings.get("discoverable-notes", "PartyPickup"));
        var item = $("select[name='DN_pickupPermission'] option[value='" + game.settings.get("discoverable-notes", "PickupPermission") + "']")[0];
        item.setAttribute("selected", true);
        item = $("select[name='DN_updatedPermission'] option[value='" + game.settings.get("discoverable-notes", "UpdatedPermission") + "']")[0];
        item.setAttribute("selected", true);
    }
    var elements = document.getElementsByClassName("DN_inputs");
    var box = document.getElementById("DN_overwrite");
    for (var i = 0; i < elements.length; i++) {
        if (box.checked) {
            elements[i].disabled = false;
        } else {
            elements[i].disabled = true;
        }
    }
});


function getGMId() {
    var targetGM = null;
    game.users.forEach(function(user) {
        if (user.isGM && user.active) {
            targetGM = user;
        }
    });
    return targetGM.id;
}


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
    game.socket.on("module.discoverable-notes", function(data){
        console.log("Discoverable Notes | Socket Message: ", data);
        if (game.user.isGM && game.userId == data.gmID) {
            data.entry.update({
                permission: data.permissions
            });
        }
    });

    Note.prototype.refresh = function () {
        this.position.set(this.data.x, this.data.y);
        this.controlIcon.border.visible = this._hover;
        this.tooltip.visible = this._hover;
        if (this.entry) {
            var config;
            if (hasProperty((this.data), "flags.discoverable-notes") &&
                (config = this.getFlag('discoverable-notes', 'config')) &&
                config.overwriteDefaults == true) {
                // Has edited properties
                this.visible = this.entry.hasPerm(game.user, config.pickupPermission);
            } else {
                // Use module defaults
                this.visible = this.entry.hasPerm(game.user, game.settings.get("discoverable-notes", "PickupPermission"));
            }
        } else {
            this.visible = true;
        }
        return this;
    };

    Note.prototype._canView = function (user) {
        if (this.entry) {
            var config;
            if (hasProperty((this.data), "flags.discoverable-notes") &&
                (config = this.getFlag('discoverable-notes', 'config')) &&
                config.overwriteDefaults == true) {
                // Has edited properties
                return this.entry.hasPerm(game.user, config.pickupPermission);
            } else {
                // Use module defaults
                return this.entry.hasPerm(game.user, game.settings.get("discoverable-notes", "PickupPermission"));
            }
        } else {
            return true;
        }
    }

    
    Note.prototype._onClickLeft2 = function (event) {
        if (!game.user.isGM) {
            var config;
            
            var interactionDistance = 0;
            var updatedPermission = 2;
            var partyPickup = true;

            // Set variables
            if (hasProperty((this.data), "flags.discoverable-notes") &&
                (config = this.getFlag('discoverable-notes', 'config')) &&
                config.overwriteDefaults == true) {
                interactionDistance = config.interactionDistance;
                updatedPermission = permission_ints[config.updatedPermission];
                partyPickup = config.partyPickup;
            } else {
                interactionDistance = game.settings.get("discoverable-notes", "InteractionDistance");
                updatedPermission = permission_ints[game.settings.get("discoverable-notes", "UpdatedPermission")];
                partyPickup = game.settings.get("discoverable-notes", "PartyPickup");
            }

            // Check if note is within range of token
            if (interactionDistance > 0) {
                let character = getFirstPlayerToken();
                if (!character) {
                    ui.notifications.warn("No character selected.");
                    return;
                }
                let dist = getDistance(this, getTokenCenter(character));
                let gridSize = canvas.dimensions.size;
                if ((dist / gridSize) > interactionDistance) {
                    var tokenName = getCharacterName(character);
                    if (tokenName) ui.notifications.warn("Note not within " + tokenName + "'s reach");
                    else ui.notifications.warn("Note not in reach");
                    return;
                }
            }
            var entry = JournalDirectory.collection.get(this.entry.id);
            var permissions = duplicate(entry.data.permission);

            //Check if the user/party already have updated permissions
            if (partyPickup && permissions.default < updatedPermission) {
                var gmID = getGMId();
                if (gmID === null) {
                    ui.notifications.warn("No active GM.");
                    return
                }
                permissions.default = updatedPermission;
                game.socket.emit("module.discoverable-notes", {
                    entry: entry,
                    permissions: permissions,
                    gmID: gmID
                });
            } else if (!partyPickup && permissions[game.userId] < updatedPermission) {
                var gmID = getGMId();
                if (gmID === null) {
                    ui.notifications.warn("No active GM.");
                    return
                }
                permissions[game.userId] = updatedPermission;
                game.socket.emit("module.discoverable-notes", {
                    entry: entry,
                    permissions: permissions,
                    gmID: gmID
                });
            }
        }
        original_method.apply(this, null);
    };
});