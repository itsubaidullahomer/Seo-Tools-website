import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "dead-pixel-test",
  name: "Dead Pixel Test (Screen Test)",
  title: "Dead Pixel Test – Full-Screen Color & Screen Checker",
  description:
    "Free dead pixel test: cycle full-screen black, white, red, green and blue, locate faults on a grid, check backlight bleed and compare counts to ISO classes.",
  shortDescription: "Full-screen colors, a locator grid, gradient and backlight checks, a defect class calculator and an opt-in stuck pixel fixer.",
  category: "utilities",
  keywords: [
    "dead pixel test",
    "dead pixel checker",
    "stuck pixel test",
    "screen test",
    "monitor test",
    "backlight bleed test",
    "white screen test",
    "black screen test",
    "stuck pixel fixer",
  ],
  aliases: ["pixel test", "lcd screen test", "phone screen test", "monitor dead pixel check", "full screen color test", "red screen test", "green screen test"],
  icon: "monitor",
  featured: false,
  highInteraction: true,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["keyboard-tester", "mouse-test", "click-speed-test", "color-contrast-checker"],
  faq: [
    {
      question: "How do I check for dead pixels on my screen?",
      answer:
        "Clean the screen, raise the brightness and press Start screen test so the page goes full size. Step through black, white, red, green and blue, and look at each one from close range. A black dot on white is a dead pixel, a bright dot on black is a hot pixel, and a colored dot is a stuck subpixel. Press G to overlay the locator grid so you can note where each dot sits.",
    },
    {
      question: "What is the difference between a dead pixel, a stuck pixel and a hot pixel?",
      answer:
        "Every pixel has red, green and blue subpixels. A dead pixel has all of them off, so it shows as a black dot, clearest on white. A hot pixel has all of them stuck on, so it is a white dot, clearest on black. A stuck pixel has one or two subpixels frozen on or off, so it shows as a red, green, blue, cyan, magenta or yellow dot. Stuck and hot pixels sometimes recover; dead ones rarely do.",
    },
    {
      question: "Can a stuck pixel be fixed?",
      answer:
        "Sometimes. A stuck or hot pixel may respond to flashing colors over the spot, so the stuck pixel fixer cycles colors in a small square that you drag over it for up to 60 seconds. Run it a few times and recheck with the color screens. A dead pixel is a hardware fault and almost never recovers, and no method is guaranteed. If the screen is under warranty, document the fault before you try anything.",
    },
    {
      question: "How many dead pixels are acceptable under warranty?",
      answer:
        "It depends on the maker. ISO 9241-307 groups panels into Classes I to IV, and manufacturers commonly quote Class II, which allows about 2 always-lit, 2 always-dark and 5 stuck-subpixel defects per million pixels. On a Full HD screen that scales to roughly 4, 4 and 10. Some makers promise zero and others set their own limits, so read the pixel policy before you claim. The calculator on this page compares your count.",
    },
    {
      question: "What is backlight bleed, and how is it different from IPS glow?",
      answer:
        "Both are light showing on a black LCD screen. Backlight bleed is light leaking past the edges or corners, and it stays in the same place however you view the screen. IPS glow is a soft haze that shifts or fades as you move your head. Show the black screen in a dim room and move slowly to tell them apart. OLED panels have no backlight, so neither applies to them.",
    },
    {
      question: "Is the flashing stuck pixel test safe?",
      answer:
        "Flashing lights can trigger seizures in people with photosensitive epilepsy, so the fixer stays off until you confirm a warning. It changes color at most three times per second, uses a small square by default, stops after 60 seconds, and ends at once with Esc, a tap or the Stop button. It slows to one change per second if your system asks for reduced motion. Skip it if anyone nearby may be sensitive to flashing.",
    },
    {
      question: "Does the dead pixel test work on a phone or iPhone?",
      answer:
        "Yes. Tap for the next color, tap the left edge to go back, swipe left or right, and press and hold to exit. Android browsers can usually go fullscreen. iPhone Safari does not offer fullscreen for a web page like this, so the test fills the visible page instead and the browser bars may stay on screen. Hiding the toolbar in Safari's aA menu helps on recent versions.",
    },
    {
      question: "Does the test store anything or damage my screen?",
      answer:
        "It only paints flat colors, which is ordinary use for a display and should not harm a working screen. Do not leave a bright static color on an OLED panel for long stretches. Nothing is uploaded. Your options stay in this browser's local storage, and the defect counts you enter stay in session storage until the tab closes. The page asks the browser to keep the screen awake while a test is open, where supported.",
    },
  ],
};
