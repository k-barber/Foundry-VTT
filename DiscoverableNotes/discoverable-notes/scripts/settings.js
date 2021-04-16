
Hooks.once("init", () => {
    game.settings.register("discoverable-notes", "InteractionDistance", {
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

    game.settings.register("discoverable-notes", "PartyPickup", {
        name: "Pickup Notes for Whole Party",
        hint: "Whether a picked up note is added to the journal for all players.",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register("discoverable-notes", "PickupPermission", {
        name: "Minimum Permission to Pick Up Note",
        hint: 'The minimum permission that a player needs to have to pick up Notes. "none" is the recommendation.',
        scope: "world",
        config: true,
        default: "NONE",
        type: String,
        choices: {
            "NONE": "none",
            "LIMITED": "limited",
            "OBSERVER": "observer",
            "OWNER": "owner"
        }
    });
});