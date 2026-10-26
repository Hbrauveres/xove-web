# The next version, component by component

The room's redesign: three columns (who's here, the stream, the room's chat), the people as cards with their own previews, a rail of faces when the column is folded, and a chat. These pictures come from the redesign's draft, a static page with no logic: they show the direction chosen, not finished behaviour. Each piece is built in the [new structure](../architecture.md#where-the-code-is-going) after the reorganisation, and its details are settled in a working prototype first.

Desktop only for now. Pictures: the draft at 1600 px wide.

**Kinds:** a *building block* is small and used in many places (`shared/ui/`); a *room piece* is built from blocks and has one job; a *screen region* holds pieces in place.

## Layers

The room is a stack, back to front. Each picture adds one layer on top of the ones before it.

| | Layer | What it holds |
| --- | --- | --- |
| <img src="img/next/layer-1-ground.webp" width="720" alt="Ground"> | **Ground** | The near-black background everything sits on. One flat colour, no picture. |
| <img src="img/next/layer-2-light.webp" width="720" alt="Stage light"> | **Stage light** | The ambilight: the stream's own colours, blurred, glowing out around the stage and under the panels. It has a ceiling, so a white stream glows grey instead of blinding. |
| <img src="img/next/layer-3-stage.webp" width="720" alt="Stage"> | **Stage** | The stream itself, with what sits on it: the facecam and the stage's buttons. |
| <img src="img/next/layer-4-panels.webp" width="720" alt="Panels"> | **Panels** | The two side surfaces, people on the left and chat on the right: a light tint over the ground and the light, fading in from the header. |
| <img src="img/next/layer-5-content.webp" width="720" alt="Panel content"> | **Panel content** | What lives on the panels: my card, the people, the chat's messages and its message box. |
| <img src="img/next/layer-6-header.webp" width="720" alt="Header"> | **Header** | The bar on top: the menu, the wordmark, the bell, the chat button and my picture. It sits above the stage's light. |
| <img src="img/next/layer-7-floating.webp" width="720" alt="Floating"> | **Floating** | What opens over everything else, for a moment: the rail's hover card, the chat toast, the menus. |

## Building blocks

Small pieces used in many places. Each is built once and reused everywhere.

### Face

*Building block* · `shared/ui/face/`

<table><tr>
<td><img src="img/next/face-rest.webp" width="52" alt="At rest"><br><sub>At rest</sub></td>
<td><img src="img/next/face-hover.webp" width="52" alt="Pointed at: it lifts on its own coloured walls"><br><sub>Pointed at: it lifts on its own coloured walls</sub></td>
<td><img src="img/next/face-talking.webp" width="52" alt="Talking: green walls, glowing with the voice"><br><sub>Talking: green walls, glowing with the voice</sub></td>
<td><img src="img/next/rail-face-muted.webp" width="52" alt="With the muted badge (in the rail)"><br><sub>With the muted badge (in the rail)</sub></td>
</tr></table>

**Why its own component:** A person is shown by the same square face everywhere, in different sizes and with several states (talking, the one I'm watching, pointed at, muted). Built once, every place shows a person the same way and the talking glow follows one rule.

**Where it's used:** People rows, the rail, my card, chat messages, the activity list, my menu and the hover card. Sizes: 32 px in the people column, 26 px in the activity list, 24 px in the chat.

### Icon button

*Building block* · `shared/ui/icon-button/`

<table><tr>
<td><img src="img/next/menu-button.webp" width="54" alt="Menu"><br><sub>Menu</sub></td>
<td><img src="img/next/header-button-bell.webp" width="54" alt="Header: the bell, with its count"><br><sub>Header: the bell, with its count</sub></td>
<td><img src="img/next/header-button-chat.webp" width="54" alt="Header, pressed (chat open)"><br><sub>Header, pressed (chat open)</sub></td>
<td><img src="img/next/stage-buttons.webp" width="54" alt="On the stage"><br><sub>On the stage</sub></td>
<td><img src="img/next/send-buttons-off.webp" width="104" alt="My buttons, off"><br><sub>My buttons, off</sub></td>
<td><img src="img/next/send-buttons-on.webp" width="104" alt="My buttons, on (red)"><br><sub>My buttons, on (red)</sub></td>
</tr></table>

**Why its own component:** Every action that is only an icon shares the same needs: a hit area, hover and focus, pressed and off states, a label for screen readers. Today it comes in three looks: rounded squares in the header, round dark glass on the stage, round in my card. One component with those variants keeps them consistent.

**Where it's used:** The header (menu, bell, chat, my picture), the stage (volume, fullscreen, show the camera), the facecam (swap, minimise), my card (screen, camera, mic), the preview's controls.

### Count badge

*Building block* · `shared/ui/count-badge/`

<table><tr>
<td><img src="img/next/count-badge.webp" width="18" alt="On the bell"><br><sub>On the bell</sub></td>
<td><img src="img/next/header-button-chat-unread.webp" width="54" alt="On the chat button: unread messages"><br><sub>On the chat button: unread messages</sub></td>
</tr></table>

**Why its own component:** A small red number pinned to a button's corner. Its position, size and how it shows a large count should be the same on every button.

**Where it's used:** The bell (new activity) and the chat button (unread messages while the chat is hidden).

### LIVE badge

*Building block* · `shared/ui/live-badge/`

<table><tr>
<td><img src="img/next/live-badge.webp" width="66" alt="Closed"><br><sub>Closed</sub></td>
<td><img src="img/next/row-live-open-stacked.webp" width="228" alt="Open: it shows the person&#x27;s preview"><br><sub>Open: it shows the person&#x27;s preview</sub></td>
</tr></table>

**Why its own component:** It says someone is live and is also the button that opens their preview. One look and one behaviour wherever a live person appears.

**Where it's used:** People rows and the rail's hover card.

### Mic state

*Building block* · `shared/ui/mic-state/`

<table><tr>
<td><img src="img/next/mic-muted.webp" width="38" alt="Their mic is off (red, glowing)"><br><sub>Their mic is off (red, glowing)</sub></td>
<td><img src="img/next/mic-muted-by-me.webp" width="38" alt="I muted them (white crossed speaker)"><br><sub>I muted them (white crossed speaker)</sub></td>
</tr></table>

**Why its own component:** Only the states that matter are shown: their mic off, or muted by me. An open mic shows nothing, because talking is the face's green walls. A small component keeps that rule in one place.

**Where it's used:** People rows; in the rail it's the small badge on the face.

### Slider

*Building block* · `shared/ui/slider/`

<table><tr>
<td><img src="img/next/slider.webp" width="208" alt="In a person&#x27;s menu"><br><sub>In a person&#x27;s menu</sub></td>
<td><img src="img/next/stage-volume.webp" width="54" alt="Upright, for the stream&#x27;s volume"><br><sub>Upright, for the stream&#x27;s volume</sub></td>
</tr></table>

**Why its own component:** One slim slider, lying down or standing up, with the filled part following the thumb. Built once, every volume control looks and moves the same.

**Where it's used:** A person's voice volume, the stream's volume on the stage, the preview's volume.

### Menu

*Building block* · `shared/ui/menu/`

<table><tr>
<td><img src="img/next/my-menu.webp" width="324" alt="My menu"><br><sub>My menu</sub></td>
<td><img src="img/next/person-menu.webp" width="244" alt="A person&#x27;s settings"><br><sub>A person&#x27;s settings</sub></td>
<td><img src="img/next/message-menu.webp" width="230" alt="A message&#x27;s &quot;More&quot;"><br><sub>A message&#x27;s &quot;More&quot;</sub></td>
<td><img src="img/next/activity-list.webp" width="324" alt="The activity list"><br><sub>The activity list</sub></td>
</tr></table>

**Why its own component:** Four things open as the same kind of floating box: a dark surface with rounded corners, a shadow, rows or controls inside, closed by Escape or a click outside. One component owns the box, where it opens and how it closes; each use only gives it its rows.

**Where it's used:** My picture (Settings, Leave the room), a right-click on a person, a message's "⋯", the bell.

### Panel

*Building block* · `shared/ui/panel/`

<table><tr>
<td><img src="img/next/people-panel.webp" width="240" alt="The people panel"><br><sub>The people panel</sub></td>
<td><img src="img/next/chat-panel.webp" width="300" alt="The chat panel"><br><sub>The chat panel</sub></td>
</tr></table>

**Why its own component:** The two side surfaces are the same material: a light tint over the ground, no live blur, the top fading in from the header. One component makes them match exactly.

**Where it's used:** The people column and the chat column.

### Section label

*Building block* · `shared/ui/section-label/`

<table><tr>
<td><img src="img/next/section-label.webp" width="252" alt="&quot;In the room · 6&quot;"><br><sub>&quot;In the room · 6&quot;</sub></td>
</tr></table>

**Why its own component:** Small, spaced, monospace capitals that name a section. Same type and spacing everywhere a list gets a title.

**Where it's used:** The people column; the activity list's "Activity" title is the same style.

### Wordmark

*Building block* · `shared/ui/wordmark/`

<table><tr>
<td><img src="img/next/wordmark.webp" width="90" alt="In the header"><br><sub>In the header</sub></td>
</tr></table>

**Why its own component:** Xovê's name and mark, drawn with its red corner. It is the brand: one source, never redrawn by hand.

**Where it's used:** The header.

## The header

The bar along the top.

### Header

*Screen region* · `features/room/header/header/`

<table><tr>
<td><img src="img/next/header.webp" width="720" alt="The whole bar"><br><sub>The whole bar</sub></td>
</tr></table>

**Why its own component:** The top bar holds the app's global actions, apart from the room's content, and sits above the stage's light. As one piece it lays out its two ends and spaces its buttons by what the eye sees.

**Where it's used:** The room, at every size.

### My picture button

*Room piece* · `features/room/header/my-picture-button/`

<table><tr>
<td><img src="img/next/my-picture-button.webp" width="48" alt="My picture"><br><sub>My picture</sub></td>
<td><img src="img/next/my-menu.webp" width="324" alt="It opens my menu"><br><sub>It opens my menu</sub></td>
</tr></table>

**Why its own component:** My own face as a button that opens my menu. It joins the face and the menu in one place.

**Where it's used:** The header's right end.

### Activity list

*Room piece* · `features/room/header/activity-list/`

<table><tr>
<td><img src="img/next/activity-list.webp" width="324" alt="Opened from the bell"><br><sub>Opened from the bell</sub></td>
</tr></table>

**Why its own component:** A list of what happened in the room (went live, joined), each line with a face, the text and when. It has its own content and will grow its own rules (how many, how long they stay).

**Where it's used:** Opened from the bell.

## The people

The left column, open or folded.

### My card

*Room piece* · `features/room/people/my-card/`

<table><tr>
<td><img src="img/next/my-card.webp" width="236" alt="Open"><br><sub>Open</sub></td>
<td><img src="img/next/my-card-rail.webp" width="64" alt="Folded into the rail: my buttons stand under my face"><br><sub>Folded into the rail: my buttons stand under my face</sub></td>
</tr></table>

**Why its own component:** Me, apart from everyone else: my face, my name and my three buttons to go live (screen, camera, mic). It changes shape when the column folds, and the buttons must never be hidden.

**Where it's used:** The top of the people column.

### Send buttons

*Room piece* · `features/room/people/send-buttons/`

<table><tr>
<td><img src="img/next/send-buttons-off.webp" width="104" alt="All off"><br><sub>All off</sub></td>
<td><img src="img/next/send-buttons-on.webp" width="104" alt="Screen and mic on"><br><sub>Screen and mic on</sub></td>
</tr></table>

**Why its own component:** A pill of three icon buttons that start and stop what I send. As one group they keep their order and spacing, lie down or stand up with the column, and show on in red.

**Where it's used:** Inside my card.

### Person row

*Room piece* · `features/room/people/person-row/`

<table><tr>
<td><img src="img/next/row-marina.webp" width="228" alt="On the stage, talking"><br><sub>On the stage, talking</sub></td>
<td><img src="img/next/row-rafa.webp" width="228" alt="Live"><br><sub>Live</sub></td>
<td><img src="img/next/row-ana.webp" width="228" alt="Live, mic off"><br><sub>Live, mic off</sub></td>
<td><img src="img/next/row-bruno.webp" width="228" alt="Watching someone, mic off"><br><sub>Watching someone, mic off</sub></td>
<td><img src="img/next/row-julia.webp" width="228" alt="Watching someone"><br><sub>Watching someone</sub></td>
<td><img src="img/next/row-hover.webp" width="228" alt="Pointed at"><br><sub>Pointed at</sub></td>
</tr></table>

**Why its own component:** The main repeated piece of the room: a face, a name, what they're doing (LIVE or "Watching …") and their mic. Up to 20 of them, with many combinations of states, so it must be one piece with clear states.

**Where it's used:** The people column, one per person; the rail's hover card is the same row, grown out of the rail.

### Live preview

*Room piece* · `features/room/people/live-preview/`

<table><tr>
<td><img src="img/next/live-preview-single.webp" width="220" alt="One stream"><br><sub>One stream</sub></td>
<td><img src="img/next/live-preview-stacked.webp" width="220" alt="Screen and camera, stacked, with a swap"><br><sub>Screen and camera, stacked, with a swap</sub></td>
</tr></table>

**Why its own component:** A small player for someone's stream, with its own volume and, when they share both, a swap. Clicking it puts that stream on the stage. It's the same in the list and in the hover card.

**Where it's used:** Under a person's row when their LIVE badge is opened, and in the rail's hover card.

### Settings button

*Room piece* · `features/room/people/settings-button/`

<table><tr>
<td><img src="img/next/settings-button.webp" width="236" alt="At the column&#x27;s foot"><br><sub>At the column&#x27;s foot</sub></td>
</tr></table>

**Why its own component:** The way to the app's settings, at the foot of the column, with its icon and its word (only the icon when folded).

**Where it's used:** The bottom of the people column.

### Person menu

*Room piece* · `features/room/people/person-menu/`

<table><tr>
<td><img src="img/next/person-menu.webp" width="244" alt="Right-click on a person"><br><sub>Right-click on a person</sub></td>
</tr></table>

**Why its own component:** Settings for one person, only for me: their voice volume and mute. It's a Menu with a slider and a checkbox in it.

**Where it's used:** A right-click on a person's row, or on their hover card.

### Rail

*Room piece* · `features/room/people/rail/`

<table><tr>
<td><img src="img/next/rail.webp" width="64" alt="The people folded into faces"><br><sub>The people folded into faces</sub></td>
</tr></table>

**Why its own component:** The people column folded to its faces, to give the stage room. Same people and states as the open list in a narrow shape, so it's the column's second layout, not a copy of it.

**Where it's used:** The people column when the menu folds it.

### Rail hover card

*Room piece* · `features/room/people/rail-hover-card/`

<table><tr>
<td><img src="img/next/rail-card.webp" width="288" alt="Pointing at a face"><br><sub>Pointing at a face</sub></td>
<td><img src="img/next/rail-card-preview.webp" width="288" alt="With their preview open"><br><sub>With their preview open</sub></td>
</tr></table>

**Why its own component:** Pointing at a face in the rail grows that person's row out of the column, as a pill in the column's own colour. It has its own rules: it opens only when the pointer rests, nothing below moves while pointing, and it meets the column with no seam.

**Where it's used:** The rail, one at a time.

## The stage

The middle: the stream and what sits on it.

### Stage

*Screen region* · `features/room/stage/stage/`

<table><tr>
<td><img src="img/next/stage.webp" width="720" alt="The stream"><br><sub>The stream</sub></td>
</tr></table>

**Why its own component:** The stream itself, always 16:9 and as large as the middle allows, with corners for its buttons. Everything else in the middle is placed relative to it.

**Where it's used:** The middle of the room.

### Stage light

*Room piece* · `features/room/stage/stage-light/`

<table><tr>
<td><img src="img/next/stage-with-light.webp" width="720" alt="The light around the stage"><br><sub>The light around the stage</sub></td>
</tr></table>

**Why its own component:** The ambilight: drawn from the stream's edges on a small canvas, stretched around the stage, with a ceiling for bright streams. It has its own cost and its own rules, so it lives apart from the stage.

**Where it's used:** Behind the stage, reaching under the panels.

### Facecam

*Room piece* · `features/room/stage/facecam/`

<table><tr>
<td><img src="img/next/facecam.webp" width="214" alt="Over the screen, with swap and minimise"><br><sub>Over the screen, with swap and minimise</sub></td>
</tr></table>

**Why its own component:** When someone shares their screen and camera, the camera sits over the screen in a small window that can be swapped, minimised and dragged.

**Where it's used:** On the stage, when the streamer shares both.

### Stage controls

*Room piece* · `features/room/stage/stage-controls/`

<table><tr>
<td><img src="img/next/stage-volume.webp" width="54" alt="Volume, with its upright slider"><br><sub>Volume, with its upright slider</sub></td>
<td><img src="img/next/stage-buttons.webp" width="54" alt="Fullscreen"><br><sub>Fullscreen</sub></td>
<td><img src="img/next/stage-buttons-camera-hidden.webp" width="96" alt="With the camera minimised: show the camera"><br><sub>With the camera minimised: show the camera</sub></td>
</tr></table>

**Why its own component:** The stage's own buttons in two corners: the stream's volume on the left, fullscreen (and show the camera) on the right. Icon buttons in the dark-glass variant, in fixed places so they never move.

**Where it's used:** The stage's bottom corners.

## The chat

The right column, and what shows of it when it's hidden.

### System line

*Room piece* · `features/room/chat/system-line/`

<table><tr>
<td><img src="img/next/system-line.webp" width="199" alt="Someone went live"><br><sub>Someone went live</sub></td>
</tr></table>

**Why its own component:** A line from the room, not from a person: small, muted, with a red dot. It must never look like a message.

**Where it's used:** Between messages in the chat.

### Message group

*Room piece* · `features/room/chat/message-group/`

<table><tr>
<td><img src="img/next/message-group.webp" width="280" alt="Someone&#x27;s messages"><br><sub>Someone&#x27;s messages</sub></td>
<td><img src="img/next/message-group-mine.webp" width="292" alt="Mine (the same, on a soft band)"><br><sub>Mine (the same, on a soft band)</sub></td>
</tr></table>

**Why its own component:** Messages from one person in a row, under one face, name and time. The repeated unit of the chat, with a variant for my own.

**Where it's used:** The chat, one group per run of messages from the same person.

### Message tools

*Room piece* · `features/room/chat/message-tools/`

<table><tr>
<td><img src="img/next/message-tools.webp" width="250" alt="Pointing at a message"><br><sub>Pointing at a message</sub></td>
</tr></table>

**Why its own component:** A small bar of actions at a message's corner (delete, time out, ban, more), shown on hover. Which tools show depends on whose message it is (and later on my role).

**Where it's used:** Over the message being pointed at.

### Message box

*Room piece* · `features/room/chat/message-box/`

<table><tr>
<td><img src="img/next/message-box-empty.webp" width="288" alt="Empty"><br><sub>Empty</sub></td>
<td><img src="img/next/message-box-typing.webp" width="288" alt="With text: the arrow turns red"><br><sub>With text: the arrow turns red</sub></td>
</tr></table>

**Why its own component:** Where I write: one pill with the send arrow inside, grey when empty and red when there's something to send.

**Where it's used:** The foot of the chat.

### Chat toast

*Room piece* · `features/room/chat/chat-toast/`

<table><tr>
<td><img src="img/next/chat-toast.webp" width="260" alt="A new message while the chat is hidden"><br><sub>A new message while the chat is hidden</sub></td>
</tr></table>

**Why its own component:** With the chat hidden, the newest message peeks in for a moment at the top. It floats over the stream, so it has a dark floor to stay readable on any stream.

**Where it's used:** Top right of the room, only while the chat is hidden.
