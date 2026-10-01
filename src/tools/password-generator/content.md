## What this password generator does

This password generator creates strong random passwords and memorable passphrases in your browser, then shows how strong each one really is. Strength is not a guess based on how the password looks. It comes from the math of how the password was made: the number of equally likely results the generator could have produced, expressed as bits of entropy, and the average time a fast offline guessing setup would need to find it.

There are two modes. **Random password** builds 8 to 128 characters from uppercase and lowercase letters, numbers and 28 widely accepted symbols. **Passphrase** joins 3 to 10 words picked from a built-in list of 1,500 short English words, such as `Maple-Orbit-Cozy7-Harbor-Sprint-Teal`. You can make up to 20 at once, copy any one with a click, or copy the whole batch.

## How to use it

1. **Pick a mode.** Use *Random password* for anything a password manager will fill in for you. Use *Passphrase* for the few secrets you have to type from memory.
2. **Set the length.** Drag the *Length* slider or type a number (8–128, default 16). In passphrase mode, choose the *Number of words* (3–10, default 6).
3. **Choose character types.** Turn uppercase, lowercase, numbers and symbols on or off. Every type you select is guaranteed to appear at least once.
4. **Handle picky sites.** *Exclude ambiguous characters* removes `0 O 1 l I |`. *No repeated characters* uses each character at most once. The *Never use these characters* box removes anything a site rejects.
5. **Passphrase options.** Pick a separator (hyphen, space, period, underscore or your own), capitalize each word, and optionally add one random digit.
6. **Generate and copy.** Results update the moment you change a setting. Press *Generate new* for a fresh set, *Hide* to mask them on a shared screen, and *Copy* next to the one you want.

If your settings make a password impossible (say, "no repeats" at a length longer than the available characters), the tool explains why instead of quietly producing something weaker.

## How the strength meter works

A randomly generated password has entropy of:

```
bits = length × log2(size of character set)
```

For passphrases the "characters" are whole words:

```
bits = words × log2(size of word list)
```

Each bit doubles the number of possibilities. On average an attacker has to try half of them, so the tool estimates:

```
average time = 2^(bits − 1) ÷ 10,000,000,000 guesses per second
```

**Worked example.** The default password is 16 characters from 90 possible characters (26 + 26 + 10 + 28). That is 16 × log2(90) = 16 × 6.49 ≈ 103.9 bits. Because the tool also guarantees at least one character of each type, it removes the passwords that miss a type and counts what is left exactly, which gives 103.6 bits: about 1.6 × 10^31 possible passwords. At ten billion guesses per second, finding one takes on average about 25 trillion years.

The labels are: **Weak** under 48 bits, **Fair** 48–63, **Strong** 64–79 and **Very strong** 80 or more. At the assumed speed, 48 bits falls in about 4 hours, 64 bits takes about 29 years and 80 bits about 1.9 million years.

### Why 10 billion guesses per second?

The real speed depends on how the site stored your password. In hashcat's published benchmark for a single RTX 4090 graphics card, it tests about 164 billion MD5 guesses per second, 22 billion SHA-256 guesses, and only about 184,000 bcrypt guesses at a low cost setting (most sites use a higher, slower one). Ten billion per second sits between those extremes, so treat the estimate as a reference point, not a promise. If you want a safety margin, multiply the speed by 100: the default 16-character password still needs an average of about 250 billion years, while 8 random characters from all four types fall in about 36 minutes instead of 2 days.

### Reference table

Average time to guess at 10 billion guesses per second, using the simple formula above. The tool's exact count also removes passwords that miss a selected type, so it shows slightly less: 8 characters from all four types read 50.8 bits (about 1 day), not 51.9.

| Password | Bits | Average time to guess |
| --- | --- | --- |
| 8 lowercase letters | 37.6 | 10 seconds |
| 8 characters, all four types (90) | 51.9 | 2 days |
| 12 letters and numbers (62) | 71.5 | 5.1 thousand years |
| 12 characters, all four types | 77.9 | 447 thousand years |
| 16 lowercase letters | 75.2 | 69 thousand years |
| 16 characters, all four types | 103.9 | 29 trillion years |
| 20 characters, all four types | 129.8 | about 10^21 years |
| 4-word passphrase (1,500 words) | 42.2 | 4 minutes |
| 6-word passphrase | 63.3 | 18 years |
| 6 words + a digit | 69.2 | 1.1 thousand years |
| 7-word passphrase | 73.9 | 27 thousand years |
| 8-word passphrase | 84.4 | 41 million years |

Length does far more than adding character types: 16 lowercase letters beat 12 characters of letters and numbers. And these numbers only hold for passwords a machine picked at random. `Summer2025!` also has 11 characters from four types, but it sits near the top of every guessing list because people choose it.

## Why passphrases beat short "complex" passwords

The xkcd comic "Password Strength" (number 936) made the point memorably: `Tr0ub4dor&3` looks complex but follows a common pattern (dictionary word, predictable substitutions, digit and symbol at the end) and carries about 28 bits. Four truly random words, as in "correct horse battery staple", carry about 44 bits and are far easier to remember.

The same logic applies here. Each word from this tool's 1,500-word list adds log2(1,500) ≈ 10.55 bits, the same as about 1.6 random characters from the full 90-character set. Diceware lists such as the EFF's 7,776-word list give 12.9 bits per word; this list trades about 2.4 bits per word for shorter, easier words, so add one extra word. Six words (63 bits) or seven (74 bits) make a phrase you can learn in a few days. The generator must choose the words; a phrase you invent, like a song lyric, has a fraction of that entropy.

NIST's digital identity guidelines (SP 800-63B, revision 4, finalized in 2025) now point the same way. They ask for at least 15 characters when a password is the only login factor (8 when it is paired with another factor), recommend that services accept at least 64 characters including spaces, and forbid composition rules such as "one uppercase, one symbol". They also forbid forced periodic password changes and require new passwords to be checked against lists of known-compromised ones. In short: length and randomness over complexity.

## How the randomness works

Every random choice comes from `crypto.getRandomValues`, the browser's cryptographically secure pseudorandom number generator (CSPRNG), seeded by the operating system and used by browsers to create encryption keys. `Math.random` is never used; it is not designed to be unpredictable.

Two details keep the output unbiased:

- **No modulo bias.** Turning a random 32-bit number into a choice among 90 characters with a plain remainder would make some characters slightly more likely. The tool discards the few values that would cause this (rejection sampling), so every character is exactly equally likely.
- **"One of each type" without shortcuts.** Many generators place one character of each type and fill in the rest, which subtly changes the odds. This tool draws a completely random password and simply draws again if a selected type is missing. Every valid password is equally likely, which is why the entropy figure can be exact.

## Which setting for which job

- **Everyday website logins (with a password manager):** 16–20 characters, all four types. Let the manager remember them and use a different one for every site.
- **Password manager master password or computer login:** a 7-word passphrase with a separator, 74 bits or more. You will type it often, so it should be easy to type.
- **Home Wi-Fi (WPA2/WPA3 personal):** the passphrase must be 8–63 characters. A 5- or 6-word passphrase with spaces is easy for guests to read aloud and type on a TV remote. Turn on *Exclude ambiguous characters* if you use random characters instead.
- **Developers and administrators:** for database passwords, API secrets or environment variables, use 32 characters of letters and numbers only (about 190 bits). That avoids quoting and escaping problems in shell scripts, URLs and config files.
- **IT onboarding:** generate 20 temporary passwords at once with ambiguous characters excluded and require a change at first sign-in.

## Password managers and two-factor authentication

A strong password only helps if it is unique: reuse means a breach at the weakest site exposes all the others. A password manager generates, stores and fills a different random password for every account, and you remember just one passphrase.

Add two-factor authentication wherever it is offered, starting with email, banking and the password manager itself. Passkeys or a hardware security key are strongest, then an authenticator app; SMS codes can be intercepted through SIM swaps but beat nothing. With a second factor, a stolen password alone is not enough to sign in.

## Common password myths

- **"Swapping letters for symbols makes it strong."** `P@ssw0rd` is on every guessing list; guessing tools apply these substitutions automatically.
- **"Complexity matters more than length."** The table shows the opposite. Each extra character multiplies the possibilities; one mandatory symbol barely does.
- **"Change your password every 90 days."** Forced rotation produces predictable patterns. Change a password when it may have been exposed.
- **"If it looks random, it is random."** Keyboard walks like `qwerty123` and personal details look messy but are some of the first things tried.
- **"An online generator can see my password."** Some could. This one runs entirely on your device; go offline and it keeps working.

## Privacy and limitations

Everything happens in your browser. No password is sent over the network, logged, or written to storage; refreshing the page produces new ones. Only your settings (mode, length, toggles) are remembered in this browser's local storage.

The time-to-guess figure is an educational estimate at a fixed 10 billion guesses per second. Real attacks are far slower against sites that use bcrypt or Argon2, faster with many graphics cards against MD5 or NTLM, and instant if the password has already leaked, because entropy no longer matters once an attacker has the password itself. The strength meter rates the generator's output, so it cannot score a password you typed yourself. A generated password is only as safe as where you keep it: use a password manager, not a text file or a sticky note.
