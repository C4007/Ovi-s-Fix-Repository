/* ==========================================================================
   Ovi's Fix — catalog schema
   One place that says: which categories exist, which sub-categories sit in
   each, and which filters belong to which sub-category (SSD has "Form Factor:
   SATA / NVMe / M.2", HDD has "2.5-inch / 3.5-inch", and so on).

   Plain ES module with NO browser code, so the same file is used by the
   shop pages, the PC builder, the admin panel, the server-side validators
   (lib/validate-shop.js) and the page generator (scripts/build-pages.mjs).

   Filters that every product has (Brand, Price, Availability) are built into
   the shop UI and are not listed here. Everything below is category-specific.
   ========================================================================== */

const L = (en, bn) => ({ en, bn });

/** Availability states. `order` is used when sorting "in stock first". */
export const STOCK = {
  in: { en: "In stock", bn: "স্টকে আছে", order: 0 },
  pre: { en: "Pre-order", bn: "প্রি-অর্ডার", order: 1 },
  soon: { en: "Up coming", bn: "শীঘ্রই আসছে", order: 2 },
  out: { en: "Out of stock", bn: "স্টক নেই", order: 3 },
};

/* ---- filter factory ------------------------------------------------------
   f(key, englishLabel, banglaLabel, options)
   options:
     type    "text" (default) | "multi" (value is a list) | "bucket" (number → range)
     unit    appended to numeric values, e.g. "GB" → "16 GB"
     opts    suggested / allowed values (shown as a dropdown in the admin form)
     strict  true → admin must pick one of `opts` (used where the PC builder's
             compatibility checks depend on the exact value)
     buckets [[min, max, label], ...]  for type "bucket" (min inclusive, max exclusive)
     card    true → show this spec on the product card
   ------------------------------------------------------------------------ */
const f = (key, en, bn, o = {}) => ({ key, label: L(en, bn), ...o });

const SOCKETS = ["AM4", "AM5", "LGA1700", "LGA1851", "LGA1200"];
const BOARD_SIZES = ["ATX", "Micro-ATX", "Mini-ITX", "E-ATX"];
const COLORS = ["Black", "White", "Silver", "Gray", "Red", "Blue", "Pink"];

const speedRead = [[0, 1000, "Up to 1,000 MB/s"], [1000, 3500, "1,000 – 3,499 MB/s"], [3500, 6000, "3,500 – 5,999 MB/s"], [6000, 1e9, "6,000 MB/s and above"]];
const speedWrite = [[0, 1000, "Up to 1,000 MB/s"], [1000, 3000, "1,000 – 2,999 MB/s"], [3000, 5500, "3,000 – 5,499 MB/s"], [5500, 1e9, "5,500 MB/s and above"]];
const fanRpm = [[0, 1000, "Up to 1,000 RPM"], [1000, 1500, "1,000 – 1,499 RPM"], [1500, 2000, "1,500 – 1,999 RPM"], [2000, 1e9, "2,000 RPM and above"]];

const color = f("color", "Color", "রং", { opts: COLORS });

const MONITOR_FILTERS = [
  f("screenSize", "Screen Size", "স্ক্রিন সাইজ", { unit: '"', card: true }),
  f("resolution", "Resolution", "", { opts: ["1920x1080 (FHD)", "2560x1440 (QHD)", "3840x2160 (4K)", "3440x1440 (UWQHD)"], card: true }),
  f("refreshRate", "Refresh Rate", "", { unit: "Hz", opts: ["60", "75", "100", "120", "144", "165", "170", "180", "240"], card: true }),
  f("displayType", "Display Type", "", { opts: ["IPS", "VA", "TN", "OLED"], card: true }),
  f("features", "Features", "ফিচার", { type: "multi", opts: ["Adaptive Sync", "HDR", "Built-in Speakers", "USB-C", "Curved", "Height Adjustable", "Eye Care"] }),
  f("connection", "Connection Type", "", { type: "multi", opts: ["HDMI", "DisplayPort", "VGA", "USB-C"] }),
  color,
];

const LAPTOP_FILTERS = [
  f("processorType", "Processor Type", "", { opts: ["Core i3", "Core i5", "Core i7", "Core Ultra 5", "Core Ultra 7", "Ryzen 5", "Ryzen 7"], card: true }),
  f("model", "Processor Model", ""),
  f("series", "Generation/Series", ""),
  f("ramSize", "RAM Size", "", { unit: "GB", opts: ["8", "16", "32"], card: true }),
  f("ramType", "RAM Type", "", { opts: ["DDR4", "DDR5", "LPDDR5"] }),
  f("storage", "Storage", "স্টোরেজ", { opts: ["256GB SSD", "512GB SSD", "1TB SSD"], card: true }),
  f("chipset", "Graphics Chipset", "", { opts: ["Integrated", "RTX 2050", "RTX 3050", "RTX 4050", "RTX 5050"] }),
  f("displaySize", "Display Size", "ডিসপ্লে সাইজ", { unit: '"', card: true }),
  f("resolution", "Resolution", "", { opts: ["1366x768 (HD)", "1920x1080 (FHD)", "1920x1200 (WUXGA)", "2560x1440 (QHD)"] }),
  f("refreshRate", "Refresh Rate", "", { unit: "Hz", opts: ["60", "120", "144", "165"] }),
  f("displayType", "Display Type", "", { opts: ["IPS", "TN", "OLED", "WVA"] }),
  f("features", "Features", "ফিচার", { type: "multi", opts: ["Backlit Keyboard", "Fingerprint Reader", "Touchscreen", "Thunderbolt", "Windows 11 Home", "Windows 11 Pro", "FreeDOS"] }),
  color,
];

/** Sub-categories. `builder` links a sub to PC Builder rows (see BUILDER_ROWS below). */
export const SUBS = {
  /* ---------------- PC components ---------------- */
  processor: {
    cat: "components", icon: "cpu", label: L("Processor", "প্রসেসর"), power: true, perf: true,
    filters: [
      f("socket", "Socket", "", { opts: SOCKETS, strict: true, card: true }),
      f("processorType", "Processor Type", "", { opts: ["Ryzen 3", "Ryzen 5", "Ryzen 7", "Ryzen 9", "Core i3", "Core i5", "Core i7", "Core i9", "Core Ultra 5", "Core Ultra 7", "Pentium"] }),
      f("series", "Generation/Series", "", { opts: ["Ryzen 5000", "Ryzen 7000", "Ryzen 8000", "Ryzen 9000", "10th Gen", "11th Gen", "12th Gen", "13th Gen", "14th Gen", "Core Ultra 200S"] }),
      f("model", "Processor Model", ""),
      f("cores", "Number of Cores", "", { card: true }),
      f("threads", "Number of Threads", ""),
      f("clock", "Clock Speed", "", { unit: "GHz", card: true }),
      f("cache", "Processor Cache Memory", "", { unit: "MB" }),
      f("features", "Processor Features", "প্রসেসরের ফিচার", { type: "multi", opts: ["Integrated Graphics", "Unlocked", "Cooler Included", "PCIe 5.0"] }),
      f("packaging", "Type", "", { opts: ["Box", "Tray"] }),
    ],
  },
  "cpu-cooler": {
    cat: "components", icon: "cooler", label: L("CPU Cooler", "CPU কুলার"), power: true,
    filters: [
      f("coolerType", "Cooler type", "কুলারের ধরন", { opts: ["Air", "Liquid (AIO)"], card: true }),
      f("coolerSize", "Cooler Size", "", { opts: ["92mm", "120mm", "240mm", "280mm", "360mm"], card: true }),
      f("fanSize", "Fan Size", "", { unit: "mm", opts: ["92", "120", "140"] }),
      f("fanSpeed", "Fan Speed", "", { type: "bucket", unit: "RPM", buckets: fanRpm }),
      f("socket", "Socket", "", { type: "multi", opts: SOCKETS, card: true }),
      f("connection", "Connection Type", "", { opts: ["3-Pin", "4-Pin PWM"] }),
      f("features", "Features", "ফিচার", { type: "multi", opts: ["ARGB", "LCD Display", "Copper Base", "Heat Pipes", "Dual Fan"] }),
      color,
    ],
  },
  motherboard: {
    cat: "components", icon: "mobo", label: L("Motherboard", "মাদারবোর্ড"), power: true,
    filters: [
      f("chipset", "Chipset", "", { opts: ["A620", "B650", "X670", "B450", "B550", "H610", "B660", "B760", "Z790", "Z890"], card: true }),
      f("socket", "Socket", "", { opts: SOCKETS, strict: true, card: true }),
      f("processorType", "Processor Type", "", { opts: ["AMD", "Intel"] }),
      f("series", "Generation/Series", ""),
      f("memType", "Memory Type", "", { opts: ["DDR4", "DDR5"], strict: true, card: true }),
      f("maxMem", "Maximum Memory", "", { unit: "GB", opts: ["64", "128", "192"] }),
      f("ramSlots", "Ram Slots", "", { opts: ["2", "4"], strict: true }),
      f("formFactor", "Form Factor", "", { opts: BOARD_SIZES, strict: true, card: true }),
      f("mbFeatures", "Motherboard Features", "", { type: "multi", opts: ["Wi-Fi", "Bluetooth", "M.2 NVMe", "PCIe 5.0", "PCIe 4.0", "ARGB Header", "HDMI", "DisplayPort"] }),
      color,
    ],
  },
  ram: {
    cat: "components", icon: "ram", label: L("RAM (Desktop)", "ডেস্কটপ RAM"), power: true,
    filters: [
      f("ramType", "RAM Type", "", { opts: ["DDR4", "DDR5"], strict: true, card: true }),
      f("ramSize", "RAM Size", "", { unit: "GB", opts: ["8", "16", "32", "64"], card: true }),
      f("ramSticks", "RAM Sticks", "", { opts: ["1", "2", "4"], strict: true }),
      f("ramSpeed", "RAM Speed", "", { unit: "MHz", opts: ["2666", "3200", "3600", "4800", "5200", "5600", "6000", "6400"], card: true }),
      f("ramFeatures", "RAM Features", "", { type: "multi", opts: ["RGB", "Heatsink", "XMP", "EXPO", "Low Profile"] }),
      f("type", "Type", "ধরন", { opts: ["Desktop", "Laptop"] }),
      color,
    ],
  },
  ssd: {
    cat: "components", icon: "ssd", label: L("SSD", "SSD"), power: true,
    filters: [
      f("ssdCapacity", "SSD Capacity", "", { opts: ["128GB", "256GB", "512GB", "1TB", "2TB", "4TB"], card: true }),
      f("formFactor", "Form Factor", "", { opts: ["2.5\" SATA", "M.2 SATA", "M.2 NVMe"], card: true }),
      f("ssdInterface", "SSD Interface", "", { opts: ["SATA III", "PCIe 3.0 x4", "PCIe 4.0 x4", "PCIe 5.0 x4"] }),
      f("ssdGen", "SSD Generation", "", { opts: ["SATA", "Gen3", "Gen4", "Gen5"] }),
      f("ssdSize", "SSD Size", "", { opts: ["2.5-inch", "M.2 2280", "M.2 2242", "M.2 2230"] }),
      f("readSpeed", "Read Speed", "", { type: "bucket", unit: "MB/s", buckets: speedRead, card: true }),
      f("writeSpeed", "Write Speed", "", { type: "bucket", unit: "MB/s", buckets: speedWrite }),
    ],
  },
  hdd: {
    cat: "components", icon: "hdd", label: L("HDD", "হার্ড ডিস্ক (HDD)"), power: true,
    filters: [
      f("hddCapacity", "HDD Capacity", "", { opts: ["500GB", "1TB", "2TB", "4TB", "6TB", "8TB"], card: true }),
      f("formFactor", "Form Factor", "", { opts: ["2.5-inch", "3.5-inch"], card: true }),
      f("hddType", "HDD Type", "", { opts: ["Desktop", "NAS", "Surveillance", "Enterprise", "Portable"] }),
      f("speed", "Speed", "", { unit: "RPM", opts: ["5400", "7200"], card: true }),
    ],
  },
  "graphics-card": {
    cat: "components", icon: "gpu", label: L("Graphics Card", "গ্রাফিক্স কার্ড"), power: true, perf: true,
    filters: [
      f("chipset", "Graphics Chipset", "", { card: true }),
      f("gpuSeries", "GPU Series", "", { opts: ["GeForce RTX", "GeForce GTX", "Radeon RX", "Intel Arc"] }),
      f("nvidiaSeries", "NVIDIA Series", "", { opts: ["RTX 50 Series", "RTX 40 Series", "RTX 30 Series", "GTX 16 Series"] }),
      f("radeonSeries", "Radeon Series", "", { opts: ["RX 9000 Series", "RX 7000 Series", "RX 6000 Series"] }),
      f("memSize", "Memory Size", "", { unit: "GB", opts: ["4", "6", "8", "12", "16", "24"], card: true }),
      f("memType", "Memory Type", "", { opts: ["GDDR6", "GDDR6X", "GDDR7"], card: true }),
      f("maxRes", "GPU Max Resolution", "", { opts: ["7680x4320", "5120x2880"] }),
      f("coolerType", "Cooler type", "কুলারের ধরন", { opts: ["Single Fan", "Dual Fan", "Triple Fan"] }),
      f("recPsu", "Power Supply", "পাওয়ার সাপ্লাই (রেকমেন্ডেড)", { unit: "W", opts: ["450", "550", "650", "750", "850", "1000"] }),
      f("features", "Features", "ফিচার", { type: "multi", opts: ["RGB", "Low Profile", "OC Edition", "White Edition"] }),
    ],
  },
  "power-supply": {
    cat: "components", icon: "psu", label: L("Power Supply", "পাওয়ার সাপ্লাই"),
    filters: [
      f("watts", "Watts", "", { unit: "W", opts: ["350", "450", "550", "650", "750", "850", "1000", "1200"], strict: true, card: true }),
      f("modular", "Modular", "", { opts: ["Non-modular", "Semi-modular", "Fully modular"], card: true }),
      f("efficiency", "Efficiency", "", { opts: ["80+ White", "80+ Bronze", "80+ Gold", "80+ Platinum", "80+ Titanium"], card: true }),
      f("formFactor", "Form Factor", "", { opts: ["ATX", "SFX"] }),
      f("features", "Features", "ফিচার", { type: "multi", opts: ["ATX 3.1", "12V-2x6 Connector", "Zero RPM Fan", "Japanese Capacitors"] }),
      color,
    ],
  },
  casing: {
    cat: "components", icon: "case", label: L("Casing", "কেসিং"),
    filters: [
      f("formFactor", "Form Factor", "", { opts: ["Mini Tower", "Mid Tower", "Full Tower", "Cube"], card: true }),
      f("boardSupport", "Motherboard Support", "", { type: "multi", opts: BOARD_SIZES, strict: true, card: true }),
      f("sidePanel", "Side-Panel", "সাইড-প্যানেল", { opts: ["Tempered Glass", "Acrylic", "Mesh", "Solid Steel"], card: true }),
      f("bodyMaterial", "Body Material", "বডি ম্যাটেরিয়াল", { opts: ["Steel", "Aluminum", "Steel & Plastic"] }),
      f("powerSupply", "Power Supply", "পাওয়ার সাপ্লাই", { opts: ["Included", "Not included"] }),
      f("features", "Features", "ফিচার", { type: "multi", opts: ["ARGB Fans", "Front USB-C", "Mesh Front", "Vertical GPU Mount"] }),
      color,
    ],
  },
  "casing-fan": {
    cat: "components", icon: "fan", label: L("Casing Cooler (Fan)", "কেসিং কুলার (ফ্যান)"), power: true,
    filters: [
      f("fanSize", "Fan Size", "", { unit: "mm", opts: ["80", "92", "120", "140"], card: true }),
      f("fanSpeed", "Fan Speed", "", { type: "bucket", unit: "RPM", buckets: fanRpm, card: true }),
      f("connection", "Connection Type", "", { opts: ["3-Pin", "4-Pin PWM", "3-Pin ARGB"], card: true }),
      f("features", "Features", "ফিচার", { type: "multi", opts: ["ARGB", "PWM", "Pack of 3", "Hydraulic Bearing"] }),
      color,
    ],
  },

  /* ---------------- Laptops ---------------- */
  "gaming-laptop": { cat: "laptops", icon: "laptop", label: L("Gaming Laptop", "গেমিং ল্যাপটপ"), filters: LAPTOP_FILTERS },
  "everyday-laptop": { cat: "laptops", icon: "laptop", label: L("Everyday Laptop (Student & Office)", "এভরিডে ল্যাপটপ (স্টুডেন্ট ও অফিস)"), filters: LAPTOP_FILTERS },
  "business-laptop": { cat: "laptops", icon: "laptop", label: L("Business Laptop", "বিজনেস ল্যাপটপ"), filters: LAPTOP_FILTERS },

  /* ---------------- Monitors ---------------- */
  "gaming-monitor": { cat: "monitors", icon: "monitor", label: L("Gaming Monitor", "গেমিং মনিটর"), filters: MONITOR_FILTERS },
  "office-monitor": { cat: "monitors", icon: "monitor", label: L("Office & Home Monitor", "অফিস ও হোম মনিটর"), filters: MONITOR_FILTERS },
  "pro-monitor": { cat: "monitors", icon: "monitor", label: L("Professional Monitor", "প্রফেশনাল মনিটর"), filters: MONITOR_FILTERS },

  /* ---------------- Accessories ---------------- */
  keyboard: {
    cat: "accessories", icon: "keyboard", label: L("Keyboard", "কিবোর্ড"),
    filters: [
      f("keyboardType", "Keyboard Type", "কিবোর্ডের ধরন", { opts: ["Mechanical", "Membrane", "Wireless Combo"], card: true }),
      f("switch", "Keyboard Switch", "", { opts: ["Red", "Blue", "Brown", "Black", "Optical", "Membrane"], card: true }),
      f("size", "Size", "সাইজ", { opts: ["Full Size", "TKL", "75%", "65%", "60%"], card: true }),
      f("connection", "Connection Type", "", { type: "multi", opts: ["Wired", "2.4G Wireless", "Bluetooth"], card: true }),
      f("cableLength", "Cable Length", "ক্যাবল দৈর্ঘ্য", { unit: "m", opts: ["1.2", "1.5", "1.8", "2"] }),
      f("features", "Features", "ফিচার", { type: "multi", opts: ["RGB", "Hot-swappable", "Numpad", "Multimedia Keys", "Spill Resistant"] }),
      color,
    ],
  },
  mouse: {
    cat: "accessories", icon: "mouse", label: L("Mouse", "মাউস"),
    filters: [
      f("type", "Type", "ধরন", { opts: ["Gaming", "Office", "Ergonomic", "Travel"], card: true }),
      f("connection", "Connection Type", "", { type: "multi", opts: ["Wired", "2.4G Wireless", "Bluetooth"], card: true }),
      f("dpi", "Max DPI", "", { unit: "DPI", card: true }),
      f("cableLength", "Cable Length", "ক্যাবল দৈর্ঘ্য", { unit: "m", opts: ["1.2", "1.5", "1.8", "2"] }),
      f("features", "Features", "ফিচার", { type: "multi", opts: ["RGB", "Programmable Buttons", "Silent Click", "Rechargeable"] }),
      color,
    ],
  },
  headphone: {
    cat: "accessories", icon: "headphone", label: L("Headphone", "হেডফোন"),
    filters: [
      f("type", "Type", "ধরন", { opts: ["Over-ear", "On-ear", "In-ear"], card: true }),
      f("connection", "Connection Type", "", { type: "multi", opts: ["3.5mm", "USB", "Bluetooth", "2.4G Wireless"], card: true }),
      f("features", "Features", "ফিচার", { type: "multi", opts: ["Microphone", "7.1 Surround", "Noise Cancelling", "RGB"], card: true }),
      color,
    ],
  },
  speaker: {
    cat: "accessories", icon: "speaker", label: L("Speaker & Home Theater", "স্পিকার ও হোম থিয়েটার"),
    filters: [
      f("type", "Type", "ধরন", { opts: ["2.0", "2.1", "5.1", "Soundbar", "Bluetooth Speaker"], card: true }),
      f("connection", "Connection Type", "", { type: "multi", opts: ["3.5mm AUX", "USB", "Bluetooth", "Optical"], card: true }),
      f("outputCapacity", "Output Capacity", "", { unit: "W RMS", card: true }),
      f("specialFeatures", "Special Features", "বিশেষ ফিচার", { type: "multi", opts: ["Bluetooth", "Subwoofer", "RGB", "USB Powered", "Remote Control", "FM Radio"] }),
      color,
    ],
  },
  "mouse-pad": {
    cat: "accessories", icon: "pad", label: L("Mouse Pad", "মাউস প্যাড"),
    filters: [
      f("size", "Size", "সাইজ", { opts: ["Small", "Medium", "Large", "Desk Mat (XL)"], card: true }),
      f("type", "Type", "ধরন", { opts: ["Standard", "Extended", "RGB"] }),
      f("bodyMaterial", "Body Material", "বডি ম্যাটেরিয়াল", { opts: ["Cloth", "Rubber", "Hard"], card: true }),
      f("features", "Features", "ফিচার", { type: "multi", opts: ["Stitched Edge", "Non-slip Base", "Water Resistant"] }),
      color,
    ],
  },

  /* ---------------- Networking ---------------- */
  "wifi-adapter": {
    cat: "networking", icon: "wifi", label: L("WiFi Adapter", "WiFi অ্যাডাপ্টার"), power: true,
    filters: [
      f("type", "Type", "ধরন", { opts: ["USB WiFi Adapter", "PCIe WiFi Card", "USB Bluetooth Adapter"], card: true }),
      f("connection", "Connection Type", "", { opts: ["USB 2.0", "USB 3.0", "PCIe"], card: true }),
      f("speed", "Speed", "", { opts: ["N150", "AC600", "AC1300", "AX1800", "AX3000"], card: true }),
      f("features", "Features", "ফিচার", { type: "multi", opts: ["Dual Band", "Bluetooth 5.x", "WiFi 6", "High-gain Antenna"] }),
    ],
  },
  "lan-card": {
    cat: "networking", icon: "lan", label: L("LAN Card", "LAN কার্ড"), power: true,
    filters: [
      f("connection", "Connection Type", "", { opts: ["PCIe", "USB 3.0"], card: true }),
      f("speed", "Speed", "", { opts: ["100 Mbps", "Gigabit (1G)", "2.5G"], card: true }),
      f("features", "Features", "ফিচার", { type: "multi", opts: ["Low Profile Bracket", "Wake-on-LAN"] }),
    ],
  },
  router: {
    cat: "networking", icon: "router", label: L("Router", "রাউটার"),
    filters: [
      f("type", "Type", "ধরন", { opts: ["Wi-Fi Router", "Mesh System", "Pocket Router"], card: true }),
      f("speed", "Speed", "", { opts: ["N300", "AC1200", "AX1500", "AX1800", "AX3000"], card: true }),
      f("connection", "Connection Type", "", { opts: ["Gigabit Ports", "Fast Ethernet Ports"] }),
      f("features", "Features", "ফিচার", { type: "multi", opts: ["WiFi 6", "Dual Band", "MU-MIMO", "Mesh Ready", "USB Port"] }),
    ],
  },

  /* ---------------- Power ---------------- */
  ups: {
    cat: "power", icon: "ups", label: L("UPS", "UPS"),
    filters: [
      f("type", "Type", "ধরন", { opts: ["Offline", "Line Interactive", "Online"], card: true }),
      f("va", "Volt Ampere (VA)", "", { unit: "VA", card: true }),
      f("loadWatts", "Load Capacity (Watts)", "", { unit: "W", card: true }),
      f("features", "Features", "ফিচার", { type: "multi", opts: ["AVR", "LCD Display", "USB Port", "Pure Sine Wave"] }),
    ],
  },

  /* ---------------- Software ---------------- */
  antivirus: {
    cat: "software", icon: "shield", label: L("Antivirus", "অ্যান্টিভাইরাস"),
    filters: [
      f("type", "Type", "ধরন", { opts: ["Antivirus", "Internet Security", "Total Security"], card: true }),
      f("devices", "Devices", "ডিভাইস", { opts: ["1", "3", "5", "10"], card: true }),
      f("validity", "Validity", "মেয়াদ", { opts: ["1 Year", "2 Years", "3 Years"], card: true }),
      f("features", "Features", "ফিচার", { type: "multi", opts: ["Ransomware Protection", "Safe Browsing", "Parental Control", "VPN"] }),
    ],
  },
};

/** Top-level shop categories → /shop/<key>. `subs` is the order shown in menus. */
export const CATEGORIES = {
  components: {
    icon: "cpu", label: L("PC Components", "PC কম্পোনেন্ট"),
    blurb: L("Processors, motherboards, RAM, SSDs, graphics cards and everything else inside the case.", "প্রসেসর, মাদারবোর্ড, RAM, SSD, গ্রাফিক্স কার্ডসহ কেসের ভেতরের সব কিছু।"),
    subs: ["processor", "cpu-cooler", "motherboard", "ram", "ssd", "hdd", "graphics-card", "power-supply", "casing", "casing-fan"],
  },
  laptops: {
    icon: "laptop", label: L("Laptops", "ল্যাপটপ"),
    blurb: L("Gaming, everyday and business laptops.", "গেমিং, এভরিডে ও বিজনেস ল্যাপটপ।"),
    subs: ["gaming-laptop", "everyday-laptop", "business-laptop"],
  },
  monitors: {
    icon: "monitor", label: L("Monitors", "মনিটর"),
    blurb: L("Office, gaming and professional displays.", "অফিস, গেমিং ও প্রফেশনাল ডিসপ্লে।"),
    subs: ["gaming-monitor", "office-monitor", "pro-monitor"],
  },
  accessories: {
    icon: "keyboard", label: L("Accessories", "এক্সেসরিজ"),
    blurb: L("Keyboards, mice, headphones, speakers and mouse pads.", "কিবোর্ড, মাউস, হেডফোন, স্পিকার ও মাউস প্যাড।"),
    subs: ["keyboard", "mouse", "headphone", "speaker", "mouse-pad"],
  },
  networking: {
    icon: "wifi", label: L("Networking", "নেটওয়ার্কিং"),
    blurb: L("WiFi adapters, LAN cards and routers.", "WiFi অ্যাডাপ্টার, LAN কার্ড ও রাউটার।"),
    subs: ["wifi-adapter", "lan-card", "router"],
  },
  power: {
    icon: "ups", label: L("Power & UPS", "পাওয়ার ও UPS"),
    blurb: L("UPS units that keep your PC safe through load-shedding.", "লোডশেডিংয়ে পিসি নিরাপদ রাখার UPS।"),
    subs: ["ups"],
  },
  software: {
    icon: "shield", label: L("Software", "সফটওয়্যার"),
    blurb: L("Genuine antivirus and security licences.", "আসল অ্যান্টিভাইরাস ও সিকিউরিটি লাইসেন্স।"),
    subs: ["antivirus"],
  },
};

/** PC Builder rows. The motherboard comes FIRST: it decides the CPU socket, RAM type and
 *  case size, so every row marked needsBoard stays locked until a motherboard is chosen and then
 *  lists only parts that fit it.
 *  max = how many different products can be added to the row
 *  qty = highest quantity of a single product (RAM sticks, spare fans...) */
export const BUILDER_ROWS = [
  { key: "mobo", group: "core", icon: "mobo", label: L("Motherboard", "মাদারবোর্ড"), subs: ["motherboard"], required: true, max: 1, qty: 1 },
  { key: "cpu", group: "core", icon: "cpu", label: L("CPU", "CPU"), subs: ["processor"], required: true, max: 1, qty: 1, needsBoard: true },
  { key: "cooler", group: "core", icon: "cooler", label: L("CPU Cooler", "CPU কুলার"), subs: ["cpu-cooler"], max: 1, qty: 1, needsBoard: true },
  { key: "ram", group: "core", icon: "ram", label: L("RAM", "RAM"), subs: ["ram"], required: true, max: 2, qty: 4, needsBoard: true },
  { key: "storage", group: "core", icon: "ssd", label: L("Storage", "স্টোরেজ"), subs: ["ssd", "hdd"], required: true, max: 3, qty: 4 },
  { key: "gpu", group: "core", icon: "gpu", label: L("Graphics Card", "গ্রাফিক্স কার্ড"), subs: ["graphics-card"], max: 1, qty: 1 },
  { key: "psu", group: "core", icon: "psu", label: L("Power Supply", "পাওয়ার সাপ্লাই"), subs: ["power-supply"], max: 1, qty: 1 },
  { key: "case", group: "core", icon: "case", label: L("Casing", "কেসিং"), subs: ["casing"], max: 1, qty: 1, needsBoard: true },
  { key: "monitor", group: "peripherals", icon: "monitor", label: L("Monitor", "মনিটর"), subs: ["gaming-monitor", "office-monitor", "pro-monitor"], max: 2, qty: 2 },
  { key: "fan", group: "peripherals", icon: "fan", label: L("Casing Cooler", "কেসিং কুলার"), subs: ["casing-fan"], max: 2, qty: 10 },
  { key: "keyboard", group: "peripherals", icon: "keyboard", label: L("Keyboard", "কিবোর্ড"), subs: ["keyboard"], max: 1, qty: 1 },
  { key: "mouse", group: "peripherals", icon: "mouse", label: L("Mouse", "মাউস"), subs: ["mouse"], max: 1, qty: 1 },
  { key: "speaker", group: "peripherals", icon: "speaker", label: L("Speaker & Home Theater", "স্পিকার ও হোম থিয়েটার"), subs: ["speaker"], max: 1, qty: 1 },
  { key: "headphone", group: "peripherals", icon: "headphone", label: L("Headphone", "হেডফোন"), subs: ["headphone"], max: 1, qty: 1 },
  { key: "wifi", group: "peripherals", icon: "wifi", label: L("WiFi Adapter / LAN Card", "WiFi অ্যাডাপ্টার / LAN কার্ড"), subs: ["wifi-adapter", "lan-card"], max: 2, qty: 1 },
  { key: "antivirus", group: "peripherals", icon: "shield", label: L("Anti Virus", "অ্যান্টি ভাইরাস"), subs: ["antivirus"], max: 1, qty: 1 },
  { key: "ups", group: "peripherals", icon: "ups", label: L("UPS", "UPS"), subs: ["ups"], max: 1, qty: 1 },
];

/** Plain-language spec VALUES that may be shown in Bangla. Everything else — DDR4, AM5, LGA1200,
 *  NVMe, M.2, WiFi 6, GDDR6, Windows 11, model names, sizes, speeds — always stays in English. */
export const VALUE_BN = {
  Black: "কালো", White: "সাদা", Silver: "রূপালি", Gray: "ধূসর", Red: "লাল", Blue: "নীল", Pink: "গোলাপি",
  Included: "অন্তর্ভুক্ত", "Not included": "অন্তর্ভুক্ত নয়", Small: "ছোট", Medium: "মাঝারি", Large: "বড়",
};

/* ---- helpers -------------------------------------------------------------- */
export const catOfSub = (sub) => SUBS[sub]?.cat || null;
export const subsOfCat = (cat) => CATEGORIES[cat]?.subs || [];
export const rowOfSub = (sub) => BUILDER_ROWS.find((r) => r.subs.includes(sub)) || null;
export const filterDef = (sub, key) => (SUBS[sub]?.filters || []).find((x) => x.key === key) || null;

const isNumeric = (v) => typeof v === "number" || (typeof v === "string" && /^\d+(\.\d+)?$/.test(v.trim()));

/** "16" + unit "GB" → "16 GB". Text values that already carry their unit are left alone. */
export function formatSpecValue(def, value) {
  if (Array.isArray(value)) return value.map((v) => formatSpecValue(def, v)).join(", ");
  if (value === null || value === undefined || value === "") return "";
  if (def?.unit && isNumeric(value)) return def.unit === '"' ? `${value}"` : `${value} ${def.unit}`;
  return String(value);
}

/** Which bucket label a numeric value falls in (type "bucket" filters). */
export function bucketLabel(def, value) {
  const n = Number(value);
  if (!Number.isFinite(n) || !def?.buckets) return null;
  const b = def.buckets.find(([min, max]) => n >= min && n < max);
  return b ? b[2] : null;
}
