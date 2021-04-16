Hooks.once("init", () => {
    game.settings.register("Discoverable-Notes", "InteractionDistance", {
        name: "Interaction Distance Limit",
        hint: "The max distance that a token can interact with a note. Setting this to 0 disables the limit.",
        scope: "world",
        config: true,
        default: 2,
        type: Number,
        range: {
            min: 0,
            max: 50,
            step: 0.5
        }
    });

    game.settings.register("Discoverable-Notes", "PickupPermission", {
        name: "Journal Permission on Pickup",
        hint: "The permission that the  disable interaction with double tap.",
        scope: "world",
        config: true,
        default: 200,
        type: Number,
        range: {
            min: 0,
            max: 750,
            step: 50
        }
    });

    game.settings.register("Discoverable-Notes", "PartyPickup", {
        name: "Pickup Notes for Whole Party",
        hint: "Whether a picked up note is added to the journal for all players.",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register("Discoverable-Notes", "MinimumInteractionPermissions", {
        name: "Minimum Permission to Pick Up Note",
        hint: 'The minimum permission that a player needs to have to pick up Notes. "none" is the recommendation.',
        scope: "world",
        config: true,
        default: "none",
        type: Number,
        choices: {
            "none": 0,
            "limited" : 1,
            "observer" : 2,
            "owner" : 3
        }
    });
});