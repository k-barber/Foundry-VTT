var Utility_Socket;

function setFlagFunction(data, key, value) {
    let object = game.actors.get(data._id);
    object.setFlag("kb-utils", key, value);
}

function createOwnedItemFunction(target_ID, creation_data) {
    let target = game.actors.get(target_ID);
    creation_data = creation_data instanceof Array ? creation_data : [creation_data];
    target.createEmbeddedDocuments("Item", creation_data);
}

function updateActorFunction(target, update_data) {
    var actor;
    if (typeof target === "object"){
        var documentName;
        if (target.documentName){
            documentName = target.documentName;
        } else if (target.document) {
            documentName = target.document.documentName;
        } else {
            ui.notifications.error("Could not find document in: " + target);
            return
        }
        switch (documentName) {
            case "Actor":
                actor = game.actors.get(target.id);
                break;
            case "Token":
                actor = canvas.tokens.get(target.id).document.actor;
                break;
            default:
                break;
        }
    } else if (typeof target === "string"){
        actor = game.actors.get(target_ID);
    } else {
        ui.notifications.error("Could not find actor: " + target);
        return;
    }
    return actor.update(update_data);
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
    let speaker = (message.speaker?.alias || message.speaker?.actor || message.user)
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

    var timestamp;
    if (message?.flags["kb-utils"]) {
        timestamp = message?.flags["kb-utils"]?.gametime;
    } else {
        timestamp = SimpleCalendar.api.timestamp();
        if (game?.user?.isGM) {
            message.setFlag("kb-utils", "gametime", timestamp)
        }
    }
    var meta_data = html.find(".message-metadata")[0];
    var date = SimpleCalendar.api.timestampToDate(timestamp);
    var datestamp = date.display.time + " " + date.display.date;
    var span = document.createElement("span");
    span.className = "message-gametime";
    span.title = datestamp;
    span.textContent = `${gameTimeSince(timestamp)} | `;
    meta_data.prepend(span);
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

/**
 * Express a timestamp as a relative string
 * @param {Date|string} timeStamp   A timestamp string or Date object to be formatted as a relative time
 * @return {string}                 A string expression for the relative time
 */
function gameTimeSince(timeStamp) {
    const now = SimpleCalendar.api.timestamp();
    const current_cal = SimpleCalendar.api.getCurrentCalendar();
    const secondsInMinute = current_cal.time.secondsInMinute;
    const minutesInHour = current_cal.time.minutesInHour;
    const hoursInDay = current_cal.time.hoursInDay
    const secondsInHour = secondsInMinute * minutesInHour;
    const secondsInDay = secondsInMinute * minutesInHour * hoursInDay;

    const secondsPast = (now - timeStamp);
    let since = "";

    // Format the time
    if (secondsPast < secondsInMinute) {
        since = Math.abs(secondsPast);
        if (since < 1) return game.i18n.localize("TIME.Now");
        else since = Math.round(since) + game.i18n.localize("TIME.SecondsAbbreviation");
    } else if (secondsPast < secondsInHour) since = Math.round(secondsPast / secondsInMinute) + game.i18n.localize("TIME.MinutesAbbreviation");
    else if (secondsPast <= secondsInDay) since = Math.round(secondsPast / secondsInHour) + game.i18n.localize("TIME.HoursAbbreviation");
    else {
        const hours = Math.round(secondsPast / secondsInHour);
        const days = Math.floor(hours / hoursInDay);
        since = `${days}${game.i18n.localize("TIME.DaysAbbreviation")} ${hours % hoursInDay}${game.i18n.localize("TIME.HoursAbbreviation")}`;
    }

    if (now > timeStamp) {
        return game.i18n.format("TIME.Since", {
            since: since
        });
    } else {
        return game.i18n.format("In {since}", {
            since: since
        });
    }
}

Hooks.once('init', () => {
    libWrapper.register("kb-utils", "ActorSheet.prototype._onDropItem", CustomPreCreationFunction, "MIXED");
    libWrapper.register("kb-utils", "TextureLoader.prototype.loadImageTexture", function (wrapped, url) {
        return wrapped(new_url(url));
    }, "MIXED");
    // libWrapper.register("kb-utils", "TextureLoader.prototype.getCache", customCacheFunction, "MIXED");
    libWrapper.register("kb-utils", "SquareGrid.prototype._getNearestVertex", getVertexFunction, "OVERRIDE");
    libWrapper.register("kb-utils", "Token.prototype._onClickLeft2", tokenClickRange, "MIXED");
    libWrapper.register("kb-utils", "ChatLog.prototype.updateTimestamps", function (wrapped, ...args) {
        const messages = this.element.find("#chat-log .message");
        for (let li of messages) {
            const message = game.messages.get(li.dataset.messageId);
            if (!message?.flags["kb-utils"]) return;
            const stamp = li.querySelector(".message-gametime");
            stamp.textContent = gameTimeSince(message?.flags["kb-utils"]?.gametime) + " | ";
        }
        wrapped(...args);
    }, "MIXED");
})

Hooks.on("renderSceneControls", (controls, b, c) => {
    x = $("li[data-tooltip='CONTROLS.NoteToggle'] i");
    x.removeClass("fa-map-pin");

    x.addClass("fa-thumbtack");

    x = $("a[data-tooltip='DOCUMENT.Items'] i");
    x.removeClass("fas");
    x.removeClass("fa-suitcase");

    x.addClass("fa-solid");
    x.addClass("fa-box-open-full");

    x = $("a[data-tooltip='DOCUMENT.Scenes'] i");
    x.removeClass("fa-map");
    x.addClass("fa-location-dot");
});