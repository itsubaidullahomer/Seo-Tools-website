---
title: "How Long Should a Password Be? What NIST Says"
description: "NIST's 2025 guidance sets 15 characters as the minimum when a password stands alone and 8 with a second factor. See the entropy math, passphrase lengths, myths."
date: "2026-09-30"
updated: "2026-09-30"
tags: [password, nist, passphrase, entropy, account-security]
relatedTools: [password-generator, character-counter, invisible-character]
---

A password should be at least 15 characters long when it is the only thing protecting an account, according to NIST's Digital Identity Guidelines (SP 800-63B, Revision 4, finalized in 2025). Eight characters is the floor only when a second factor backs the password up. For accounts you care about, a random 16-character password from a password manager, or a random six-word passphrase for the few secrets you must remember, sits comfortably above that floor.

*Last reviewed September 30, 2026.*

## Quick answer

- **Password is the only factor:** 15 characters is NIST's minimum for services. Treat it as your floor too.
- **Password plus a second factor:** NIST allows 8, but a random 16-character password costs nothing extra when a manager types it.
- **Secrets you must memorize** (manager master password, computer login): a random passphrase of six words.
- **Symbols, mixed case, forced rotation:** NIST tells services not to require them. Change a password when you have reason to think it leaked.
- **Randomness is the catch:** every strength figure below assumes a generator picked the password. One you invented is weaker than its length suggests.

## What NIST says, and what it does not

SP 800-63B is written for organizations that operate sign-in systems. US federal agencies are its formal audience, and many private companies borrow it. As of September 2026, the password requirements in Revision 4 can be summarized this way:

- **Length:** at least 15 characters when the password is a single-factor authenticator. A password used only as one part of multi-factor authentication may be shorter, but not below 8.
- **Maximum:** services should allow at least 64 characters, accept spaces and Unicode, and check the whole password instead of truncating it.
- **Composition:** no rules such as "one uppercase letter, one number, one symbol."
- **Rotation:** no periodic forced changes, but a change is expected when there is evidence of compromise.
- **Blocklist:** new passwords are compared against a list of commonly used, expected or compromised values.
- **Password managers:** services should allow autofill and pasting. Security questions, and hints visible to strangers, are ruled out.

NIST separates "shall" from "should," and the verbs matter in a compliance policy. Read the current SP 800-63B text on NIST's website before quoting any line as a requirement; this guide summarizes it.

The history explains the shift. NIST's 2003 guidance urged odd characters and regular changes. Its author, Bill Burr, told The Wall Street Journal in 2017 that he regretted much of it, because people met the rules with predictable patterns. Revision 3 (2017) recommended against composition rules and arbitrary expiry and set a minimum of 8. Revision 4, as of this writing, words the composition rule as a prohibition and raises the single-factor minimum to 15.

## Why length beats complexity: the entropy math

A randomly chosen password has `set size ^ length` possible values, and entropy in bits is `length × log2(set size)`. Every added bit doubles the possibilities. One more character multiplies the space by the whole set size, while adding a symbol class only raises the base a little.

Two examples, computed exactly:

- **8 random printable ASCII characters** (94 choices: 26 + 26 + 10 digits + 32 symbols): 94^8 = 6,095,689,385,410,816, about 6.1 × 10^15, or 52.4 bits.
- **15 random lowercase letters:** 26^15 = 1,677,259,342,285,725,925,376, about 1.7 × 10^21, or 70.5 bits.

The lowercase password has 2^(70.5 − 52.4), about 275,000 times more possibilities. More letters beat more character types.

To convert possibilities into time you need a guess rate. The table uses 100 billion guesses per second and the average case, half the possibilities: time = 2^(bits − 1) ÷ 100,000,000,000. That rate is an assumption, a generous stress test for defenders: a stolen database of passwords stored with a fast hash, guessed by a room of graphics cards. It is not a measurement.

| Random password | Set size | Bits | Average time at 100 billion guesses/s |
| --- | --- | --- | --- |
| 8 digits | 10 | 26.6 | 0.0005 seconds |
| 8 lowercase letters | 26 | 37.6 | 1 second |
| 8 letters and digits | 62 | 47.6 | 18 minutes |
| 8 printable ASCII | 94 | 52.4 | 8.5 hours |
| 12 printable ASCII | 94 | 78.7 | 75 thousand years |
| 15 lowercase letters | 26 | 70.5 | 270 years |
| 15 printable ASCII | 94 | 98.3 | 63 billion years |
| 16 printable ASCII | 94 | 104.9 | 5.9 trillion years |
| 20 printable ASCII | 94 | 131.1 | about 4.6 × 10^20 years |
| 5 words from 7,776 | 7,776 | 64.6 | 4.5 years |
| 6 words from 7,776 | 7,776 | 77.5 | 35 thousand years |
| 7 words from 7,776 | 7,776 | 90.5 | 270 million years |

*Illustration only. It assumes uniform random choice and a fast, unsalted hash. A leaked password falls instantly, whatever its length.*

Three readings of the table:

1. **Under about 50 bits, the time is short.** Eight random characters last hours at this rate.
2. **Storage changes the answer.** Against a deliberately slow hash at 10,000 guesses per second (another assumption), the same 8-character password would average about 9,700 years. You cannot see how a site stores passwords, so pick a length as if the worst case applies. This guide does not claim NIST derived its 15 from this formula.
3. **Past roughly 100 bits, extra length is insurance.** The risks that remain are mostly reuse and phishing.

All of this applies only to random choices. A human-picked password has far fewer effective possibilities than its length suggests, because people pick words, names, dates and patterns.

## Passphrases: how many words

A passphrase's strength comes from how many words it has and how they were chosen. The EFF's long word list holds 7,776 words (6^5), so each word takes five dice rolls and adds log2(7,776) = 12.9 bits. Five words give 64.6 bits, six give 77.5 and seven give 90.5. Six words match about 12 random printable characters and are far easier to type from memory.

What makes one hold up:

- **Let chance pick the words.** Dice or a generator counts. A lyric, a quote or a phrase that feels random to you does not, because the words follow each other predictably.
- **Match the count to the list.** A shorter list means fewer bits per word. The [Password Generator](/tools/password-generator) passphrase mode draws from 1,500 words, about 10.55 bits each, so it takes seven words for roughly 74 bits.
- **Watch site limits.** Some services cap passwords at 16 or 20 characters. Paste a sample of the same shape into the [Character Counter](/tools/character-counter) before you commit to a phrase the site may refuse.

## What length cannot fix

Length defends against guessing and nothing else. **Reuse** hands a breached site's password to every account that shares it. **Phishing** collects a 40-character password as easily as a 6-character one, and a passkey or hardware key, where offered, resists it better. **Malware** reads what you type. Turn on multi-factor authentication for email, banking and the password manager first, then give every other account its own [random password](/tools/password-generator) of 16 or more characters.

## Three myths

### Myth 1: "Symbols and substitutions make a short password strong"

Moving from letters and digits (62 choices) to all 94 printable characters at 8 characters multiplies the space by (94 ÷ 62)^8, about 28, or 4.8 bits. One more random character from the 62-character set multiplies it by 62, or 5.95 bits. One extra character is worth more than all 32 symbols combined. Swaps like `a` to `@` are known patterns that guessing software applies automatically.

### Myth 2: "Change it every 90 days"

Forced rotation produces small edits, such as the same word with a new number, which hand an attacker a short list of likely next passwords instead of a fresh secret. NIST's current guidance drops periodic changes. Do change a password after a breach notice, a phishing scare, or discovering it was reused on a site that leaked.

### Myth 3: "A long password is automatically strong"

Length is a proxy for randomness, and the proxy fails for text people write. A 20-character movie quote, a pet's name plus a birth year, or `qwertyuiopasdf` are long and still guessable, because attackers try quotes, names, dates and keyboard walks first.

## If you run a site

- Accept at least 64 characters, spaces and Unicode, never truncate, and allow pasting so managers work.
- Require 15 characters for password-only sign-in, or 8 if a second factor is always required, in line with the current NIST text.
- Drop composition rules and scheduled expiry, force a reset when compromise is suspected, and check new passwords against a blocklist of common and breached values.
- Store passwords with a slow, salted hash such as Argon2id or bcrypt. The OWASP Password Storage Cheat Sheet lists current settings.

## Common mistakes

- **Stopping at the site's minimum.** A form that accepts 8 characters does not make 8 safe when there is no second factor.
- **Tacking a digit and symbol onto a word.** `Sunshine2026!` satisfies most composition rules while following a pattern attackers commonly try early.
- **Composing the passphrase yourself.** Words that feel random to you are not.
- **Typing real passwords into unknown strength checkers.** Use only tools that run in your browser and send nothing, and test a sample.
- **Copying a hidden space.** A trailing space or zero-width character can make sign-in fail. The [Invisible Character](/tools/invisible-character) tool highlights hidden characters in pasted text, so test with a similar string, not the real password.

## Frequently asked questions

### Is 12 characters enough for a password?

A random 12-character password from all 94 printable characters holds 78.7 bits, out of reach for guessing at any rate used here. One you invented is weaker, and NIST's password-only minimum is 15, so use 15 or more where the site allows.

### Is an 8-character password ever acceptable?

Only as NIST's minimum for a password that is one part of multi-factor authentication. Eight random characters average about 8.5 hours in the illustration above, so go longer whenever you can.

### How many words should a passphrase have?

Six random words from a 7,776-word list give 77.5 bits, a solid choice for a manager master password. Five words (64.6 bits) suit lower-stakes secrets, and a shorter word list needs an extra word or two. The words must come from dice or a generator.

### Do I still need numbers and special characters?

Not for strength, if the password is long and random. Fifteen random lowercase letters carry 70.5 bits. Add other character types only when a site demands them.

### How often should I change my password?

Not on a schedule. NIST tells services not to force periodic changes and to expect one when there is evidence of compromise. Change a password after a breach notice, a phishing incident or discovered reuse.

*This guide is general security education, not a compliance opinion or a guarantee. It is independent of NIST, the EFF, OWASP and any password manager or site named, and none has reviewed or endorsed it. Confirm current requirements in the NIST SP 800-63B document.*
