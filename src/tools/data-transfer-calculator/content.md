## What this data transfer calculator does

This data transfer calculator answers three versions of the same question. How long will this file take to download, upload or copy? How fast does the link need to be to finish by a deadline? How much data can a link move in a given time? Pick the matching tab, type the numbers you know, and the result updates as you type, with the arithmetic written out using your own figures.

Most mistakes with transfer times come from units rather than arithmetic. A gigabyte can mean 1,000,000,000 bytes (GB) or 1,073,741,824 bytes (GiB), and a speed can be in bits (Mbps) or bytes (MB/s), a factor of 8 apart. Every unit menu here says which family it belongs to, and the line under each field shows the exact number of bytes or bits being used, so you can check that the calculator is reading your input the way you meant it.

## How to use it

1. **Choose a tab.** *Transfer time* takes a size and a speed. *Speed needed* takes a size and a deadline. *Data amount* takes a speed and a length of time. The tabs share their fields, so switching keeps your numbers.
2. **Enter the size** and pick its unit. B stands alone, kB to PB are 1000-based and KiB to PiB are 1024-based. The hint below shows the exact byte count and the same size in the other family, such as `1 GB = 1,000,000,000 bytes = 0.9313 GiB`.
3. **Enter the speed** and pick its unit. Bits per second (bps, kbps, Mbps, Gbps) are listed apart from bytes per second (B/s, kB/s, MB/s, GB/s) and binary bytes per second (KiB/s, MiB/s, GiB/s).
4. **Enter a time** for the other two tabs, in seconds, minutes, hours or days.
5. **Optionally set the efficiency.** 100% means the link's full nominal rate. Lower it to allow for overhead; the 94.93% button applies the ceiling derived below.
6. **Read and copy the result.** *Copy result* copies the answer; *Copy result with working* adds your inputs and every step of the calculation. Below the result you get the same answer in other units and a table of common link speeds, which you can copy as CSV.

Numbers use a dot for decimals. Commas and spaces are accepted only as thousands separators, so `1,500` and `1 500` both mean fifteen hundred, and scientific notation such as `1e9` works too. A decimal comma such as `1,5` is flagged with a message rather than guessed at, because `1,500` would otherwise be ambiguous. Zero, negative and non-numeric values get a specific message, as do values outside the supported range: sizes from 1 bit to 1 EB, speeds from 1 bit per second to 1,000,000 Gbps, and times from 1 millisecond to 100 years.

## The formula, with worked examples

Everything is converted to bits and seconds first:

```
bits             = size in bytes × 8
throughput       = link speed in bit/s × efficiency
time             = bits ÷ throughput
speed needed     = bits ÷ seconds ÷ efficiency
data in bytes    = link speed in bit/s × efficiency × seconds ÷ 8
```

**1 GB at 100 Mbps.** 1 GB is 1,000,000,000 bytes, which is 8,000,000,000 bits. 100 Mbps is 100,000,000 bits per second. 8,000,000,000 ÷ 100,000,000 = **80 seconds**, or 1 min 20 s.

**1 GiB at 100 Mbps.** 1 GiB is 1,073,741,824 bytes, or 8,589,934,592 bits. Divided by 100,000,000 that is 85.899 seconds, about **85.9 seconds** (1 min 26 s). The file is 7.37% larger than 1 GB, so it takes 7.37% longer.

**50 GB in one hour (speed needed).** 50 GB is 400,000,000,000 bits and an hour is 3,600 seconds. 400,000,000,000 ÷ 3,600 = 111,111,111.111 bits per second, about **111.1 Mbps**. With the efficiency set to 94.93%, the link has to run at 117.045 Mbps.

**100 Mbps for one hour (data amount).** 100,000,000 bits per second × 3,600 seconds = 360,000,000,000 bits. Divided by 8 that is 45,000,000,000 bytes: **45 GB**, or 41.91 GiB.

## Decimal and binary units: why a 1 TB drive shows 931 GiB

The SI prefixes kilo, mega, giga and tera mean 1000, 1000², 1000³ and 1000⁴. Computer memory is built in powers of two, so for decades "kilobyte" was also used for 1,024 bytes. To end the ambiguity, the IEC introduced binary prefixes in 1998: kibi (Ki) for 1,024, mebi (Mi) for 1,024², gibi (Gi) for 1,024³ and so on ([NIST, Prefixes for binary multiples](https://physics.nist.gov/cuu/Units/binary.html)).

Storage makers state capacity in decimal units, so a 1 TB drive holds 1,000,000,000,000 bytes. Apple's note on [how storage capacity is measured](https://support.apple.com/en-us/102119) describes both methods and says some operating systems and apps report capacity in binary units. Divide the same bytes by 1,073,741,824 and you get 931.323, which binary software shows as 931 GiB, often labelled GB. In tebibytes the drive is 0.9095 TiB. No space is missing; it is the same number of bytes in a larger unit.

The gap grows with each prefix:

| 1000-based | 1024-based | Binary unit is larger by |
|---|---|---|
| kB = 1,000 bytes | KiB = 1,024 bytes | 2.4% |
| MB = 1,000² bytes | MiB = 1,048,576 bytes | 4.86% |
| GB = 1,000³ bytes | GiB = 1,073,741,824 bytes | 7.37% |
| TB = 1,000⁴ bytes | TiB = 1,099,511,627,776 bytes | 9.95% |
| PB = 1,000⁵ bytes | PiB = 1,125,899,906,842,624 bytes | 12.59% |

When a file manager shows a size, check which convention it uses before typing it in, then pick the matching unit here.

## Bits and bytes: Mbps versus MB/s

A byte is 8 bits. Link and internet speeds are quoted in bits per second, with decimal prefixes, so 1 Mbps is 1,000,000 bits per second. File sizes are counted in bytes. To go from Mbps to MB/s, divide by 8:

- 100 Mbps = 12.5 MB/s = 11.921 MiB/s
- 480 Mbps = 60 MB/s
- 1 Gbps = 125 MB/s = 119.209 MiB/s

The reverse also matters. A download window showing 50 MB/s is moving 400 Mbps. The case of the letter carries the meaning: lowercase b is bits, uppercase B is bytes. When the unit is written out, as in Mbit/s, there is less room for confusion.

## Why real transfers are slower than the result

The result assumes that every bit of the nominal rate carries your data, from the first second to the last. That is the theoretical ceiling, not a forecast. Some of the gap can be calculated exactly. Take TCP over IPv4 on Ethernet with the standard 1,500-byte maximum packet size ([RFC 894](https://www.rfc-editor.org/rfc/rfc894)):

```
TCP payload per packet  = 1,500 − 20 (IPv4 header) − 20 (TCP header)          = 1,460 bytes
bytes on the wire       = 1,500 + 14 (Ethernet header) + 4 (frame check)
                          + 8 (preamble and start delimiter) + 12 (minimum gap) = 1,538 bytes
best-case efficiency    = 1,460 ÷ 1,538 = 94.93%
```

The header sizes are the minimums in [RFC 791](https://www.rfc-editor.org/rfc/rfc791) (IPv4) and [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293) (TCP), and the framing bytes come from IEEE 802.3. On Gigabit Ethernet this caps TCP payload at about 949.285 Mbps, or 118.661 MB/s. If TCP timestamps are on, each packet carries 12 more header bytes ([RFC 7323](https://www.rfc-editor.org/rfc/rfc7323)), which leaves 1,448 ÷ 1,538 = 94.15%. These figures assume full-size packets, no loss and nothing else on the link.

Signalling can take a share before any protocol does. USB 3.2 Gen 1 has a 5 Gbps signalling rate ([USB-IF naming guidelines](https://www.usb.org/sites/default/files/usb_3_2_language_product_and_packaging_guidelines_final.pdf)) and uses 8b/10b encoding, which sends 10 bits on the wire for every 8 bits of data, so at most 5 × 8 ÷ 10 = 4 Gbps is data, before USB protocol overhead.

Other slowdowns depend on conditions and cannot be read off a formula:

- **Congestion and packet loss.** TCP slows down when it detects loss, and other traffic shares the same link.
- **Wi-Fi.** The rate a device reports depends on signal strength and interference, and the medium is shared.
- **The other end.** A server, cloud service or remote office link may be slower than your connection.
- **Storage.** A slow disk or USB stick can be the narrowest point.
- **Many small files.** Each file adds its own setup, so a folder of thousands of small files copies more slowly than one large file of the same total size.
- **Encryption and tunnels.** VPNs add headers and processing.

To plan with a margin, lower the efficiency. To predict a specific connection, measure the speed you actually get, enter that and keep 100%.

## Transfer times for 50 GB at common link speeds

The table on the page uses your own size and efficiency. These rows are for 50 GB at the full nominal rate. Technology names mark nominal rates, for USB the signalling rate; real throughput is lower.

| Link speed | Example of this nominal rate | Time for 50 GB |
|---|---|---|
| 10 Mbps | | 11 h 6 min 40 s |
| 25 Mbps | | 4 h 26 min 40 s |
| 50 Mbps | | 2 h 13 min 20 s |
| 100 Mbps | Fast Ethernet | 1 h 6 min 40 s |
| 300 Mbps | | 22 min 13 s |
| 480 Mbps | USB 2.0 High-Speed | 13 min 53 s |
| 500 Mbps | | 13 min 20 s |
| 1 Gbps | Gigabit Ethernet | 6 min 40 s |
| 5 Gbps | USB 3.2 Gen 1 | 1 min 20 s |
| 10 Gbps | 10 Gigabit Ethernet | 40 s |

In the *Speed needed* tab the same table marks which speeds meet your deadline: for 50 GB in one hour, 100 Mbps falls short and 300 Mbps is comfortably inside.

## Practical examples

- **Uploading a video archive.** 250 GB over a 20 Mbps upload takes 100,000 seconds, or 1 d 3 h 46 min 40 s, at best. To finish in an 8-hour night, the *Speed needed* tab shows 69.444 Mbps.
- **An overnight backup.** Moving 2 TB in 8 hours needs 555.556 Mbps, or 585.227 Mbps at 94.93% efficiency. On Gigabit Ethernet the same 2 TB takes 4 h 26 min 40 s at full rate and 4 h 40 min 55 s at 94.93%.
- **Sizing a link for a day of data.** 1 Gbps for 8 hours moves 3.6 TB (3.274 TiB); 100 Mbps for 24 hours moves 1.08 TB.
- **Copying to a USB 2.0 stick.** 16 GB at the 480 Mbps signalling rate is 4 min 27 s in theory. The stick's own write speed can be far lower, so time a real copy and enter that speed.
- **A single photo.** A 2 MB photo at 10 Mbps is 1.6 s of data. For short transfers like this, connection setup and latency can add as much again, and the calculator does not include them.

## Tips and common mistakes

- **Mixing bits and bytes.** Dividing a size in MB by a speed in Mbps gives an answer 8 times too small. Let the units menus do the conversion.
- **Using the wrong gigabyte.** If a file manager counts in 1,024s, choose GiB, not GB, or the estimate is 7.37% short.
- **Upload is not download.** Many connections upload much more slowly than they download. Use the speed for the direction you are sending.
- **Planning to the second.** Results from 1 minute up are rounded to whole seconds for reading; the exact seconds are shown alongside.

## Privacy and limitations

The calculator runs entirely in your browser. Nothing you type is uploaded, and your entries are kept only in this tab's session storage, which clears when you close the tab.

It models a constant rate. It does not include latency, connection setup, compression, deduplication, protocol retransmissions or changes in speed during a transfer, so treat every result as the best case for the efficiency you set. The comparison table's technology names are nominal rates for orientation only, not measured or promised speeds.
