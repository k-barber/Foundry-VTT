var Utility_Socket

function setFlagFunction(data, key, value) {
    let object = game.actors.get(data._id);
    object.setFlag("kb-utils", key, value);
}

function createOwnedItemFunction(target_ID, creation_data) {
    let target = game.actors.get(target_ID);
    creation_data = creation_data instanceof Array ? creation_data : [creation_data];
    target.createEmbeddedDocuments("Item", creation_data);
}

function updateActorFunction(target_ID, update_data) {
    let target = game.actors.get(target_ID);
    target.update(update_data);
}

Hooks.once("socketlib.ready", () => {
    Utility_Socket = socketlib.registerModule("kb-utils");
    Utility_Socket.register("setFlag", setFlagFunction);
    Utility_Socket.register("createOwnedItem", createOwnedItemFunction);
    Utility_Socket.register("updateActor", updateActorFunction);
});

Hooks.on("renderChatMessage", (message, html, data) => {
    MessageHandler(message, html, data);
});

Hooks.on("renderActorSheet", (actor, html, data) => {
    html.find("h4:contains(Fraudsword)").prev().css({
        'background-blend-mode': 'luminosity',
        'background-color': '#d000ff87'
    })
});

function MessageHandler(message, html, data) {
    console.log(message.data)
    let speaker = (message.data.speaker?.alias || message.data.speaker?.actor || message.user)
    if (speaker && typeof (speaker) == "string") {
        speaker = speaker.replace(/\W/g, "_");
        html[0].classList.add(speaker + "_Message");
        if (speaker === "Fraudsword") {
            var $image = html.find("h3:contains(Fraudsword)").prev()
            $image.replaceWith(`<div style="height:36px; width:36px; background-color: #d000ff87; background-image:
    url('${$image.attr("src")}'); background-size: contain; box-sizing: border-box; border: 1px solid #000;
    border-radius: 2px; background-blend-mode: luminosity; flex: 0 0 36px; margin-right: 5px;"></div>`);
        }
    }
}

async function CustomPreCreationFunction(wrapped, event, data) {
    await wrapped(event, data)

    const actor = this.actor;
    let sameActor = (data.actorId === actor.id) || (actor.isToken && (data.tokenId === actor.token.id));
    if (!(sameActor)) {
        if (data.actorId) {
            const source = game.actors.get(data.actorId);
            source.deleteEmbeddedDocuments("Item", [data.data._id])
        }
    }
}

function new_url(src) {
    var new_url = src
    if (new_url && new_url.includes("https://foundry-vtt-kb.s3.us-east-2.amazonaws.com") && !new_url.includes("/Maps/")) {
        if (new_url.includes("?")) {
            new_url += "&kb_utils"
        } else {
            new_url += "?kb_utils"
        }
    }
    return new_url
}

function getVertexFunction(x, y) {
    const gs = canvas.dimensions.size * 0.5;
    return [Math.round(x / gs) * gs, Math.round(y / gs) * gs];
}

function tokenClickRange(wrapped, event) {
    if (!game.user.isGM) {
        var interactionDistance = 1;
        if (game.modules.get("arms-reach")) {
            interactionDistance = game.settings.get("arms-reach", "globalInteractionDistance");
            var controlled = canvas.tokens.controlled;
            if (controlled.length == 0) controlled = canvas.tokens.ownedTokens;
            if (!controlled) {
                ui.notifications.error("No character selected");
                return false;
            }
        }

        let dist = getManhattanBetween(this, getTokenCenter(controlled[0]));
        let gridSize = canvas.dimensions.size;

        if ((interactionDistance != 0) && ((dist / gridSize) > interactionDistance)) {
            ui.notifications.error("Token not within reach");
            return false;
        }
    }
    return wrapped(event);
}

Hooks.once('init', () => {
    libWrapper.register("kb-utils", "ActorSheet.prototype._onDropItem", CustomPreCreationFunction, "MIXED");
    libWrapper.register("kb-utils", "TextureLoader.prototype.loadImageTexture", function(wrapped, url){
        return wrapped(new_url(url));
    }, "MIXED");
    // libWrapper.register("kb-utils", "TextureLoader.prototype.getCache", customCacheFunction, "MIXED");
    libWrapper.register("kb-utils", "SquareGrid.prototype._getNearestVertex", getVertexFunction, "OVERRIDE");
    libWrapper.register("kb-utils", "Token.prototype._onClickLeft2", tokenClickRange, "MIXED");
})

Hooks.on("renderSceneControls", (controls, b, c) => {
    x = $("li[data-tooltip='CONTROLS.NoteToggle'] i");
    x.removeClass("fa-map-pin");

    x.addClass("fa-thumbtack");
    x.addClass("fa-sharp");

    x = $("a[data-tooltip='DOCUMENT.Items'] i");
    x.removeClass("fas");
    x.removeClass("fa-suitcase");
    x.addClass("fa-sharp");
    x.addClass("fa-solid");
    x.addClass("fa-box-open-full");

    x = $("a[data-tooltip='DOCUMENT.Scenes'] i");
    x.removeClass("fa-map");
    x.addClass("fa-location-dot");
});