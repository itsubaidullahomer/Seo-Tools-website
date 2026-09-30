## What this chmod calculator does

This chmod calculator turns the nine permission checkboxes on a Linux or Unix file into the numbers and commands you type. Tick read, write and execute for the owner, the group and everyone else, and it shows the octal mode (`755`), the symbolic mode from `ls -l` (`rwxr-xr-x`), a plain-English sentence for each class and a copy-ready `chmod` command. Type into the octal or symbolic box and the checkboxes follow, so you can also decode a mode from a tutorial or a Dockerfile.

It supports setuid, setgid and the sticky bit, and warns about risky modes such as 777, setuid files that others can edit, or directories with read but no execute. It builds the `find` commands that give directories and files different modes across a tree, previews what `chmod +x` or `g-w` does to an existing mode, and works out the modes a umask produces.

## How to use the calculator

1. **Optionally pick a preset**: WordPress, `wp-config.php`, Laravel storage, an SSH key or folder, a script, a shared team folder or a shared temp folder. It loads a mode, an item type and an example path, with a note on why.
2. **Choose File or Directory.** Execute means "run" on a file and "enter" on a directory, and the warnings change to match.
3. **Tick the boxes.** Read is 4, write is 2 and execute is 1 for Owner, Group and Others, and the Digit column shows each row's sum. Setuid, Setgid and Sticky add a fourth leading digit.
4. **Or type a mode.** Octal takes one to four digits (`644`, `4755`). Symbolic takes nine characters such as `rwxr-xr-x`, or ten with a leading `-` or `d`. Invalid input gets a specific message and the last valid mode stays.
5. **Copy a command.** Set the path under Copy-ready commands. Spaces are quoted, a leading `~/` still expands, and the sudo switch adds `sudo`.
6. **For a whole tree**, the Directories and Files fields start from your mode: directories get execute wherever read is set, and files lose every execute bit. Edit either field to override it.
7. **Test a symbolic change** or use the umask calculator further down. Your inputs stay in this tab, and Reset calculator returns to 755.

## How permission bits become an octal number

Each class has three switches worth 4, 2 and 1, the place values of the binary digits 100, 010 and 001. The three bits form a binary number, and its value is one octal digit from 0 to 7. Worked example for `rwxr-x---`:

```
owner   rwx  =  111  =  4+2+1  =  7
group   r-x  =  101  =  4+0+1  =  5
others  ---  =  000  =  0+0+0  =  0
                                  =>  750
```

In reverse, 640 splits into 6, 4 and 0, which reads `rw-r-----`: the owner reads and writes, the group reads, everyone else is locked out.

| Digit | Binary | Symbolic | Digit | Binary | Symbolic |
|---|---|---|---|---|---|
| 0 | 000 | `---` | 4 | 100 | `r--` |
| 1 | 001 | `--x` | 5 | 101 | `r-x` |
| 2 | 010 | `-w-` | 6 | 110 | `rw-` |
| 3 | 011 | `-wx` | 7 | 111 | `rwx` |

**The fourth digit** holds the special bits: 4 for setuid, 2 for setgid, 1 for sticky, added together when you need several. So 4755 is setuid plus 755, and `ls -l` shows it by replacing the owner's `x` with `s`: `rwsr-xr-x`. A capital `S` or `T` means the special bit is set but the matching execute bit is not. 1777 reads `rwxrwxrwt`, the mode of `/tmp`.

## Common chmod modes and when to use them

| Octal | Symbolic | Use it for | Watch out for |
|---|---|---|---|
| 777 | `rwxrwxrwx` | Nothing permanent | Any user or compromised process can rewrite it |
| 775 | `rwxrwxr-x` | Shared directories a team group writes to | Every group member can delete anything inside |
| 755 | `rwxr-xr-x` | Directories, scripts, public programs | Plain data files do not need execute |
| 750 | `rwxr-x---` | Programs or folders for one group | Everyone else gets "Permission denied" |
| 700 | `rwx------` | Private directories such as `~/.ssh` | Even the web server cannot enter |
| 644 | `rw-r--r--` | Ordinary files: HTML, images, config | No execute, so scripts will not run directly |
| 640 | `rw-r-----` | Config secrets a service group must read | The service account must be in that group |
| 600 | `rw-------` | SSH private keys, credentials | Services running as another user cannot read it |
| 400 | `r--------` | Locked-down keys and strict config | The owner needs `chmod u+w` before editing |

Three special modes come up often: **1777** for shared temp directories, **2775** for team directories where new files inherit the group, and **4755** for a setuid program, which belongs only on audited binaries.

## What execute means on directories

On a directory the three bits mean something different from a file:

- **Read (r)** lets you list the names inside, as `ls` does.
- **Execute (x)** lets you enter with `cd` and reach anything inside by path. Opening `/var/www/site/index.html` needs execute on `/var`, `/var/www` and `/var/www/site`, whatever the file's own mode says.
- **Write (w)** lets you create, rename and delete entries, but only when execute is also set.

A directory at 644 locks out everyone, its owner included, because nobody has execute. A directory at 711 lets others open files whose exact names they know without seeing what is there. And deleting a file depends on write permission for its *directory*, not on the file's own mode, so you can delete a read-only file you cannot edit. That is the gap the sticky bit closes on shared folders.

## Symbolic mode: chmod +x, u=rw and the umask catch

Symbolic modes read as **who, operator, permissions**, with clauses separated by commas. Who is `u` (owner), `g` (group), `o` (others) or `a` (all). The operator is `+` to add, `-` to remove or `=` to set exactly. Permissions are `r`, `w`, `x`, plus `X`, `s` and `t`, or `u`, `g`, `o` to copy another class's bits.

```
chmod u+x deploy.sh          # owner may run it
chmod g-w,o-rwx notes.txt    # group loses write, others lose everything
chmod u=rw,go=r report.txt   # exactly rw-r--r--
```

**The `+x` catch.** With no who letters, GNU chmod acts like `a` except that bits set in your umask are left alone. With the usual umask of 022, `chmod +x` adds execute for all three classes, so 644 becomes 755. With umask 077 it adds execute for the owner only, giving 744. `chmod a+x` ignores the umask. Set the umask box in "Try a symbolic change" to 077 to see both results.

**Capital X** adds execute only to directories and to items that already have an execute bit, which suits trees. Symbolic modes change only the bits you name; a numeric mode replaces everything.

## Recursive chmod without breaking your files

`chmod -R 755 site/` gives every file the execute bit, and `chmod -R 644 site/` makes every directory impossible to enter. Treat the two kinds separately:

```
find site -type d -exec chmod 755 {} +
find site -type f -exec chmod 644 {} +
chmod -R u=rwX,g=rX,o=rX site     # one command that keeps scripts executable
```

The `find` pair strips execute from every file, scripts included, so restore it on `deploy.sh` afterward. The capital-X command keeps already-executable files executable. If `find` prints "Permission denied" for a folder, that folder currently lacks execute for you: fix it with `chmod u+x folder` (or run the command with `sudo`) and repeat.

One GNU quirk: a numeric mode of up to four digits does not clear a directory's setuid or setgid bit, so `chmod 755 dir` on a `2775` directory leaves `2755`. Use `chmod g-s dir` or a five-digit mode such as `chmod 00755 dir` to clear it.

## umask: where default permissions come from

The umask lists the bits a *new* item does not get. Files start from 666, because programs are never created executable, and directories start from 777. The umask bits are then cleared. This is a bit mask, not subtraction: a file under umask 033 becomes 644, not 633.

| umask | New files | New directories |
|---|---|---|
| 022 (default on most distributions) | 644 | 755 |
| 002 (common with per-user groups) | 664 | 775 |
| 027 | 640 | 750 |
| 077 | 600 | 700 |

Set it for the current shell with `umask 027`, or in your shell profile to make it stick.

## Practical fixes by role

**System administrator: "Permission denied" on a script.** `ls -l deploy.sh` shows `-rw-r--r--`, so nobody may execute it, and `chmod u+x deploy.sh` fixes that. If it still fails, run `namei -l /full/path/to/deploy.sh` to find a parent directory without execute, and check whether the filesystem is mounted `noexec`.

**WordPress site owner.** Use 755 for directories and 644 for files, with `wp-config.php` tighter at 640 or 600 (some hosts prefer 440 or 400). "Unable to create directory wp-content/uploads" is nearly always an ownership mismatch: PHP runs as a user that does not own the folder. Check with `ls -ld wp-content/uploads`, then fix the owner with `chown` instead of using 777.

**Laravel developer.** `storage` and `bootstrap/cache` must be writable by the web server user. Give that group ownership, then 775 for directories and 664 for files, with setgid so new files stay group-writable:

```
sudo chgrp -R www-data storage bootstrap/cache
sudo chmod -R ug+rwX storage bootstrap/cache
sudo find storage bootstrap/cache -type d -exec chmod g+s {} +
```

`www-data` is the web server group on Debian and Ubuntu; other distributions use `apache` or `nginx`.

**Anyone using SSH.** Use 700 for `~/.ssh`, 600 for private keys and `authorized_keys`, and 644 for public keys. The client prints "WARNING: UNPROTECTED PRIVATE KEY FILE!" and refuses a key that group or others can read. On the server, `sshd` ignores `authorized_keys` if your home directory, `.ssh` or the file is writable by others, giving "Permission denied (publickey)". Protect the key with a passphrase from the [password generator](/tools/password-generator).

## Tips and common mistakes

- **chmod does not change ownership.** "Operation not permitted" means you do not own the item: use `chown` or `sudo`.
- **Never run `chmod -R 777` on `/` or a system directory.** It breaks `sudo`, `ssh` and package managers, with no undo.
- **Setuid is ignored on scripts.** Linux honors it only on compiled binaries.
- **Git tracks one bit.** It records only whether the owner execute bit is set (modes 100644 and 100755); restore it with `git update-index --chmod=+x script.sh`.
- **ACLs can override the mode.** A `+` after the permission string in `ls -l` means one exists; inspect it with `getfacl`.
- **Verify the result.** `ls -ld path` works everywhere, and on Linux `stat -c '%a %A %U:%G %n' path` shows octal, symbolic, owner and group together.
- **Quote spaces in file names.** The calculator does it for you, but a hyphenated name from the [slug generator](/tools/slug-generator) avoids the problem.

## Privacy and limitations

Everything runs in your browser. The path, modes and expressions you enter are not uploaded, and they stay in this tab's session storage until you close it. WordPress and Laravel are named only to describe common setups; this site is not affiliated with either project.

The symbolic-mode engine follows GNU coreutils chmod, used on most Linux systems. macOS and BSD agree on numeric and everyday symbolic modes, but corner cases can differ. The calculator cannot see ownership, ACLs, SELinux or AppArmor policy, or mount options such as `noexec`, all of which can block access a mode allows. Filesystems without Unix permissions, such as FAT and exFAT, ignore `chmod`. Test on a copy before a recursive change in production.
