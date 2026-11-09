/* Bell Before Dusk: authored campaign narrative. No gameplay or save mutation. */
(function (root) {
  "use strict";
  const cleared = (p, id) => Array.isArray(p?.cleared) && p.cleared.includes(id);
  function chapter(progress = {}) {
    if (progress.guardian) return "restored";
    if (progress.captain && progress.demon === false) return "demon";
    if (progress.captain) return "ward";
    if (cleared(progress, "harvest")) return "captain";
    if (cleared(progress, "causeway")) return "harvest";
    if (cleared(progress, "canopy")) return "south";
    return "canopy";
  }
  const leads = {
    demon: {
      objective: "Free the stolen seal: defeat Cinder Maw in the storehouse's tiered room",
      directions: "The captain fell, but Cinder Maw still binds the seal. Return to the High Road's WEST Bandit Storehouse. Climb onto a ledge when the floor glows, change height when a tier is marked, and leave its landing mark. Strike during OPEN, then take EXIT and return to Aya."
    },
    canopy: {
      objective: "Find the stolen seal's trail: Cedar Road → Cedar Canopy → Cedar Hamlet",
      directions: "Leave Post Town by its NORTH gate. On Cedar Road, use the northeast shrine and choose CEDAR CANOPY. Recover the token on its upper route, then use the far ground-level EXIT. The token opens the way north to Cedar Hamlet and Aya. FOREST SPIRIT PATH is an optional trail."
    },
    south: {
      objective: "Follow the stolen cargo: High Road → east Flooded Causeway → Willow Ferry",
      directions: "Aya's seal is still missing. Return to Post Town and take its SOUTH gate onto the High Road. Cross the EAST Flooded Causeway and use its far ground-level EXIT. There is no required item on this crossing. Continue south along the High Road to Willow Ferry; Nao knows where the stolen cargo went."
    },
    harvest: {
      objective: "Find the warehouse key: Willow Ferry → River March → west Harvest Trail",
      directions: "From Willow Ferry, take the SOUTH gate into River March. Follow the road to its WEST Harvest Trail. Recover the warehouse key on the upper route, then use the far EXIT. River March's eastern and coastal extensions are not part of this journey."
    },
    captain: {
      objective: "Recover the ward seal: High Road → west Bandit Storehouse → captain",
      directions: "The warehouse key opens the captain's hideout. Go NORTH from Willow Ferry onto the High Road, then take the WEST gate to the BANDIT STOREHOUSE. Follow the stage to the captain's chamber. Evade his warned attacks and strike during his recovery to reclaim the stolen ward seal."
    },
    ward: {
      objective: "Return the seal: Cedar Hamlet → north Broken Ward → guardian",
      directions: "You recovered the stolen ward seal. Return through Post Town and Cedar Road to Cedar Hamlet. Aya can explain the last task. Take Cedar Hamlet's NORTH gate into the BROKEN WARD. Avoid the guardian's warning marks, then strike only when it is recovering."
    },
    restored: {
      objective: "Journey complete • revisit the three towns, finish favors, or replay trails",
      directions: "The captain is defeated and the guardian is at rest. The roads between Post Town, Cedar Hamlet and Willow Ferry are safe to travel again. You may revisit towns, finish optional favors and replay trails. The closed eastern and coastal extensions remain outside this chapter."
    }
  };
  const introduction = [
    {
      title: "THE STOLEN SEAL",
      text: "The clapper is back in Post Town, but the robbery was a diversion. A bandit gang has taken the ward seal Yusuke was entrusted to deliver. Without it, the northern guardian can no longer tell travellers from intruders."
    },
    {
      title: "THREE TOWNS, ONE ROAD",
      text: "Aya waits in Cedar Hamlet to the north. Southward, Willow Ferry's food shipments have stopped. Follow the thieves' trail, reopen the supply route, and recover the seal before the next dusk."
    },
    {
      title: "YOUR ROAD BEGINS",
      text: "Start at Post Town's north gate. The northeast shrine on Cedar Road leads to Cedar Canopy and its road token. Talk to people in each town; your JOURNAL keeps the next lead, equipment and favors. The MAP shows the connected roads."
    }
  ];
  const epilogue = [
    {
      title: "THE WARD FALLS SILENT",
      text: "The guardian's last strike fades into the earth. Yusuke returns the stolen seal to its place. The shape before him is no longer a monster defending a broken command: it is a watchman finally allowed to rest."
    },
    {
      title: "A ROAD WORTH KEEPING",
      text: "Aya opens the northern road. At Willow Ferry, Nao loads the first provisions for Cedar Hamlet. Post Town's bell rings for returning travellers, not approaching danger. The thieves took a seal; they could not keep the towns apart."
    },
    {
      title: "DELIVERY COMPLETE",
      text: "Yusuke's delivery is finished. His friends still have stories to tell and favors to ask. Your journey is saved: return to the three towns, finish optional errands, or revisit the trails whenever you wish."
    }
  ];
  const credits = [
    "BELL BEFORE DUSK",
    "An independent samurai road adventure",
    "Game artwork includes AI-generated imagery",
    "Technology: HTML Canvas · Capacitor · Android",
    "Thank you for keeping the road open"
  ];
  const events = {
    captainDefeated: "The captain falls, but Cinder Maw still binds the seal. Use the tiered room to evade its fire, then strike during recovery.",
    guardianDefeated: "The seal is restored. The guardian rests, and the three towns are connected again. Your completed journey has been saved.",
    homeArrival: "The bell holds, but the ward seal is still missing. Aya in Cedar Hamlet is your first lead.",
    homeRestored: "Post Town's bell welcomes travellers again. Your friends are waiting along the reopened road.",
    canopyClear: "The road token carries Aya's mark. Cedar Hamlet's gate is open; take Cedar Road north and find her.",
    causewayClear: "The causeway is open. Nao at Willow Ferry can show you the road south to the harvest warehouses.",
    harvestClear: "Warehouse key recovered. The captain's storehouse is west of the High Road."
  };
  function npc(person = {}, progress = {}) {
    const state = chapter(progress), name = person.name || "Official";
    if (person.service === "steel" || person.service === "supplies") return null;
    if (person.service === "rest") {
      return name + (state === "restored"
        ? ": A quiet night, at last. Rest as long as you need. Health restored."
        : ": The road asks enough of you. Your wounds are treated, free of charge. Health restored.");
    }
    if (person.service === "warden" || name === "Aya") {
      if (state === "demon") return "Aya: The demon still binds our seal. " + leads.demon.directions;
      if (state === "restored") return "Aya: You returned more than my seal. Families can reach each other again. Cedar Hamlet will remember its courier.";
      if (state === "ward") return "Aya: That is our seal. The guardian is still following the thieves' broken command. Take the north gate to the Broken Ward. Let its attacks pass, then strike during recovery. Bring it peace.";
      return "Aya: Their captain has our seal. Follow the cargo. " + leads[state].directions;
    }
    if (person.service === "ferry" || name === "Nao") {
      if (state === "demon") return "Nao: The captain is down, but the seal is not free. " + leads.demon.directions;
      if (state === "restored") return "Nao: Rice for Cedar Hamlet, medicine for Post Town. The first boat is finally loaded. Come back whenever the road brings you here.";
      if (state === "ward") return "Nao: You have the seal. Leave our cargo to us; Aya needs you in Cedar Hamlet. Head north through Post Town and Cedar Road.";
      if (state === "captain") return "Nao: That key belongs to the captain's storehouse. Go north onto the High Road and use its west gate. The stolen seal should still be with him.";
      return "Nao: They took our provisions to the warehouses. " + leads[state].directions;
    }
    if (person.service === "guide" || person.role === "OFFICIAL") {
      if (state === "restored") return "Official: The delivery ledger is closed, Yusuke. For once, that means everyone got home. Thank you.";
      return "Official: The clapper was a diversion. Recover our seal. " + leads[state].directions;
    }
    if (person.service === "local") {
      if (state === "restored") {
        const lines = {
          Sota: "Customers on the northern road again! I had almost forgotten what a fair price sounded like.",
          Shin: "The ferry is moving again. Even the fish seem less suspicious today.",
          Mina: "A message from my sister arrived this morning. The roads are open. That is what your victory means to us.",
          Sada: "The harvest carts made it through. We can trade with our neighbours again."
        };
        return name + ": " + (lines[name] || "People are travelling between the three towns again. You made that possible.");
      }
      // Keep authored building directions and side-road information intact.
      return person.line ? name + ": " + person.line : null;
    }
    return null;
  }
  function freeze(value) {
    if (value && typeof value === "object") {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  }
  root.BELL_STORY = freeze({
    title: "Bell Before Dusk", version: 1, chapter,
    objective: p => leads[chapter(p)].objective,
    directions: p => leads[chapter(p)].directions,
    npc, introduction, epilogue, credits, events
  });
})(window);
