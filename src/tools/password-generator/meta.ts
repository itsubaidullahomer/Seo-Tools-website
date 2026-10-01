import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "password-generator",
  name: "Strong Password Generator",
  title: "Password Generator – Strong Random Passwords & Passphrases",
  description:
    "Free password generator for strong random passwords and memorable passphrases, made with your browser's secure RNG. Shows real entropy and time to guess.",
  shortDescription: "Create strong random passwords or memorable passphrases, with a strength meter based on real entropy. Nothing is sent or saved.",
  category: "utilities",
  keywords: [
    "password generator",
    "random password generator",
    "strong password generator",
    "secure password generator",
    "passphrase generator",
    "password creator",
    "generate password",
    "memorable password generator",
    "random password 16 characters",
    "password generator with symbols",
  ],
  aliases: ["password maker", "pw generator", "diceware generator", "random passphrase"],
  icon: "key-round",
  featured: true,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["character-counter", "case-converter", "word-counter"],
  faq: [
    {
      question: "Is it safe to use an online password generator?",
      answer:
        "It is safe when the password is created on your device and never transmitted. This generator runs entirely in your browser using crypto.getRandomValues, the same cryptographically secure random source browsers use for encryption keys. Nothing is sent to a server or written to storage; only your settings are remembered. You can check this by loading the page, switching off your internet connection and generating as many passwords as you like.",
    },
    {
      question: "How long should a strong password be?",
      answer:
        "For a random password stored in a password manager, 16 characters using letters, numbers and symbols gives about 104 bits of entropy, which is far beyond any practical guessing attack. Use 20 or more for very important accounts. NIST's current guidance asks for at least 15 characters when a password is the only login factor, and at least 8 when it is combined with a second factor such as an authenticator app.",
    },
    {
      question: "Is a passphrase better than a random password?",
      answer:
        "A passphrase is better when you must remember or type the secret, such as a computer login or your password manager's master password. Six random words from this tool's 1,500-word list give 63 bits, and seven give about 74 bits, while staying easy to type. For everything a password manager fills in for you, a random character password is shorter for the same strength.",
    },
    {
      question: "What does entropy in bits mean?",
      answer:
        "Entropy measures how many equally likely passwords the generator could have produced. Each extra bit doubles that number. It is calculated as length × log2(character set size) for random passwords, or words × log2(word list size) for passphrases. A 16-character password from 90 characters has about 2^104 possibilities. Entropy describes the generation method, so it only applies to passwords a machine picked at random, not ones a person invented.",
    },
    {
      question: "How is the time-to-guess estimate calculated?",
      answer:
        "The tool divides half the number of possible passwords (the average an attacker must try) by 10 billion guesses per second. That is a middle-of-the-road rate for an offline attack on a stolen database: one high-end graphics card tests about 22 billion SHA-256 or 164 billion MD5 guesses per second, but only around 184,000 bcrypt guesses. Treat it as security education, not a guarantee. Even at 100 times the speed, the default 16-character password needs about 250 billion years.",
    },
    {
      question: "Why does a website reject my generated password?",
      answer:
        "Some sites still limit length (often 16, 20 or 32 characters) or refuse certain symbols such as < > or quotation marks. Shorten the length to the site's maximum and type the refused characters into the “Never use these characters” box; the generator will avoid them while still including every selected character type. If a site caps passwords at a very short length, protect the account with two-factor authentication as well.",
    },
    {
      question: "Should I change my passwords regularly?",
      answer:
        "No, not on a schedule. NIST SP 800-63B tells organizations not to force periodic password changes, because people respond with predictable tweaks such as Summer2025! becoming Fall2025!. Change a password when there is evidence it was exposed: a breach notification, a phishing incident, or reuse on a site that leaked. A unique random password per site, plus two-factor authentication, matters far more than rotation.",
    },
    {
      question: "How do I remember strong random passwords?",
      answer:
        "You don't need to. Store them in a password manager (Bitwarden, 1Password, KeePassXC, Apple Passwords or your browser's built-in manager) and memorize only one strong passphrase that unlocks it, plus your device login. For those one or two secrets, use the Passphrase mode with six or seven words and practice typing them for a few days until they stick.",
    },
  ],
};
