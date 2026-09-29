import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "chmod-calculator",
  name: "Chmod Calculator (Linux File Permissions)",
  title: "Chmod Calculator – Linux File Permissions, Octal & Symbolic",
  description:
    "Free chmod calculator: tick read, write and execute for owner, group and others to get the octal and symbolic mode, plus copy-ready chmod and find commands.",
  shortDescription: "Tick owner, group and others permissions to get the octal mode, symbolic mode and copy-ready chmod commands, including recursive find.",
  category: "developer",
  keywords: [
    "chmod calculator",
    "linux permissions calculator",
    "octal permissions calculator",
    "file permissions calculator",
    "chmod 755",
    "chmod 777",
    "chmod 644",
    "chmod +x",
    "chmod recursive",
    "umask calculator",
  ],
  aliases: ["chmod permissions calculator", "unix permissions calculator", "chmod generator", "rwx calculator", "chmod command generator"],
  icon: "terminal",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["uuid-generator", "password-generator", "json-formatter", "slug-generator"],
  faq: [
    {
      question: "How do I calculate chmod numbers?",
      answer:
        "Read is worth 4, write is worth 2 and execute is worth 1. Add up the ones you want for the owner, then the group, then everyone else, to get three digits. Read plus write plus execute is 4 + 2 + 1 = 7, read plus execute is 5, and read alone is 4, so rwxr-xr-x is 755 and rw-r--r-- is 644. A fourth leading digit adds setuid (4), setgid (2) or the sticky bit (1).",
    },
    {
      question: "What does chmod 755 mean?",
      answer:
        "The owner gets 7 (read, write, execute), and the group and everyone else get 5 (read and execute), written rwxr-xr-x. Everyone can read the item and run or enter it, but only the owner can change it. It is the normal mode for directories, shell scripts and programs that other users must run. Ordinary files such as HTML or images do not need execute, so they usually get 644.",
    },
    {
      question: "What is the difference between chmod 644 and 755?",
      answer:
        "They differ only in the execute bit. 644 (rw-r--r--) is for ordinary files that are read but not run. 755 (rwxr-xr-x) adds execute for everyone, which directories need so people can enter them and which scripts and programs need so they can run. Web roots typically use 755 for directories and 644 for files. Giving a directory 644 locks everyone out of it, including its owner.",
    },
    {
      question: "Why is chmod 777 dangerous, and what should I use instead?",
      answer:
        "777 lets every user on the machine, and every process running as any user, read, change and execute the item. On a web server, a single vulnerable script can then overwrite your code. It usually seems to fix an error only because the owner or group was wrong. Correct that with chown or chgrp, then use 755 and 644, or 775 and 664 with a shared group. Shared temporary folders are the exception, and they use 1777 with the sticky bit.",
    },
    {
      question: "How do I make a file executable with chmod +x?",
      answer:
        "Run chmod +x script.sh. With no u, g, o or a letters, GNU chmod leaves the bits in your umask alone. With the common umask of 022 that adds execute for the owner, group and others, so 644 becomes 755. With umask 077 it adds execute for the owner only, giving 744. To be explicit, use chmod u+x for just yourself or chmod a+x for everyone. Scripts also need read permission and a valid shebang line.",
    },
    {
      question: "How do I change permissions recursively without making every file executable?",
      answer:
        "chmod -R 755 gives every file execute permission, and chmod -R 644 makes directories unusable. Set them separately: find . -type d -exec chmod 755 {} + for directories and find . -type f -exec chmod 644 {} + for files. Or use one command, chmod -R u=rwX,g=rX,o=rX ., where capital X adds execute only to directories and to files that already have an execute bit. The calculator builds all of these for you.",
    },
    {
      question: "What are the right permissions for WordPress, Laravel and SSH keys?",
      answer:
        "WordPress uses 755 for directories and 644 for files, with wp-config.php tighter at 640 or 600 (some hosts prefer 440 or 400). Laravel needs storage and bootstrap/cache writable by the web server user, typically 775 and 664 with the right group. SSH wants ~/.ssh at 700, private keys at 600 and authorized_keys at 600, and OpenSSH rejects keys that others can read. None of these should be 777, and ownership matters as much as the mode.",
    },
    {
      question: "What are setuid, setgid and the sticky bit?",
      answer:
        "They are three special bits in the optional leading octal digit. Setuid (4000) makes a program run as its owner, and setgid (2000) makes it run as its group. On a directory, setgid makes new files inherit the directory's group. The sticky bit (1000) on a directory lets only a file's owner, the directory's owner or root delete or rename entries, which is why /tmp is 1777. In ls output they appear as s and t, or S and T when the execute bit is missing.",
    },
  ],
};
