import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "data-transfer-calculator",
  name: "Data Transfer Calculator",
  title: "Data Transfer Calculator – File Transfer & Download Time",
  description:
    "Free data transfer calculator: find how long a download or upload takes, the speed a deadline needs, or how much data a link moves, with MB vs MiB made clear.",
  shortDescription: "Work out transfer time, the speed you need or the data a link moves, with GB vs GiB and Mbps vs MB/s spelled out.",
  category: "converters",
  keywords: [
    "data transfer calculator",
    "file transfer time calculator",
    "download time calculator",
    "upload time calculator",
    "how long to transfer",
    "transfer speed calculator",
    "data transfer time",
    "mbps to mb/s",
    "bandwidth calculator",
  ],
  aliases: ["download time", "upload time", "file transfer time", "transfer rate calculator", "how long to download", "how long to upload", "mbps to MB/s"],
  icon: "hard-drive-download",
  featured: false,
  datePublished: "2026-10-01",
  dateModified: "2026-10-01",
  related: ["percentage-calculator", "military-time-converter", "px-to-rem"],
  faq: [
    {
      question: "How long does it take to transfer 1 GB at 100 Mbps?",
      answer:
        "80 seconds (1 min 20 s) at the full nominal rate. 1 GB is 1,000,000,000 bytes, or 8,000,000,000 bits, and 100 Mbps moves 100,000,000 bits a second, so 8,000,000,000 ÷ 100,000,000 = 80. A 1 GiB file (1,073,741,824 bytes) takes about 85.9 seconds. Real transfers take longer: at the 94.93% TCP/IPv4 ceiling the 1 GB file needs about 84.3 seconds, and congestion, Wi-Fi or a slow disk add more.",
    },
    {
      question: "What is the difference between Mbps and MB/s?",
      answer:
        "Mbps is megabits per second and MB/s is megabytes per second. A byte is 8 bits, so divide Mbps by 8 to get MB/s: 100 Mbps is 12.5 MB/s and 1 Gbps is 125 MB/s. Network links and internet plans are rated in bits per second, while file sizes are counted in bytes, so a 100 Mbps connection downloads at 12.5 MB/s at best. Some apps show MiB/s instead, and 100 Mbps is 11.92 MiB/s.",
    },
    {
      question: "Why does my 1 TB drive show about 931 GB?",
      answer:
        "Drive makers count 1 TB as 1,000,000,000,000 bytes. Software that divides by 1,024 instead reports 1,000,000,000,000 ÷ 1,073,741,824 = 931.32 of its units, correctly called GiB but often labelled GB. Nothing is missing: it is the same number of bytes counted in a larger unit, and formatting and system files then take some space on top. Here, pick TB for the size printed on the box and GiB or TiB for what binary software shows.",
    },
    {
      question: "What upload speed do I need to send 50 GB in one hour?",
      answer:
        "At least 111.1 Mbps at the full nominal rate. 50 GB is 400,000,000,000 bits and an hour is 3,600 seconds, so 400,000,000,000 ÷ 3,600 = 111,111,111 bits per second. If only 94.93% of the link carries your data, the link has to run at 117.05 Mbps. A 100 Mbps upload would need 1 h 6 min 40 s even at full rate, so it misses the deadline. The Speed needed tab does this for any size and deadline.",
    },
    {
      question: "How much data can a 100 Mbps connection transfer in an hour or a day?",
      answer:
        "At the full nominal rate, 100 Mbps moves 45 GB an hour: 100,000,000 bits per second × 3,600 seconds = 360,000,000,000 bits, and dividing by 8 gives 45,000,000,000 bytes, or 41.91 GiB. Over 24 hours that is 1.08 TB (1,005.83 GiB). These are ceilings for a link running flat out the whole time. Use the Data amount tab with your own speed, time and efficiency.",
    },
    {
      question: "Why is my real transfer slower than the calculator says?",
      answer:
        "The calculator starts from the link's nominal rate, and part of every link carries headers and gaps instead of your data. For TCP over IPv4 on Ethernet with full 1500-byte packets, 1,460 of every 1,538 bytes on the wire are payload, a 94.93% ceiling. Congestion, packet loss, Wi-Fi conditions, the other end's limits, slow disks and many small files can cut the speed further. Lower the efficiency, or enter a speed you have measured.",
    },
    {
      question: "Does the calculator use 1000 or 1024?",
      answer:
        "Both, and every unit says which. kB, MB, GB, TB and PB are 1000-based, following the SI prefixes; KiB, MiB, GiB, TiB and PiB are the 1024-based binary units defined by the IEC. Speeds in bits (kbps, Mbps, Gbps) are 1000-based, so 1 Mbps is 1,000,000 bits per second. Byte speeds come in both families, such as MB/s and MiB/s. The hint under each field shows the exact number of bytes or bits.",
    },
    {
      question: "How long does it take to download 100 GB?",
      answer:
        "It depends on the speed. At the full nominal rate, 100 GB takes 8 h 53 min 20 s at 25 Mbps, 2 h 13 min 20 s at 100 Mbps and 13 min 20 s at 1 Gbps. The working is 100 GB × 8 = 800,000,000,000 bits, divided by the link's bits per second. Real downloads take longer, so enter your own speed and lower the efficiency if you want a safety margin.",
    },
  ],
};
