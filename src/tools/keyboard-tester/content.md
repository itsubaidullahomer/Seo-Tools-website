## What this keyboard tester does

This keyboard tester shows every key press on a drawing of your keyboard. A key turns orange while it is down, then stays green with a check mark so you can see what you have covered. Alongside the drawing you get the raw values the browser reports, a counter for how many keys were held at once, a chatter detector for keys that type twice, and multi-key checks for ghosting.

People use it to check a used laptop before paying, to prove that a gaming board drops keys, or to learn whether an "E" that types "ee" is a worn switch or a setting. The page answers one question: does the keyboard send the right signal, exactly once, every time?

Everything runs in your browser. The page cannot see keys pressed in other windows, and it does not store or upload anything you press.

## How to use the keyboard tester

1. **Pick your board.** Set "Keyboard size" (full-size, tenkeyless, 75% or laptop, 60%), "Key standard" (ANSI or ISO) and "Modifier key labels". Auto-detect chooses Windows or Mac labels for you.
2. **Click the keyboard.** The badge changes to "Capturing keys" and every key is intercepted, so Tab, Space, F5 and Ctrl+F do not act on the page. To stop, hold Esc for two seconds or click outside the keyboard.
3. **Press every key.** Orange means down now, green with a check mark means registered, and a red exclamation mark means possible chatter. White keys are untested.
4. **Read the details.** "Last key event" shows `event.key`, `event.code`, the legacy `keyCode`, location, auto-repeat and hold time. The event log lists the last 50 key-downs and key-ups with timing.
5. **Skip keys you do not have.** Under "Keys still to test", click a key your board lacks, such as a numpad key or Print Screen, to leave it out of the count.
6. **Run the ghosting checks** and set the chatter threshold, both explained below.
7. **Save the result.** "Copy report" or "Download report" gives a plain-text summary. "Reset test" starts over.

Try "Fullscreen + key lock" in Chrome or Edge. In fullscreen the browser lets the page capture normally reserved keys, including Esc and the Windows key, so you can test those too.

## Reading key, code and keyCode

Three values describe every press, and they answer different questions.

| Value | What it tells you | Changes with your layout? |
| --- | --- | --- |
| `event.code` | Which physical key was pressed, such as `KeyQ` or `ShiftLeft` | No |
| `event.key` | The character or action produced, such as `a`, `A` or `Enter` | Yes, and with Shift and Caps Lock |
| `event.keyCode` | An older numeric code, deprecated but still used by some games | Partly |

A worked example shows the difference. On a French AZERTY keyboard the key just right of Tab sits where Q is on a US board. Press it and the tester reports `code = KeyQ`, `key = a` and `keyCode = 65`. The code identifies the position; the key reports what your layout typed there. When diagnosing hardware, trust the code: a dead key is a dead position, whatever its label says.

The `location` field separates twin keys, such as left and right Shift.

## Ghosting, blocking and rollover explained

Most keyboards do not wire each switch on its own line. They arrange switches in a grid of rows and columns and scan it thousands of times a second. When three keys forming a corner of the grid are down, the controller can see current reaching a fourth intersection where nothing is pressed. That false signal is **ghosting**. If the controller refuses the ambiguous combination instead, a real key goes missing, which is **blocking**. A diode beside each switch closes the false path, which is what "anti-ghosting" means on a gaming board.

**Rollover** is how many keys the keyboard can report together.

| Term | What registers | Where you meet it |
| --- | --- | --- |
| 2-key rollover | Two keys reliably, more only for some combinations | Cheap membrane keyboards |
| 6KRO | Up to six regular keys plus modifiers | Many USB keyboards, since the standard boot report holds six keys and eight modifier bits |
| NKRO | Every key at once | Gaming and enthusiast boards, often a switchable mode |

The tool measures this two ways. "Most held at once" is the highest number of regular keys down together; Shift, Ctrl, Alt and the Windows or Command key are counted separately because keyboards report them separately. The combination checks are more diagnostic, because blocking depends on which keys you choose. The four- and five-key checks should pass on any decent keyboard, and the three-key Up + Left + Space check is worth watching on laptops, where some keyboards block it. The seven-key and nine-key checks pass only if the board reports more than six keys, so failing them on a 6KRO board is normal, not a fault.

## Key chatter and double typing

A mechanical switch is two metal contacts. When they meet they bounce for roughly half a millisecond to five milliseconds, and the keyboard's firmware hides this by ignoring changes for a short debounce period, commonly around 5 to 10 milliseconds. Chatter appears when a switch is worn or dirty and bounces longer than the debounce allows, so one press becomes two.

The tester looks for exactly that: a key-down on the same key sooner than the threshold after its key-up. Auto-repeat from holding a key is ignored. Worked example: a key is released at 4,210.3 ms and goes down again at 4,218.1 ms. The gap is 7.8 ms, below the default 30 ms threshold, so the key is flagged and its cap turns red. A deliberate second tap leaves a gap of 90 ms or more and passes.

The "Chatter threshold" slider runs from 5 to 100 ms. Thirty is a sensible start, since people rarely re-press one key that fast on purpose. If very fast double-taps cause false alarms, lower it to around 15. Browsers may round timestamps, so treat gaps of a few milliseconds as approximate.

## A dead key or a software problem?

Test the key here before you change anything.

1. **Press it in the tester.** If it lights up, the hardware works and the fault is in software.
2. **Check the input language.** A wrong layout gives the wrong character from a working key. Switch layouts and watch the label.
3. **Look for filters and remappers.** Windows Filter Keys can ignore brief or repeated presses, and remapping utilities or a keyboard's own software can disable a key.
4. **Test outside the operating system.** The BIOS or boot menu loads before drivers, so a key that works there but not later points to software.
5. **Plug in another keyboard.** If the fault follows the laptop, it is the internal keyboard or its cable.
6. **Clean and reseat.** Compressed air clears debris, and a lifted keycap can stop a press reaching the switch.

| Symptom | Likely cause | First fix |
| --- | --- | --- |
| Key never lights up here | Failed switch, torn membrane, loose cable | Clean, then repair or replace |
| Wrong character from a working key | Layout or remapping | Change input language, check remappers |
| One press types twice | Switch chatter | Clean, raise debounce, replace switch |
| Keys drop during fast play | Ghosting or 6-key limit | Run the combination checks, try an NKRO mode |

## Testing a new or used laptop

Laptop keyboards fail in ways a quick typing test misses. Press "Reset test", then work along each row slowly, including the function row. Run the five-key combination checks. Tap the keys people use most, such as Space, Enter, Backspace, E and A, ten times each and watch for chatter. Then test by hand what the browser cannot see: brightness, volume and Fn shortcuts. Finish with "Copy report" so you have a record for a warranty claim or a price negotiation.

## What browsers cannot detect

A web page only receives what the operating system and browser pass along.

| Key or situation | What happens |
| --- | --- |
| Fn | Handled in keyboard firmware, so nothing reaches the page |
| Print Screen | The system often takes it; the page may get only a key-up, or nothing |
| Windows or Command key | Opens the Start menu or a system shortcut unless key lock is active |
| Alt+Tab, Ctrl+Alt+Delete, Ctrl+W, Ctrl+T | Reserved by the system or browser |
| Media, brightness and volume keys | Frequently handled by the operating system or firmware |
| Caps Lock on a Mac | May report once per toggle instead of a press and a release |
| Other keys while Command is held on a Mac | No key-up is delivered, so the tool clears them when Command is released |
| AltGr on many Windows layouts | Reported as Ctrl plus Alt, so Left Ctrl can light up |

Key lock is a Chromium feature, so it works in Chrome and Edge but not in Firefox or Safari. The same browsers can read your layout for relabeling; elsewhere the tool learns key caps from what you press. Remote desktop sessions and virtual machines can change or swallow key events, so test on the physical machine.

## Privacy and limitations

Key presses are processed by JavaScript in this tab. They are not recorded, uploaded or passed to analytics, and the event log and results vanish when you reset or leave the page. Only your board settings are saved, in your browser's local storage. Because the log prints what you type, do not enter passwords here; if you need a strong one, use the [password generator](/tools/password-generator).

This tool shows what the browser receives. That is a good test of the keyboard, but not a complete one: a key that works here can still fail in a game that reads input differently, and a key behind Fn needs a check in the operating system. To test your mouse next, try the [click speed test](/tools/click-speed-test).
