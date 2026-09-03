# Bell Before Dusk — Mobile UI System V1

## Direction

Use the economy of late-1990s Japanese action-adventure HUDs—character identity, health, currency, and one readable item state—but rebuild the layout for a portrait touch game. Do not copy another game's frames, icons, typography, or exact arrangement.

The world should occupy as much of the phone as possible. The HUD reports; it does not become the picture.

## Hero identity

- Hero name: **Yūsuke** in prose, **YUSUKE** in compact HUD text.
- Replace generic `HERO` labels everywhere.
- Display a small original face portrait beside health when the dedicated portrait asset exists.
- Health can become five large life pips for instant readability; retain a numerical bar internally.

## Top HUD

Maximum height: 82 logical pixels, excluding a temporary objective ribbon.

Left:

- Yusuke portrait;
- name;
- health pips/bar.

Right:

- cedar icon and count;
- spirit-ash icon and count;
- mon coin and count;
- green SAFE or red FOG stamp.

During the final breach, the right resource cluster temporarily becomes bell integrity and resonance.

Objective text appears on a narrow paper-scroll ribbon when the objective changes, remains for several seconds, then collapses to a small scroll tab. Dialogue uses a separate speech panel and never permanently consumes the upper quarter of the screen.

## Touch controls

Touch hit areas may remain circular for ergonomics, but the art should not look like generic circles.

- Movement: translucent braided-rope ring with a dark lacquer center.
- Katana: red brushstroke seal containing an original white katana-slash icon; label only during tutorials.
- Context: smaller indigo paper charm that shows TALK, ENTER, GATHER, RING, SHOP, or REST.
- Buttons become slightly brighter and compress by 6% while pressed.

## Platform-route controls

Platform combat cannot use one button that changes unpredictably between jumping and attacking.

- Left thumb: horizontal movement.
- Lower-right large button: JUMP.
- Upper-right smaller button: KATANA.
- Context button is hidden during the Spirit Path.

The same health, mon, and equipped smoke-charm HUD remains visible so the platform route feels like the same game and economy.

## Town services

The town deliberately separates recovery from equipment so every enterable building has one obvious purpose:

- **Crooked Carp inn:** REST restores full health for 1 mon.
- **Sparrow Forge:** WHETSTONE permanently adds 1 katana damage for 3 mon; one purchase per session.
- **Sparrow Forge:** FOX-SMOKE CHARM slows fog by 22% on the next expedition for 2 mon; one purchase per session.

Ward-repair choices occur automatically in the bell yard after a successful return. A future save/resume service can be added to the inn, but persistent saving is not required for the judged single session.

## Feedback language

- Damage: short red edge flash, hit-stop, recoil, and health loss.
- Perfectly timed katana counter: gold spark, sharper sound, extra ash/mon chance.
- Resource pickup: icon flies toward the correct HUD counter.
- Fog threshold: SAFE stamp flips to FOG, edges desaturate, and audio muffles.
- Repair installed: visible change on the bell plus a one-line mechanical summary.
- Shop purchase: coin count animates down; purchased service visibly changes Yusuke or the inventory charm slot.

## Camera and scale

- Top-down camera zoom: approximately 1.14× relative to the first Map 1 implementation.
- Yusuke should occupy roughly 11–13% of screen height during play.
- Camera follows horizontally but allows enough look-ahead in the facing direction to reveal enemies and entrances.
- No character perspective scaling.

## Immediate implementation order

1. Lock reliable movement and scenery collision.
2. Apply the closer camera and YUSUKE label.
3. Replace the top debug panel with the compact portrait/resource HUD.
4. Replace generic control art while keeping large touch targets.
5. Build the inn service cards and mon economy.
6. Split JUMP and KATANA in the Spirit Path.

## Implemented V2 layout

- A 48-pixel compact status strip contains portrait, health, map name, cedar, ash, mon, and a safe/danger indicator.
- A separate 30-pixel objective ribbon appears below it without permanently covering the playfield.
- Fog and bell pressure use a narrow right-edge meter instead of a second stacked panel.
- Top-down controls use a small braided movement ring, red katana seal, and smaller teal context seal.
- The Spirit Path uses separate JUMP and SLASH seals; enemies telegraph before striking.
