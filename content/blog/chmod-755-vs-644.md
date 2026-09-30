---
title: "chmod 755 vs 644 vs 777: What the Numbers Mean"
description: "chmod 755 is rwxr-xr-x and 644 is rw-r--r--, differing only by the execute bit. See how each digit is computed, which to use where, and why 777 is wrong."
date: "2026-09-30"
updated: "2026-09-30"
tags: [chmod, linux, file-permissions, octal, sysadmin]
relatedTools: [chmod-calculator, password-generator]
---

chmod 755 and chmod 644 differ in exactly one thing: the execute bit. Mode 755 (`rwxr-xr-x`) lets the owner read, write and run an item and everyone else read and run it, while 644 (`rw-r--r--`) lets the owner read and write and everyone else only read. Use 755 for directories and programs, 644 for ordinary files, and treat 777, which lets every account on the machine write, as a sign that an ownership problem is being patched the wrong way.

*Last reviewed September 30, 2026.*

## Quick answer

- **755:** directories, scripts you run directly, and programs others must launch.
- **644:** HTML, CSS, images, documents and other files that are read but never run.
- **600:** SSH private keys and other secrets only the owner should see.
- **777:** almost never. Fix the owner or the group instead.

## How the digits are computed

A mode has three digits, always in the order owner, group, others. Each digit is a sum of weights: read is 4, write is 2 and execute is 1, and a missing permission adds 0. The weights are the place values of a three-digit binary number, so no digit can exceed 7. Here are both modes built from their `ls -l` strings:

```
755 = rwx r-x r-x = 111 101 101 = (4+2+1) (4+0+1) (4+0+1) = 7 5 5
644 = rw- r-- r-- = 110 100 100 = (4+2+0) (4+0+0) (4+0+0) = 6 4 4
```

Compare the binary strings and they differ in three places, the last bit of each group. The XOR of the two modes is 111 in octal, so 755 is 644 with execute switched on for everyone. Octal addition is not a safe shortcut: 755 + 111 carries to 1066, which sets the sticky bit.

To read a mode backward, split a line from `ls -l`:

```
-rwxr-xr-- 1 deploy staff 2048 Sep 30 09:14 backup.sh
```

The first character is the type (`-` for a file, `d` for a directory). The remaining nine split into `rwx`, `r-x` and `r--`, which sum to 7, 5 and 4, so the mode is 754: the owner edits and runs it, the group reads and runs it, everyone else only reads. The [chmod calculator](/tools/chmod-calculator) converts in both directions.

## Choosing a mode by file type

Pick the mode from what the item does, then check who owns it.

| Item | Mode | Reason |
| --- | --- | --- |
| Directories, including web roots and upload folders | 755 | Everyone can enter; only the owner changes what is inside |
| Script run as `./deploy.sh`, or a compiled program | 755 (750 or 700 to limit who runs it) | Needs execute, plus read if interpreted |
| HTML, CSS, JavaScript, images, PDFs, PHP files | 644 | Served or read, never launched |
| Config file holding credentials | 640 or 600 | Owner, and perhaps one service group |
| SSH private key and `authorized_keys`; the `~/.ssh` folder | 600; 700 | Private keys stay owner-only; `ssh` ignores a key others can access |
| Team folder a group edits | 2775, files 664 | Group write; new files inherit the group |
| Shared scratch space like `/tmp` | 1777 | Everyone writes, nobody deletes others' files |

On typical PHP-FPM and mod_php setups the operating system never executes a `.php` file, so 644 is enough; programs a web server launches directly as CGI are the exception.

Execute matters only when you launch a file directly, and scripts also need read. In a test run for this guide, a shell script at 644 was denied as `./script.sh` but ran as `sh script.sh`, and a script at 711 failed with "Permission denied" while a compiled binary at 711 ran. Method for every test here: scripts written for this guide ran each command on Linux (GNU coreutils 9.4) with root's permission-override capabilities dropped and the files owned by another account, so mode bits were enforced.

For SSH, OpenSSH's client ignores a private key you own if group or others have any access to it: the check in its source file `authfile.c` tests the mode against 077, and the client prints "WARNING: UNPROTECTED PRIVATE KEY FILE!" (read as of this writing; the ssh(1) manual page is the authority). Both 600 and 400 pass. A mode only stops other users, so protect the key itself with a passphrase from the [password generator](/tools/password-generator).

## Why 777 is almost always wrong

Count the ones in each binary string. 777 is nine set bits, 755 has seven and 644 has four. Compared with 755, the two extra bits in 777 are write for group and for others. Modes 600, 644 and 755 are writable by the owner alone, 664 and 775 add the group, and 777 adds every other account and process on the machine.

On a web server, a vulnerable plugin or script running as the server's account could then rewrite your code. In the test run, an unrelated process created a file in a 777 directory owned by someone else and deleted the owner's file. Against a 755 directory both were denied.

People reach for 777 because "Permission denied" never says why. The usual causes are wrong ownership, a group missing a member, or a parent directory without execute. Better fixes:

1. **A web server cannot write to an uploads folder.** Give the folder to the server's user or group with `chown` or `chgrp`, then use 755, or 775 with group write.
2. **A script will not run.** Run `chmod u+x script.sh`, then check each parent directory. On most Linux systems `namei -l /full/path` prints the mode of every component.
3. **Two people share a folder.** Put them in one group and use 2775.

The one legitimate world-writable directory carries the sticky bit, as in 1777. In the test run, an unrelated process could create files there and delete its own, but removing another user's file failed with "Operation not permitted". The GNU coreutils manual describes the sticky bit as stopping unprivileged users from removing or renaming files they do not own, commonly on directories like `/tmp`. This guide is general information, not security advice for your system, so test changes on a copy first.

## Why a directory at 644 breaks

On a directory, execute means "reach what is inside". Results from the test run:

- **Directory at 644, unrelated user:** `cd` was denied. `ls` printed names, but `ls -l` printed "Permission denied" with question marks for details, and `cat dir/a.txt` failed.
- **The same directory as its owner:** `cd` was also denied until the mode became 755.
- **Directory at 711:** `ls` was denied, but `cat dir/a.txt` worked because the name was known.

To serve `/srv/app/public/logo.png`, a web server needs execute on `/srv`, `/srv/app` and `/srv/app/public`, however open the file is.

## Symbolic equivalents

Each octal mode has a symbolic spelling. In the test run, every command below was applied to a file starting at mode 000 and read back with `stat`:

| Octal | `ls -l` string | Command that sets it exactly |
| --- | --- | --- |
| 755 | `rwxr-xr-x` | `chmod u=rwx,go=rx` |
| 644 | `rw-r--r--` | `chmod u=rw,go=r` |
| 600 | `rw-------` | `chmod u=rw,go=` |
| 750 | `rwxr-x---` | `chmod u=rwx,g=rx,o=` |
| 664 | `rw-rw-r--` | `chmod u=rw,g=rw,o=r` |
| 777 | `rwxrwxrwx` | `chmod a=rwx` |

A numeric mode replaces all nine bits; a symbolic one changes only what you name, so `chmod go-w file` leaves the owner's bits alone. The symbolic box in the [chmod calculator](/tools/chmod-calculator) previews a change without touching a real file.

The shortcut `chmod +x` depends on your umask. Starting from 644, `+x` gave 755 under umask 022 and 002 but 744 under 077, because that umask masks the group and others execute bits. `chmod a+x` gave 755 and `chmod u+x` gave 744 under all three.

For a whole tree, capital X adds execute to directories and to files that already have an execute bit. On a tree whose directories and script were at 700 and whose plain files were at 600, `chmod -R u=rwX,g=rX,o=rX tree` produced 755 for the directories and script and 644 for the plain files, while `chmod -R 755 tree` made every plain file executable. The [chmod calculator](/tools/chmod-calculator) also writes the paired `find -type d` and `find -type f` commands.

## Special bits in one minute

A fourth leading digit holds three flags, which the GNU coreutils manual values at 4000 for set-user-ID, 2000 for set-group-ID and 1000 for the sticky bit. They show in `ls -l` as `s` and `t`: 4755 lists as `rwsr-xr-x` (a program that runs as its owner, for audited binaries only), 2775 as `rwxrwsr-x` (new files inherit the directory's group) and 1777 as `rwxrwxrwt`.

## Common mistakes

- **Typing the mode as a decimal number in code.** With Python 3.11 and Node 22, `os.chmod(path, 755)` and `fs.chmodSync(path, 755)` both produced mode 1363 (`-wxrw--wt`), because decimal 755 is octal 1363 (1 × 512 + 3 × 64 + 6 × 8 + 3). Use `0o755`, or a string such as `'755'` in Node, which gave 755.
- **Running `chmod -R 755` or `chmod -R 644` on a tree.** The first makes every file executable and the second locks ordinary accounts out of every directory, root aside.
- **Treating the umask as subtraction.** A new file starts at 666 and the umask clears bits. Under umask 027 that is 666 AND NOT 027 = 640, where subtraction gives 637.
- **Assuming the mode is the last word.** The GNU manual notes that a read-only mount or an immutable attribute can block what the mode allows. `chmod` also cannot change an owner; `chown` does that.

## Frequently asked questions

### Should files be 755 or 644?

Use 644 for files that are read but not run, such as web pages, images and configuration, and 755 for scripts, programs and every directory. If in doubt, start at 644 and add execute only when the file must launch.

### What is the difference between 755 and 775?

Only the group's write bit. 775 (`rwxrwxr-x`) lets members of the group change or delete entries, where 755 lets only the owner. Choose 775 for a folder a team shares and 755 when one account manages the content.

### Is chmod 777 ever acceptable?

Rarely. The standard exception is a shared scratch directory with the sticky bit, 1777. Otherwise correct the owner or group, then use 755 and 644, or 775 and 664.

### What permissions should an SSH private key have?

600, meaning read and write for the owner only. OpenSSH ignores a key you own when group or others have any access to it, so 400 works too. Keep `~/.ssh` at 700.

### How do I turn 644 into 755?

Run `chmod 755 file`, which sets all nine bits, or `chmod a+x file`, which adds execute for everyone whatever your umask. Plain `chmod +x` gives 755 under a 022 umask but 744 under 077. On Linux, confirm with `stat -c '%a %A' file`.

*This guide is independent and not affiliated with the GNU Project, the OpenSSH project, Python, Node.js or any Linux distribution. Their names only identify the tools and documents discussed.*
