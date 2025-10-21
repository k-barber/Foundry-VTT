Hooks.on("renderChatMessage", (message, html, data) => {
  MessageHandler(message, html, data);
});

// Hooks.on("seasons-stars:dateChanged", (data) => {
//   const messages = this.element.find("#chat-log .message");
//   for (let li of messages) {
//     const message = game.messages.get(li.dataset.messageId);
//     if (!message?.flags["kb-utils"]) return;
//     const stamp = li.querySelector(".message-gametime");
//     stamp.textContent =
//       gameTimeSince(message?.flags["kb-utils"]?.gametime) + " | ";
//   }
// });

function MessageHandler(message, html, data) {
  var timestamp;
  if (message?.flags["kb-utils"]) {
    timestamp = message?.flags["kb-utils"]?.gametime;
  } else {
    // Get the current time and convert it to a timestamp
    timestamp = game.seasonsStars.api.dateToWorldTime(
      game.seasonsStars.api.getCurrentDate()
    );
    if (game?.user?.isGM) {
      message.setFlag("kb-utils", "gametime", timestamp);
    }
  }
  var meta_data = html.find(".message-metadata")[0];
  var date = game.seasonsStars.api.worldTimeToDate(timestamp);
  var datestamp = date.formatter.format(
    date,
    "{{hour}}:{{minute}} {{ss-day}} {{ss-month format='abbr'}} {{year}}"
  );
  var span = document.createElement("span");
  span.className = "message-gametime";
  span.title = datestamp;
  span.textContent = `${gameTimeSince(timestamp)} | `;
  meta_data.prepend(span);
}

/**
 * Express a timestamp as a relative string
 * @param {Date|string} timeStamp   A timestamp string or Date object to be formatted as a relative time
 * @return {string}                 A string expression for the relative time
 */
function gameTimeSince(timeStamp) {
  const now = game.seasonsStars.api.dateToWorldTime(
    game.seasonsStars.api.getCurrentDate()
  );
  const current_cal = game.seasonsStars.api.getActiveCalendar();
  const secondsInMinute = current_cal.time.secondsInMinute;
  const minutesInHour = current_cal.time.minutesInHour;
  const hoursInDay = current_cal.time.hoursInDay;
  const secondsInHour = secondsInMinute * minutesInHour;
  const secondsInDay = secondsInMinute * minutesInHour * hoursInDay;

  const diffInSeconds = Math.abs(now - timeStamp);
  let textDiff = "";

  // Format the time
  if (diffInSeconds < secondsInMinute) {
    if (diffInSeconds < 1) return game.i18n.localize("TIME.Now");
    else
      textDiff =
        Math.round(diffInSeconds) + game.i18n.localize("TIME.Second.abbr");
  } else if (diffInSeconds < secondsInHour)
    textDiff =
      Math.round(diffInSeconds / secondsInMinute) +
      game.i18n.localize("TIME.Minute.abbr");
  else if (diffInSeconds <= secondsInDay)
    textDiff =
      Math.round(diffInSeconds / secondsInHour) +
      game.i18n.localize("TIME.Hour.abbr");
  else {
    const hours = Math.round(diffInSeconds / secondsInHour);
    const days = Math.floor(hours / hoursInDay);
    textDiff = `${days}${game.i18n.localize("TIME.Day.abbr")} ${
      hours % hoursInDay
    }${game.i18n.localize("TIME.Hour.abbr")}`;
  }

  if (now > timeStamp) {
    return game.i18n.format("TIME.Since", {
      since: textDiff,
    });
  } else {
    return game.i18n.format("In {textDiff}", {
      textDiff: textDiff,
    });
  }
}

Hooks.once("init", () => {
  libWrapper.register(
    "kb-utils",
    "ChatLog.prototype.updateTimestamps",
    function (wrapped, ...args) {
      const messages = this.element.find("#chat-log .message");
      for (let li of messages) {
        const message = game.messages.get(li.dataset.messageId);
        if (!message?.flags["kb-utils"]) return;
        const stamp = li.querySelector(".message-gametime");
        stamp.textContent =
          gameTimeSince(message?.flags["kb-utils"]?.gametime) + " | ";
      }
      wrapped(...args);
    },
    "MIXED"
  );
});
