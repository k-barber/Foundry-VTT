var Utility_Socket

function setFlagFunction(data, key, value) {
    let object = game.actors.get(data._id);
    object.setFlag("kb-utils", key, value);
}

function createOwnedItemFunction(target_ID, creation_data) {
    let target = game.actors.get(target_ID);
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

async function CustomPreUpdateFunction(wrapped, documentClass, things, user) {
    if (documentClass.name === "Actor5e") {
        const collection = things.pack ? game.packs.get(things.pack) : game.collections.get(documentClass.documentName);
        const toUpdate = await this._preUpdateDocumentArray(collection, things);

        var target = game.actors.get(things.updates[0]._id)

        var good_update = true;
        const updateData = toUpdate[0]?.data;

        if (updateData) {
            if (!(game.user.isGM) && target.data?.type === "npc" && Object.keys(updateData).includes("currency")) {
                let original_container_values = duplicate(target.data.data.currency);

                function inner() {
                    let new_container_values = updateData.currency;
                    var differences = {};
                    let denomination = ""
                    let keys = Object.keys(new_container_values);
                    for (let i = 0; i < keys.length; i++) {
                        denomination = keys[i];
                        if (isNaN(Number.parseInt(new_container_values[denomination].value))) {
                            ui.notifications.error("THAT'S NOT A NUMBER!!");
                            ChatMessage.create({
                                speaker: {
                                    alias: "System"
                                },
                                content: "<p>" + game.user.charname + " doesn't know what a number is!</p><p>POINT AT THEM AND LAUGH!</p>"
                            });
                            return false;
                        }
                        if (typeof (new_container_values[denomination].value) === "string" && (new_container_values[denomination].value.startsWith("+") || new_container_values[denomination].value.startsWith("-"))) {
                            new_container_values[denomination].value = Number.parseInt(original_container_values[denomination].value || 0) + Number.parseInt(new_container_values[denomination].value)
                        }
                        if (new_container_values[denomination].value < 0) {
                            ui.notifications.error("You can't have negative money...");
                            return false;
                        }
                        differences[denomination] = new_container_values[denomination].value - original_container_values[denomination].value;
                        things.updates[0]["data.currency." + denomination + ".value"] = new_container_values[denomination].value;
                    }

                    var character = game.user.character;
                    var original_character_values = duplicate(character.data.data.currency);
                    var new_character_values = {};
                    var enough = true;

                    denomination = ""
                    keys = Object.keys(differences);
                    for (let i = 0; i < keys.length; i++) {
                        denomination = keys[i];
                        if (differences[denomination] > 0 && differences[denomination] > original_character_values[denomination]) {
                            enough = false;
                            break;
                        } else if (differences[denomination] < 0 && Math.abs(differences[denomination]) > original_container_values[denomination]) {
                            enough = false;
                            break;
                        }
                        new_character_values[denomination] = (original_character_values[denomination] - differences[denomination]);
                    }

                    if (!(enough)) {
                        ui.notifications.error("You don't have that much money...");
                        return false;
                    }
                    character.update({
                        data: {
                            currency: new_character_values
                        }
                    });

                    var input = ""
                    for (const [denomination, value] of Object.entries(differences)) {
                        if (input) {
                            input += `, ${Math.abs(value)} × ${denomination}`
                        } else {
                            input += `${Math.abs(value)} × ${denomination}`
                        }
                    }
                    input.slice(0, -1);

                    if (differences[denomination] < 0) {
                        ChatMessage.create({
                            speaker: {
                                alias: target.data.name
                            },
                            content: character.name + " took " + input + " from " + target.data.name
                        });
                    } else if (differences[denomination] > 0) {
                        ChatMessage.create({
                            speaker: {
                                alias: target.data.name
                            },
                            content: character.name + " put " + input + " into " + target.data.name
                        });
                    }
                    return true;
                }
                good_update = inner()
                if (!good_update) {
                    things.updates[0].data = {
                        currency: original_container_values
                    }
                    things.options.diff = false;
                }
            }
        }
    }
    return wrapped(documentClass, things, user);
}


async function CustomPreCreationFunction(wrapped, event, data) {
    await wrapped(event, data)

    const actor = this.actor;
    let sameActor = (data.actorId === actor.id) || (actor.isToken && (data.tokenId === actor.token.id));
    if (!(sameActor)) {
        if (data.actorId) {
            const source = game.actors.get(data.actorId);
            source.deleteEmbeddedDocuments("Item", data.data._id)
        }
    }
}

function new_url(src) {
    var new_url = src
    if (new_url && new_url.includes("https://foundry-vtt-kb.s3.us-east-2.amazonaws.com")) {
        if (new_url.includes("?")) {
            new_url += "&kb_utils"
        } else {
            new_url += "?kb_utils"
        }
    }
    return new_url
}

function customImageLoadFunction(wrapped, src) {
    return wrapped(new_url(src))
}

function customCacheFunction(wrapped, src) {
    var val = this.cache.get(new_url(src));
    if (!val) {
        val = this.cache.get(src)
    };
    if (!val) return undefined;
    val.time = Date.now();
    return val?.tex;
}

function getVertexFunction(x, y) {
    const gs = canvas.dimensions.size * 0.5;
    return [Math.round(x / gs) * gs, Math.round(y / gs) * gs];
}

Hooks.once('init', () => {
    libWrapper.register("kb-utils", "ClientDatabaseBackend.prototype._updateDocuments", CustomPreUpdateFunction, "MIXED");
    libWrapper.register("kb-utils", "ActorSheet.prototype._onDropItem", CustomPreCreationFunction, "MIXED");
    libWrapper.register("kb-utils", "TextureLoader.prototype.loadImageTexture", customImageLoadFunction, "MIXED")
    libWrapper.register("kb-utils", "TextureLoader.prototype.getCache", customCacheFunction, "MIXED")
    libWrapper.register("kb-utils", "SquareGrid.prototype._getNearestVertex", getVertexFunction, "OVERRIDE")
})