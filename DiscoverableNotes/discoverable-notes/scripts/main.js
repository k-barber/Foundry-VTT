Hooks.once('init', () => {

    if( game.settings.get("Discoverable-Notes", "MinimumInteractionPermissions") < 2 ) {
        let originalRefresh = Note.prototype.refresh;
        Note.prototype.refresh = function(){
            this.position.set(this.data.x, this.data.y);
            this.controlIcon.border.visible = this._hover;
            this.tooltip.visible = this._hover;
            this.visible = this.entry ? this.entry.hasPerm(game.user, game.settings.get("Discoverable-Notes", "MinimumInteractionPermissions")) : true;
            return this;
        }
    }

    /*
    if( game.settings.get("Discoverable-Notes", "InteractionDistance") > 0 ) {
        
      let originalMethod = DoorControl.prototype._onMouseDown;
      DoorControl.prototype._onMouseDown = function(event) {
        // Check distance
        if( !game.user.isGM ) {
          let character = getFirstPlayerToken();
          
          if( !character ) {
            iteractionFailNotification("No character is selected to interact with a door");
            return;
          }
          
          let dist = getManhattanBetween(this, getTokenCenter(character));
          let gridSize = canvas.dimensions.size;
  
          if ( (dist / gridSize) > game.settings.get("Discoverable-Notes", "InteractionDistance") ) {
            var tokenName = getCharacterName(character);
            if (tokenName) iteractionFailNotification("Note not within " + tokenName + "'s reach" );
            else iteractionFailNotification("Note not in reach" );
            return;
          }
        }
  
        // Call original method
        return originalMethod.apply(this,arguments);
      };
    }
    */
  });