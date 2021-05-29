var Character_Containers = {};

Hooks.on("renderChatMessage", (message, html, data) => {
    FraudswordMessageHandler(message, html, data);
});

Hooks.on("renderActorSheet", (actor, html, data) => {
    html.find("h4:contains(Fraudsword)").prev().css({
        'background-blend-mode': 'luminosity',
        'background-color': '#d000ff87'
    })
});

function FraudswordMessageHandler(message, html, data) {
    if (message.data.speaker?.alias === "Fraudsword") {
        html[0].style.borderColor = "#5a2989";
        html[0].style.backgroundBlendMode = "multiply";
        html[0].style.backgroundColor = "#590d8d2e";
        html[0].children[0].style.color = "#31174b";
        html[0].children[1].style.color = "#31174b";
        html[0].children[1].children[0].children[0].children[0].style.color = "#31174b";
        html[0].children[1].children[0].children[0].children[0].children[1].style.color = "#31174b";
        html[0].children[1].children[0].children[0].children[0].style.borderColor = "#9b6ec6";
        html[0].children[1].children[0].children[0].children[4].style.borderColor = "#9b6ec6";
        html[0].children[1].children[0].children[0].children[4].children[0].style.borderColor = "#9b6ec6";
    }
    var $image = html.find("h3:contains(Fraudsword)").prev()
    $image.replaceWith(`<div style="height:36px; width:36px; background-color: #d000ff87; background-image:
    url('${$image.attr("src")}'); background-size: contain; box-sizing: border-box; border: 1px solid #000;
    border-radius: 2px; background-blend-mode: luminosity; flex: 0 0 36px; margin-right: 5px;"></div>`);
}

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

Hooks.on("updateActor", async function (ActorData, UpdateData, Diff, UserID) {

    if (ActorData && UpdateData && Diff && UserID && UserID === game.userId) {
        var user = await game.users.get(UserID);
        if ((!(user.isGM)) && Object.keys(Character_Containers).includes(UpdateData._id)) {
            var container = await game.actors.get(UpdateData._id);
            // NPC currency {gp: {value: 23}, sp: {value : 23}}
            // PC currency {gp: 23, sp: 23}
            let original_container_values = duplicate(Character_Containers[UpdateData._id]);
            console.log("Original");
            console.log(JSON.stringify(original_container_values))
            let new_container_values = UpdateData.data.currency;
            console.log("New");
            console.log(JSON.stringify(new_container_values))
            var differences = {};
            var changing = false;
            let denomination = ""
            var relative = false;
            let keys = Object.keys(new_container_values);
            for (let i = 0; i < keys.length; i++) {
                denomination = keys[i];
                if (typeof (new_container_values[denomination].value) === "string" && (new_container_values[denomination].value.startsWith("+") || new_container_values[denomination].value.startsWith("-"))) {
                    new_container_values[denomination].value = Number.parseInt(original_container_values[denomination].value) + Number.parseInt(new_container_values[denomination].value)
                    relative = true;
                }
                if (new_container_values[denomination].value < 0) {
                    ui.notifications.error("You can't have negative money...");
                    await container.update({
                        data: {
                            currency: original_container_values
                        }
                    });
                    return;
                }
                if (new_container_values[denomination].value > original_container_values[denomination].value || new_container_values[denomination].value < original_container_values[denomination].value) {
                    changing = true;
                }

                differences[denomination] = new_container_values[denomination].value - original_container_values[denomination].value;
            }
            console.log("Difference");
            console.log(JSON.stringify(differences));
            console.log("New");
            console.log(JSON.stringify(new_container_values));

            if (changing) {
                console.log("CHANGING!");
                var character = await game.actors.get(user.actorId);
                var original_character_values = duplicate(character.data.data.currency);
                var new_character_values = {};
                var enough = true
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
                    await container.update({
                        data: {
                            currency: original_container_values
                        }
                    });
                    return;
                }
                await character.update({
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
                            alias: container.name
                        },
                        content: character.name + " took " + input + " from " + container.name
                    });
                } else if (differences[denomination] > 0) {
                    ChatMessage.create({
                        speaker: {
                            alias: container.name
                        },
                        content: character.name + " put " + input + " into " + container.name
                    });
                }

                if (relative) {
                    setTimeout(() => {
                        container.update({
                            data: {
                                currency: new_container_values
                            }
                        });
                    }, 250);
                }
            }

            denomination = ""
            keys = Object.keys(new_container_values);

            console.log("Point!")
            console.log("New Values!");
            console.log(JSON.stringify(new_container_values));
            for (let i = 0; i < keys.length; i++) {
                denomination = keys[i];
                Character_Containers[UpdateData._id][denomination] = duplicate(new_container_values[denomination]);
            }
            console.log("New containers!")
            console.log(JSON.stringify(Character_Containers))
            console.log("New Values!");
            console.log(JSON.stringify(new_container_values))
            return;
        } else if (user.isGM && Object.keys(Character_Containers).includes(UpdateData._id)) {
            denomination = ""
            let new_container_values = UpdateData.data.currency;
            keys = Object.keys(new_container_values);
            for (let i = 0; i < keys.length; i++) {
                denomination = keys[i];
                Character_Containers[UpdateData._id][denomination] = duplicate(new_container_values[denomination]);
            }
        }
    }


});

Hooks.once('renderApplication', async function () {
    var containers_folder = game.folders.find(e => e.data.name === "Character Containers");
    if (!(containers_folder)) {
        await Folder.create({
            name: "Character Containers",
            parent: null,
            type: "Actor",
            depth: 1
        });
        containers_folder = game.folders.find(e => e.data.name === "Character Containers");
    }
    for (let i = 0; i < containers_folder.content.length; i++) {
        Character_Containers[containers_folder.content[i].data._id] = duplicate(containers_folder.content[i].data.data.currency);
    }

});