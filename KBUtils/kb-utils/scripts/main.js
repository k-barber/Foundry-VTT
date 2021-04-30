Hooks.on("updateActor", async function (ActorData, UpdateData, Diff, UserID) {

    if (UpdateData._id in Character_Containers.keys()) {
        let original_container_values = Character_Containers[UpdateData._id];
        let new_container_values = UpdateData.data.currency;
        var differences = {};
        var increasing = false;
        for (let denomination in new_container_values.keys()) {
            if (new_container_values[denomination].value > original_container_values[denomination].value) {
                increasing = true;
                differences[denomination] = new_container_values[denomination].value - original_container_values[denomination].value;
            }
        }

        if (increasing) {
            var user = await game.users.get(UserID);
            var character = await game.actors.get(user.actorId);
            var container = await game.actors.get(UpdateData._id);

            var original_character_values = character.data.data.currency;
            var new_character_values = {};
            var enough = true
            for (let denomination in differences.keys()) {
                if (differences[denomination].value > original_character_values[denomination].value) {
                    enough = false;
                    break;
                }
                new_character_values[denomination].value = actor_currency[denomination].value - differences[denomination].value;
            }


            if (!(enough)) {
                ui.notifications.warn("You don't have that much money...");
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


            for (let denomination in new_container_values.keys()) {
                Character_Containers[UpdateData._id][denomination] = new_container_values[denomination];
            }

            var input = ""
            for (const [denomination, value] of Object.entries(differences)) {
                input += denomination + " x " + value.value + ",";
            }
            input.slice(0, -1);

            ChatMessage.create({
                speaker: {
                    actor: character._id
                },
                content: character.name + " put " + input + " into " + container.name
            });
        }
    }
});

var Character_Containers = {};

Hooks.once('init', async function () {
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
        Character_Containers[containers_folder.content[i].data._id] = containers_folder.content[i].data.data.currency;
    }
});