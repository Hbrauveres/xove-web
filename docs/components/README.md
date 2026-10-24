# Components

How the web app's interface is put together, piece by piece, with pictures: what each component is, why it's its own component, where it's used and where its code lives.

| Page | What's in it |
| --- | --- |
| [Today's app](today.md) | Every desktop component as it is today: what it does, where its code lives now, where it goes in the new structure, and what happens to it (kept, replaced, merged or removed) |
| [The next version](next.md) | The redesigned room: its layers and every component, why it's its own component, where it's used and its folder |

## How the interface is organised

**Layers.** The room is a stack, back to front: the ground; the stage's light (the ambilight); the stage; the two side panels; what's on them; the header; and what floats over everything for a moment (menus, cards, toasts). Each component belongs to one layer.

**Kinds.**
- **Building blocks** are small and reused everywhere (a face, an icon button, a menu, a slider). Each exists **once**, in `shared/ui/`, with variants; a second copy is a variant of the first, never a new component.
- **Room pieces** each do one job and are built from blocks (a person's row, the stage's controls, a chat message). They live in their feature's folder (`features/room/<area>/`).
- **Screen regions** hold pieces in place (the header, the stage, a column).

**Where the code lives.** The [architecture](../architecture.md#where-the-code-is-going) has the structure and its rules: one folder per component, holding its code, its styles and its one test file.

## Keeping these pages current

A change that adds, moves, renames or removes a component updates [today's app](today.md) in the same pull request, with its picture. When a piece of the next version is built, it moves from [the next version](next.md) to today's app.
