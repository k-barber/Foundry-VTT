var Utility_Socket

function setFlagFunction(data, key, value) {
    let object = game.actors.get(data._id);
    object.setFlag("kb-utils", key, value);
}

Hooks.once("socketlib.ready", () => {
    Utility_Socket = socketlib.registerModule("kb-utils");
    Utility_Socket.register("setFlag", setFlagFunction)
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
    let token = (message.data.speaker?.alias || message.data.speaker?.actor)
    token = token.replace(/\W/g, "_");
    html[0].classList.add(token + "_Message");
    if (message.data.speaker?.alias === "Fraudsword") {
        var $image = html.find("h3:contains(Fraudsword)").prev()
        $image.replaceWith(`<div style="height:36px; width:36px; background-color: #d000ff87; background-image:
    url('${$image.attr("src")}'); background-size: contain; box-sizing: border-box; border: 1px solid #000;
    border-radius: 2px; background-blend-mode: luminosity; flex: 0 0 36px; margin-right: 5px;"></div>`);
    }
}

async function CustomPreUpdateFunction(wrapped, documentClass, things, user) {
    const collection = game.collections.get(documentClass.documentName);
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
                    input += denomination + " x " + Math.abs(value) + ",";
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
    return wrapped(documentClass, things, user);
}

/*
function CustomPreCreationFunction(wrapped, embeddedName, ...args) {
    console.log(embeddedName);
    console.log(args);
    return wrapped(documentClass, things, user);
}
*/

Hooks.once('init', () => {
    libWrapper.register("kb-utils", "ClientDatabaseBackend.prototype._updateDocuments", CustomPreUpdateFunction, "MIXED");
    //libWrapper.register("kb-utils", "Actor.prototype._onCreateEmbeddedDocuments", CustomPreCreationFunction, "MIXED");
})

/*
Hooks.on("preCreateOwnedItem", async function (Recipient, Char_Item, other_data, UserID) {
    var original_items = duplicate(Recipient.data.items);

    if (Recipient && Char_Item && other_data && UserID) {
        var user = await game.users.get(UserID);
        if ((!(user.isGM)) && Object.keys(Character_Containers).includes(Recipient.data._id)) {
            Char_Item._id;
            var user = await game.users.get(UserID);
            var character = await game.actors.get(user.actorId);
            let item = character.items.find(i => i._id === Char_Item._id);

            var delay = 125;
            if (item) {
                delay = 0;
                if (item.data.data.quantity > 1) {
                    await item.update({
                        data: {
                            quantity: item.data.data.quantity - 1
                        }
                    });
                } else {
                    await character.deleteOwnedItem(Char_Item._id);
                }
                console.log("ERROR 1");
                ChatMessage.create({
                    speaker: {
                        actor: Recipient.data._id
                    },
                    content: character.name + " put " + Char_Item.name + " into " + Recipient.data.name
                });

            } else {
                console.log("ERROR 2");
                ChatMessage.create({
                    speaker: {
                        actor: Recipient.data._id
                    },
                    content: character.name + " put " + Char_Item.name + " into " + Recipient.data.name + " from an unknown source."
                });
            }

            var original = null;
            for (let i = 0; i < original_items.length; i++) {
                if (original_items[i].name === Char_Item.name) {
                    original = original_items[i];
                    break;
                }
            }
            var existing;
            var container;
            setTimeout(async function () {
                container = await game.actors.get(Recipient.data._id);
                if (original) {
                    existing = container.items.find(e => (e.data.name === Char_Item.name) && (e._id !== original._id));
                } else {
                    existing = container.items.find(e => (e.data.name === Char_Item.name));
                }
                if (existing) {
                    if (original) {
                        var updated = container.items.find(e => e._id === original._id);
                        updated.update({
                            data: {
                                quantity: original.data.quantity + 1
                            }
                        })
                        await container.deleteOwnedItem(existing._id);
                    } else {
                        existing.update({
                            data: {
                                quantity: 1
                            }
                        })
                    }
                }
            }, delay);
        }
    }

})
*/