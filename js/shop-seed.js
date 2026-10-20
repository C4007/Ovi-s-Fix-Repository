/* ==========================================================================
   Ovi's Fix — starter shop data
   This is what the shop shows until you save your own data from Admin.
   Prices are BDT reference prices calibrated from Star Tech, Ryans, Techland
   and Computer Village listings checked on 10 Oct 2026. RAM, SSD and graphics
   card prices are moving fast right now — check every price before you publish
   (Admin → Products has "check market price" links on each product).

   Every product starts as "Pre-order": change it to "In stock" for parts you
   really hold. Product photos are added from Admin; until then the shop shows
   a neutral category illustration.
   ========================================================================== */

const BASE_TIME = Date.UTC(2026, 9, 10);
let seq = 0;

function mk(sub, id, brand, name, price, specs, extra = {}) {
  const clean = {};
  for (const [k, v] of Object.entries(specs)) {
    if (v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length)) clean[k] = v;
  }
  return {
    id, sub, brand, name, price,
    salePrice: extra.sale ?? null,
    stock: extra.stock || "pre",
    image: "",
    desc: extra.desc || "",
    specs: clean,
    tdp: extra.tdp ?? null,
    perf: extra.perf ?? null,
    igpu: extra.igpu ?? null,
    featured: !!extra.featured,
    createdAt: BASE_TIME - seq++ * 60000,
  };
}

/* ---- processors: tdp = real max power draw (W), perf = gaming index (Ryzen 5 5600 = 100) ---- */
const cpu = (id, name, price, socket, ptype, series, cores, threads, clock, cache, tdp, perf, feat, o = {}) =>
  mk("processor", id, /^AMD/.test(name) ? "AMD" : "Intel", name, price,
    { socket, processorType: ptype, series, model: name.replace(/^(AMD|Intel) /, "").replace(/ Processor$/, ""), cores, threads, clock, cache, features: feat, packaging: o.pack || "Box" },
    { tdp, perf, igpu: o.igpu || 0, sale: o.sale, featured: o.featured });

/* ---- motherboards ---- */
const SERIES = { AM4: "Ryzen 5000 / 4000G / 3000", AM5: "Ryzen 7000 / 8000 / 9000", LGA1200: "10th / 11th Gen", LGA1700: "12th / 13th / 14th Gen" };
const mb = (id, brand, name, price, chipset, socket, mem, maxMem, slots, ff, feat, o = {}) =>
  mk("motherboard", id, brand, name, price,
    { chipset, socket, processorType: socket.startsWith("AM") ? "AMD" : "Intel", series: SERIES[socket], memType: mem, maxMem, ramSlots: slots, formFactor: ff, mbFeatures: feat, color: o.color || "Black" },
    { tdp: ff === "ATX" ? 55 : 45, featured: o.featured });

/* ---- RAM kits: `sticks` = number of modules in the kit ---- */
const ram = (id, brand, name, price, type, size, sticks, speed, feat, o = {}) =>
  mk("ram", id, brand, name, price, { ramType: type, ramSize: size, ramSticks: sticks, ramSpeed: speed, ramFeatures: feat, type: "Desktop", color: "Black" }, { tdp: 5 * sticks, featured: o.featured });

/* ---- SSD / HDD ---- */
const ssd = (id, brand, name, price, cap, ff, iface, gen, size, read, write, o = {}) =>
  mk("ssd", id, brand, name, price, { ssdCapacity: cap, formFactor: ff, ssdInterface: iface, ssdGen: gen, ssdSize: size, readSpeed: read, writeSpeed: write }, { tdp: ff === "M.2 NVMe" ? 6 : 3, sale: o.sale, featured: o.featured });
const hdd = (id, brand, name, price, cap, ff, type, rpm) =>
  mk("hdd", id, brand, name, price, { hddCapacity: cap, formFactor: ff, hddType: type, speed: rpm }, { tdp: ff === "3.5-inch" ? 8 : 4 });

/* ---- graphics cards: tdp = board power (W), perf = gaming index (RTX 4060 = 100) ---- */
const gpu = (id, brand, name, price, chipset, line, vram, mem, rec, tdp, perf, cooler, feat = [], o = {}) =>
  mk("graphics-card", id, brand, name, price,
    {
      chipset, gpuSeries: line.startsWith("RTX") ? "GeForce RTX" : "Radeon RX",
      nvidiaSeries: line.startsWith("RTX") ? line : undefined, radeonSeries: line.startsWith("RX") ? line : undefined,
      memSize: vram, memType: mem, maxRes: "7680x4320", coolerType: cooler, recPsu: rec, features: feat,
    },
    { tdp, perf, featured: o.featured });

/* ---- power supplies / casings / coolers / fans ---- */
const psu = (id, brand, name, price, watts, modular, eff, feat = [], o = {}) =>
  mk("power-supply", id, brand, name, price, { watts, modular, efficiency: eff, formFactor: "ATX", features: feat, color: "Black" }, { featured: o.featured });
const cs = (id, brand, name, price, ff, boards, side, mat, psuInc, feat, color = "Black", o = {}) =>
  mk("casing", id, brand, name, price, { formFactor: ff, boardSupport: boards, sidePanel: side, bodyMaterial: mat, powerSupply: psuInc, features: feat, color }, { featured: o.featured });
const cl = (id, brand, name, price, type, size, fan, rpm, sockets, conn, feat, tdp, color = "Black") =>
  mk("cpu-cooler", id, brand, name, price, { coolerType: type, coolerSize: size, fanSize: fan, fanSpeed: rpm, socket: sockets, connection: conn, features: feat, color }, { tdp });
const fan = (id, brand, name, price, size, rpm, conn, feat, color = "Black") =>
  mk("casing-fan", id, brand, name, price, { fanSize: size, fanSpeed: rpm, connection: conn, features: feat, color }, { tdp: 2 });

/* ---- monitors / laptops ---- */
const mon = (sub, id, brand, name, price, size, res, hz, panel, feat, conn, o = {}) =>
  mk(sub, id, brand, name, price, { screenSize: size, resolution: res, refreshRate: hz, displayType: panel, features: feat, connection: conn, color: "Black" }, { featured: o.featured });
const lap = (sub, id, brand, name, price, ptype, model, series, ramSize, ramType, storage, chipset, size, res, hz, panel, feat, o = {}) =>
  mk(sub, id, brand, name, price, { processorType: ptype, model, series, ramSize, ramType, storage, chipset, displaySize: size, resolution: res, refreshRate: hz, displayType: panel, features: feat }, { featured: o.featured });

/* ---- accessories / networking / power / software ---- */
const kb = (id, brand, name, price, type, sw, size, conn, cable, feat, color = "Black") =>
  mk("keyboard", id, brand, name, price, { keyboardType: type, switch: sw, size, connection: conn, cableLength: cable, features: feat, color }, { tdp: 1 });
const ms = (id, brand, name, price, type, conn, dpi, cable, feat, color = "Black") =>
  mk("mouse", id, brand, name, price, { type, connection: conn, dpi, cableLength: cable, features: feat, color }, { tdp: 1 });
const hp = (id, brand, name, price, type, conn, feat, color = "Black") =>
  mk("headphone", id, brand, name, price, { type, connection: conn, features: feat, color });
const sp = (id, brand, name, price, type, conn, rms, feat, color = "Black") =>
  mk("speaker", id, brand, name, price, { type, connection: conn, outputCapacity: rms, specialFeatures: feat, color });
const pad = (id, brand, name, price, size, type, mat, feat, color = "Black") =>
  mk("mouse-pad", id, brand, name, price, { size, type, bodyMaterial: mat, features: feat, color });
const wifi = (id, brand, name, price, type, conn, speed, feat) =>
  mk("wifi-adapter", id, brand, name, price, { type, connection: conn, speed, features: feat }, { tdp: 3 });
const lan = (id, brand, name, price, conn, speed, feat = []) =>
  mk("lan-card", id, brand, name, price, { connection: conn, speed, features: feat }, { tdp: 2 });
const rt = (id, brand, name, price, type, speed, conn, feat) =>
  mk("router", id, brand, name, price, { type, speed, connection: conn, features: feat });
const ups = (id, brand, name, price, type, va, w, feat) =>
  mk("ups", id, brand, name, price, { type, va, loadWatts: w, features: feat });
const av = (id, brand, name, price, type, devices, validity, feat) =>
  mk("antivirus", id, brand, name, price, { type, devices, validity, features: feat });

const NVME3 = ["M.2 NVMe", "PCIe 3.0 x4", "Gen3", "M.2 2280"];
const NVME4 = ["M.2 NVMe", "PCIe 4.0 x4", "Gen4", "M.2 2280"];
const SATA = ["2.5\" SATA", "SATA III", "SATA", "2.5-inch"];
const AMD_SOCKS = ["AM4", "AM5", "LGA1700", "LGA1200"];

export const seedProducts = [
  /* ===== Processors ===== */
  cpu("amd-ryzen-5-5500", "AMD Ryzen 5 5500 Processor", 9200, "AM4", "Ryzen 5", "Ryzen 5000", 6, 12, 4.2, 19, 88, 88, ["Cooler Included"]),
  cpu("amd-ryzen-5-5600", "AMD Ryzen 5 5600 Processor", 12400, "AM4", "Ryzen 5", "Ryzen 5000", 6, 12, 4.4, 35, 88, 100, ["Cooler Included"], { featured: true }),
  cpu("amd-ryzen-5-5600g", "AMD Ryzen 5 5600G Processor", 13900, "AM4", "Ryzen 5", "Ryzen 5000", 6, 12, 4.4, 19, 88, 94, ["Integrated Graphics", "Cooler Included"], { igpu: 22 }),
  cpu("amd-ryzen-7-5700x", "AMD Ryzen 7 5700X Processor", 18500, "AM4", "Ryzen 7", "Ryzen 5000", 8, 16, 4.6, 36, 88, 108, []),
  cpu("amd-ryzen-5-7400f", "AMD Ryzen 5 7400F Processor", 14800, "AM5", "Ryzen 5", "Ryzen 7000", 6, 12, 4.7, 38, 88, 112, ["PCIe 5.0"], { pack: "Tray" }),
  cpu("amd-ryzen-5-7500f", "AMD Ryzen 5 7500F Processor", 17200, "AM5", "Ryzen 5", "Ryzen 7000", 6, 12, 5.0, 38, 88, 118, ["Cooler Included", "PCIe 5.0"]),
  cpu("amd-ryzen-5-7600", "AMD Ryzen 5 7600 Gaming Processor", 21750, "AM5", "Ryzen 5", "Ryzen 7000", 6, 12, 5.1, 38, 88, 123, ["Integrated Graphics", "Cooler Included", "PCIe 5.0"], { igpu: 14, sale: 19700, featured: true }),
  cpu("amd-ryzen-5-9600x", "AMD Ryzen 5 9600X Processor", 27800, "AM5", "Ryzen 5", "Ryzen 9000", 6, 12, 5.4, 38, 88, 138, ["Integrated Graphics", "Unlocked", "PCIe 5.0"], { igpu: 14 }),
  cpu("amd-ryzen-7-9700x", "AMD Ryzen 7 9700X Processor", 41500, "AM5", "Ryzen 7", "Ryzen 9000", 8, 16, 5.5, 40, 88, 148, ["Integrated Graphics", "Unlocked", "PCIe 5.0"], { igpu: 14 }),
  cpu("intel-core-i3-12100", "Intel Core i3-12100 Processor", 10800, "LGA1700", "Core i3", "12th Gen", 4, 8, 4.3, 12, 89, 92, ["Integrated Graphics", "Cooler Included"], { igpu: 14 }),
  cpu("intel-core-i3-12100f", "Intel Core i3-12100F Processor", 8900, "LGA1700", "Core i3", "12th Gen", 4, 8, 4.3, 12, 89, 92, ["Cooler Included"]),
  cpu("intel-core-i5-12400f", "Intel Core i5-12400F Processor", 13900, "LGA1700", "Core i5", "12th Gen", 6, 12, 4.4, 18, 117, 103, ["Cooler Included"]),
  cpu("intel-core-i5-14400f", "Intel Core i5-14400F Processor", 21900, "LGA1700", "Core i5", "14th Gen", 10, 16, 4.7, 20, 148, 114, ["Cooler Included"]),
  cpu("intel-core-i5-14600k", "Intel Core i5-14600K Processor", 33500, "LGA1700", "Core i5", "14th Gen", 14, 20, 5.3, 24, 181, 138, ["Integrated Graphics", "Unlocked"], { igpu: 16 }),
  cpu("intel-core-i3-10100f", "Intel Core i3-10100F Processor", 7500, "LGA1200", "Core i3", "10th Gen", 4, 8, 4.3, 6, 90, 76, ["Cooler Included"]),
  cpu("intel-core-i5-10400f", "Intel Core i5-10400F Processor", 11500, "LGA1200", "Core i5", "10th Gen", 6, 12, 4.3, 12, 134, 88, ["Cooler Included"]),

  /* ===== CPU coolers ===== */
  cl("deepcool-ice-edge-mini-fs-v2", "DeepCool", "DeepCool ICE EDGE MINI FS V2.0 CPU Air Cooler", 1150, "Air", "92mm", 92, 2200, AMD_SOCKS, "3-Pin", [], 3),
  cl("deepcool-ak400-zero-dark-plus", "DeepCool", "DeepCool AK400 ZERO DARK PLUS CPU Air Cooler", 2650, "Air", "120mm", 120, 1850, AMD_SOCKS, "4-Pin PWM", ["Heat Pipes", "Dual Fan"], 5),
  cl("cooler-master-hyper-212-black", "Cooler Master", "Cooler Master Hyper 212 Black CPU Air Cooler", 3300, "Air", "120mm", 120, 1800, AMD_SOCKS, "4-Pin PWM", ["Heat Pipes"], 4),
  cl("thermalright-peerless-assassin-120-se", "Thermalright", "Thermalright Peerless Assassin 120 SE CPU Air Cooler", 4200, "Air", "120mm", 120, 1550, AMD_SOCKS, "4-Pin PWM", ["Heat Pipes", "Dual Fan"], 5),
  cl("t-wolf-frost-x240", "T-Wolf", "T-Wolf Frost X240 Liquid 240MM CPU Cooler with Digital Display (Black)", 4999, "Liquid (AIO)", "240mm", 120, 1800, AMD_SOCKS, "4-Pin PWM", ["ARGB", "LCD Display", "Copper Base"], 15),
  cl("t-wolf-frost-x360", "T-Wolf", "T-Wolf Frost X360 Liquid 360MM CPU Cooler with Digital Display (Black)", 5600, "Liquid (AIO)", "360mm", 120, 1800, AMD_SOCKS, "4-Pin PWM", ["ARGB", "LCD Display", "Copper Base"], 18),
  cl("t-wolf-dp-360-liquid-screen", "T-Wolf", "T-Wolf DP-360 Liquid Screen CPU Cooler with Display (Black)", 9499, "Liquid (AIO)", "360mm", 120, 1800, AMD_SOCKS, "4-Pin PWM", ["ARGB", "LCD Display", "Copper Base"], 18),

  /* ===== Motherboards ===== */
  mb("gigabyte-b450m-k", "Gigabyte", "Gigabyte B450M K Micro-ATX AM4 Motherboard", 7900, "B450", "AM4", "DDR4", 64, 2, "Micro-ATX", ["M.2 NVMe", "HDMI"]),
  mb("gigabyte-b550m-h", "Gigabyte", "Gigabyte B550M H DDR4 AM4 Socket ARGB Motherboard", 11200, "B550", "AM4", "DDR4", 64, 2, "Micro-ATX", ["M.2 NVMe", "PCIe 4.0", "ARGB Header", "HDMI"], { featured: true }),
  mb("msi-pro-a620m-e", "MSI", "MSI PRO A620M-E AMD AM5 mATX Motherboard", 11800, "A620", "AM5", "DDR5", 192, 2, "Micro-ATX", ["M.2 NVMe", "HDMI", "DisplayPort"]),
  mb("asrock-a620m-hdv-m2-plus", "ASRock", "ASRock A620M-HDV/M.2+ AM5 mATX Motherboard", 10900, "A620", "AM5", "DDR5", 192, 2, "Micro-ATX", ["M.2 NVMe", "HDMI"]),
  mb("gigabyte-b650m-k", "Gigabyte", "Gigabyte B650M K AM5 mATX Motherboard", 15900, "B650", "AM5", "DDR5", 192, 2, "Micro-ATX", ["M.2 NVMe", "PCIe 4.0", "HDMI"], { featured: true }),
  mb("asus-tuf-gaming-b650-plus-wifi", "ASUS", "ASUS TUF Gaming B650-PLUS WiFi AM5 ATX Motherboard", 27500, "B650", "AM5", "DDR5", 192, 4, "ATX", ["Wi-Fi", "Bluetooth", "M.2 NVMe", "PCIe 5.0", "ARGB Header", "HDMI", "DisplayPort"]),
  mb("gigabyte-h610m-h-v3-ddr4", "Gigabyte", "Gigabyte H610M H V3 DDR4 Micro-ATX Motherboard", 8900, "H610", "LGA1700", "DDR4", 64, 2, "Micro-ATX", ["M.2 NVMe", "HDMI"]),
  mb("gigabyte-b760m-ds3h-ddr4", "Gigabyte", "Gigabyte B760M DS3H DDR4 Micro-ATX Motherboard", 15500, "B760", "LGA1700", "DDR4", 128, 4, "Micro-ATX", ["M.2 NVMe", "PCIe 4.0", "HDMI", "DisplayPort"]),
  mb("asrock-b760m-hdv-m2-d4", "ASRock", "ASRock B760M-HDV/M.2 D4 Micro-ATX Motherboard", 14200, "B760", "LGA1700", "DDR4", 64, 2, "Micro-ATX", ["M.2 NVMe", "HDMI"]),
  mb("msi-pro-z790-p", "MSI", "MSI PRO Z790-P DDR5 ATX Motherboard", 24900, "Z790", "LGA1700", "DDR5", 192, 4, "ATX", ["M.2 NVMe", "PCIe 5.0", "HDMI", "DisplayPort"]),
  mb("gigabyte-h510m-h-v2", "Gigabyte", "Gigabyte H510M H V2 DDR4 Micro-ATX LGA1200 Motherboard", 7900, "H510", "LGA1200", "DDR4", 64, 2, "Micro-ATX", ["M.2 NVMe", "HDMI"]),
  mb("asus-prime-b460m-k", "ASUS", "ASUS PRIME B460M-K DDR4 Micro-ATX LGA1200 Motherboard", 9800, "B460", "LGA1200", "DDR4", 128, 4, "Micro-ATX", ["M.2 NVMe", "HDMI"]),

  /* ===== RAM ===== */
  ram("kingston-fury-beast-8gb-3200-ddr4", "Kingston", "Kingston ValueRAM 8GB 3200MHz DDR4 Desktop RAM", 5200, "DDR4", 8, 1, 3200, []),
  ram("kingston-fury-beast-16gb-3200-ddr4", "Kingston", "Kingston FURY Beast 16GB 3200MHz DDR4 Desktop RAM", 9900, "DDR4", 16, 1, 3200, ["Heatsink", "XMP"]),
  ram("kingston-fury-beast-16gb-2x8-3200-ddr4", "Kingston", "Kingston FURY Beast 16GB (2x8GB) 3200MHz DDR4 Kit", 11500, "DDR4", 16, 2, 3200, ["Heatsink", "XMP"], { featured: true }),
  ram("gskill-ripjaws-v-32gb-2x16-3200-ddr4", "G.Skill", "G.Skill Ripjaws V 32GB (2x16GB) 3200MHz DDR4 Kit", 19500, "DDR4", 32, 2, 3200, ["Heatsink", "XMP"]),
  ram("kingston-fury-beast-16gb-6000-cl30-ddr5", "Kingston", "Kingston FURY Beast 16GB 6000MHz CL30 DDR5 Desktop RAM", 23900, "DDR5", 16, 1, 6000, ["Heatsink", "XMP", "EXPO"]),
  ram("teamgroup-t-force-vulcan-16gb-2x8-5600-ddr5", "TeamGroup", "TeamGroup T-Force Vulcan 16GB (2x8GB) 5600MHz DDR5 Kit", 21500, "DDR5", 16, 2, 5600, ["Heatsink", "XMP"], { featured: true }),
  ram("corsair-vengeance-rgb-32gb-2x16-6000-ddr5", "Corsair", "Corsair Vengeance RGB 32GB (2x16GB) 6000MHz DDR5 Kit", 46500, "DDR5", 32, 2, 6000, ["RGB", "Heatsink", "XMP", "EXPO"]),

  /* ===== SSD ===== */
  ssd("lexar-ns100-256gb-sata", "Lexar", "Lexar NS100 256GB 2.5 inch Gray SATA III SSD", 6200, "256GB", ...SATA, 520, 440),
  ssd("lexar-ns100-512gb-sata", "Lexar", "Lexar NS100 512GB 2.5 inch Gray SATA III SSD", 13500, "512GB", ...SATA, 550, 450, { sale: 9900, featured: true }),
  ssd("lexar-nm620-512gb", "Lexar", "Lexar NM620 512GB M.2 NVMe SSD", 14520, "512GB", ...NVME3, 3500, 2400, { sale: 13200, featured: true }),
  ssd("lexar-nm620-1tb", "Lexar", "Lexar NM620 1TB M.2 NVMe SSD", 19900, "1TB", ...NVME3, 3500, 3000),
  ssd("kingston-nv3-1tb", "Kingston", "Kingston NV3 1TB M.2 2280 NVMe SSD", 20500, "1TB", ...NVME4, 6000, 4000),
  ssd("lexar-nm790-1tb", "Lexar", "Lexar NM790 1TB M.2 2280 PCIe Gen4 NVMe SSD", 24500, "1TB", ...NVME4, 7400, 6500),
  ssd("lexar-nm790-2tb", "Lexar", "Lexar NM790 2TB M.2 2280 PCIe Gen4 NVMe SSD", 42000, "2TB", ...NVME4, 7400, 6500),
  ssd("lexar-nm1090-pro-1tb", "Lexar", "Lexar Professional NM1090 Pro 1TB M.2 2280 PCIe Gen5 NVMe SSD With DRAM", 38500, "1TB", "M.2 NVMe", "PCIe 5.0 x4", "Gen5", "M.2 2280", 14000, 11000),

  /* ===== HDD ===== */
  hdd("seagate-barracuda-1tb-3-5", "Seagate", "Seagate BarraCuda 1TB 7200RPM 3.5\" Desktop HDD", 6500, "1TB", "3.5-inch", "Desktop", 7200),
  hdd("seagate-barracuda-2tb-3-5", "Seagate", "Seagate BarraCuda 2TB 7200RPM 3.5\" Desktop HDD", 8900, "2TB", "3.5-inch", "Desktop", 7200),
  hdd("wd-blue-1tb-3-5", "Western Digital", "Western Digital Blue 1TB 7200RPM 3.5\" Desktop HDD", 6300, "1TB", "3.5-inch", "Desktop", 7200),
  hdd("toshiba-1tb-2-5-laptop", "Toshiba", "Toshiba 1TB 5400RPM 2.5\" Internal HDD", 5900, "1TB", "2.5-inch", "Portable", 5400),
  hdd("wd-purple-2tb-surveillance", "Western Digital", "Western Digital Purple 2TB 3.5\" Surveillance HDD", 8400, "2TB", "3.5-inch", "Surveillance", 5400),

  /* ===== Graphics cards ===== */
  gpu("msi-rtx-3050-ventus-2x-xs-8g-oc", "MSI", "MSI GeForce RTX 3050 VENTUS 2X XS 8G OC 8GB GDDR6 Graphics Card", 31500, "GeForce RTX 3050", "RTX 30 Series", 8, "GDDR6", 550, 130, 68, "Dual Fan", ["OC Edition"]),
  gpu("asus-dual-rtx-5050-8g", "ASUS", "ASUS Dual GeForce RTX 5050 8GB GDDR6 Graphics Card", 38500, "GeForce RTX 5050", "RTX 50 Series", 8, "GDDR6", 550, 130, 92, "Dual Fan"),
  gpu("gigabyte-rtx-5060-eagle-oc-8g", "Gigabyte", "Gigabyte GeForce RTX 5060 EAGLE OC 8G 8GB GDDR7 Graphics Card", 49500, "GeForce RTX 5060", "RTX 50 Series", 8, "GDDR7", 550, 145, 114, "Triple Fan", ["OC Edition"]),
  gpu("asus-dual-rtx-5060-oc-8g", "ASUS", "ASUS Dual GeForce RTX 5060 OC Edition 8GB GDDR7 Graphics Card", 49900, "GeForce RTX 5060", "RTX 50 Series", 8, "GDDR7", 550, 145, 114, "Dual Fan", ["OC Edition"], { featured: true }),
  gpu("msi-rtx-5060-ti-8g-ventus-2x-oc-plus", "MSI", "MSI GeForce RTX 5060 Ti 8G VENTUS 2X OC PLUS 8GB GDDR7 Graphics Card", 61500, "GeForce RTX 5060 Ti", "RTX 50 Series", 8, "GDDR7", 650, 180, 130, "Dual Fan", ["OC Edition"]),
  gpu("asus-dual-rtx-5060-ti-oc-16g", "ASUS", "ASUS Dual GeForce RTX 5060 Ti OC Edition 16GB GDDR7 Graphics Card", 76500, "GeForce RTX 5060 Ti", "RTX 50 Series", 16, "GDDR7", 650, 180, 132, "Dual Fan", ["OC Edition"]),
  gpu("powercolor-reaper-rx-9060-xt-8g", "PowerColor", "PowerColor Reaper AMD Radeon RX 9060 XT 8GB GDDR6 Black Graphics Card", 46500, "Radeon RX 9060 XT", "RX 9000 Series", 8, "GDDR6", 550, 150, 126, "Dual Fan"),
  gpu("sapphire-pulse-rx-9060-xt-oc-16g", "Sapphire", "SAPPHIRE Pulse AMD Radeon RX 9060 XT OC 16GB GDDR6 Graphics Card", 59500, "Radeon RX 9060 XT", "RX 9000 Series", 16, "GDDR6", 650, 160, 130, "Dual Fan", ["OC Edition"]),
  gpu("gigabyte-rx-9070-xt-gaming-oc-16g", "Gigabyte", "Gigabyte Radeon RX 9070 XT GAMING OC 16G 16GB GDDR6 Graphics Card", 108000, "Radeon RX 9070 XT", "RX 9000 Series", 16, "GDDR6", 850, 304, 205, "Triple Fan", ["OC Edition"]),

  /* ===== Power supplies ===== */
  psu("cooler-master-mwe-450-bronze-v2", "Cooler Master", "Cooler Master MWE 450 Bronze V2 450W Power Supply", 4600, 450, "Non-modular", "80+ Bronze"),
  psu("cooler-master-mwe-550-bronze-v2", "Cooler Master", "Cooler Master MWE 550 Bronze V2 550W Power Supply", 5600, 550, "Non-modular", "80+ Bronze", [], { featured: true }),
  psu("deepcool-pk550d", "DeepCool", "DeepCool PK550D 550W 80+ Bronze Power Supply", 5600, 550, "Non-modular", "80+ Bronze"),
  psu("corsair-cv650", "Corsair", "Corsair CV650 650W 80+ Bronze Power Supply", 7200, 650, "Non-modular", "80+ Bronze"),
  psu("msi-mag-a650bn", "MSI", "MSI MAG A650BN 650W 80+ Bronze Power Supply", 6900, 650, "Non-modular", "80+ Bronze"),
  psu("deepcool-pn750m", "DeepCool", "DeepCool PN750M 750W 80+ Gold Fully Modular Power Supply", 11900, 750, "Fully modular", "80+ Gold", ["ATX 3.1", "12V-2x6 Connector"]),
  psu("corsair-rm750e", "Corsair", "Corsair RM750e 750W 80+ Gold Fully Modular ATX 3.1 Power Supply", 15500, 750, "Fully modular", "80+ Gold", ["ATX 3.1", "12V-2x6 Connector", "Zero RPM Fan"]),
  psu("corsair-rm850e", "Corsair", "Corsair RM850e 850W 80+ Gold Fully Modular ATX 3.1 Power Supply", 18500, 850, "Fully modular", "80+ Gold", ["ATX 3.1", "12V-2x6 Connector", "Zero RPM Fan"]),

  /* ===== Casings ===== */
  cs("maxgreen-entice-g1-pro", "MaxGreen", "MaxGreen Entice G1 Pro Mid-Tower mATX Casing With 200W Power Supply", 2900, "Mid Tower", ["Micro-ATX", "Mini-ITX"], "Solid Steel", "Steel", "Included", []),
  cs("cooler-master-masterbox-q300l", "Cooler Master", "Cooler Master MasterBox Q300L Mini Tower mATX Casing", 5200, "Mini Tower", ["Micro-ATX", "Mini-ITX"], "Acrylic", "Steel & Plastic", "Not included", []),
  cs("deepcool-cc560-v2", "DeepCool", "DeepCool CC560 V2 ATX Mid-Tower Gaming Casing", 5900, "Mid Tower", ["ATX", "Micro-ATX", "Mini-ITX"], "Tempered Glass", "Steel", "Not included", ["ARGB Fans", "Mesh Front"], "Black", { featured: true }),
  cs("deepcool-ch360", "DeepCool", "DeepCool CH360 mATX Mid-Tower Casing", 8900, "Mid Tower", ["Micro-ATX", "Mini-ITX"], "Tempered Glass", "Steel", "Not included", ["Mesh Front", "Vertical GPU Mount"]),
  cs("antec-nx410", "Antec", "Antec NX410 ATX Mid-Tower Gaming Casing", 8500, "Mid Tower", ["ATX", "Micro-ATX", "Mini-ITX"], "Tempered Glass", "Steel", "Not included", ["ARGB Fans", "Mesh Front"]),
  cs("corsair-3000d-airflow", "Corsair", "Corsair 3000D Airflow ATX Mid-Tower Casing", 12800, "Mid Tower", ["ATX", "Micro-ATX", "Mini-ITX"], "Tempered Glass", "Steel", "Not included", ["Mesh Front", "Front USB-C"]),
  cs("nzxt-h5-flow", "NZXT", "NZXT H5 Flow ATX Mid-Tower Casing", 14900, "Mid Tower", ["ATX", "Micro-ATX", "Mini-ITX"], "Tempered Glass", "Steel", "Not included", ["Mesh Front", "Front USB-C"], "White"),

  /* ===== Casing fans (prices from the Star Tech listing) ===== */
  fan("deepcool-xfan-120", "DeepCool", "DeepCool XFAN 120 Case Cooling Fan", 390, 120, 1300, "3-Pin", []),
  fan("pc-power-cfx-120-argb-white", "PC Power", "PC Power CFX 120MM ARGB Case Fan White", 375, 120, 1200, "3-Pin ARGB", ["ARGB"], "White"),
  fan("maxgreen-m57-argb-120", "MaxGreen", "MaxGreen M57 ARGB 120mm Casing Fan", 600, 120, 1000, "3-Pin ARGB", ["ARGB", "Hydraulic Bearing"]),
  fan("cooler-master-cf120-argb", "Cooler Master", "Cooler Master CF120 ARGB Case Fan", 800, 120, 1800, "3-Pin ARGB", ["ARGB"]),
  fan("arctic-f12-120", "Arctic", "Arctic F12 120 mm Casing Fan", 900, 120, 1350, "3-Pin", []),
  fan("asus-ar120-argb-pwm", "ASUS", "ASUS AR120 ARGB PWM Single Pack Casing Fan", 1000, 120, 1450, "4-Pin PWM", ["ARGB", "PWM", "Hydraulic Bearing"]),
  fan("arctic-p12-silent", "Arctic", "Arctic P12 Silent 120 mm Low Noise Casing Fan", 1000, 120, 1050, "3-Pin", []),

  /* ===== Monitors ===== */
  mon("office-monitor", "lg-24mr400-b", "LG", "LG 24MR400-B 23.8 Inch FHD IPS 100Hz Monitor", 12900, 24, "1920x1080 (FHD)", 100, "IPS", ["Adaptive Sync", "Eye Care"], ["HDMI", "VGA"]),
  mon("office-monitor", "msi-pro-mp243x", "MSI", "MSI PRO MP243X 23.8 Inch FHD IPS 100Hz Monitor", 11900, 24, "1920x1080 (FHD)", 100, "IPS", ["Eye Care"], ["HDMI", "VGA"], { featured: true }),
  mon("office-monitor", "dell-s2425h", "Dell", "Dell S2425H 24 Inch FHD IPS 100Hz Monitor with Speakers", 15900, 24, "1920x1080 (FHD)", 100, "IPS", ["Built-in Speakers", "Eye Care"], ["HDMI"]),
  mon("gaming-monitor", "asus-vy249hge", "ASUS", "ASUS VY249HGE 23.8 Inch FHD IPS 144Hz Gaming Monitor", 15800, 24, "1920x1080 (FHD)", 144, "IPS", ["Adaptive Sync", "Eye Care"], ["HDMI", "VGA"]),
  mon("gaming-monitor", "msi-g2412", "MSI", "MSI G2412 23.8 Inch FHD IPS 170Hz Gaming Monitor", 16500, 24, "1920x1080 (FHD)", 170, "IPS", ["Adaptive Sync"], ["HDMI", "DisplayPort"], { featured: true }),
  mon("gaming-monitor", "gigabyte-gs27f", "Gigabyte", "Gigabyte GS27F 27 Inch FHD SS IPS 180Hz Gaming Monitor", 20500, 27, "1920x1080 (FHD)", 180, "IPS", ["Adaptive Sync", "HDR"], ["HDMI", "DisplayPort"]),
  mon("gaming-monitor", "samsung-odyssey-g3-27", "Samsung", "Samsung Odyssey G3 27 Inch FHD 165Hz VA Gaming Monitor", 22500, 27, "1920x1080 (FHD)", 165, "VA", ["Adaptive Sync", "Height Adjustable"], ["HDMI", "DisplayPort"]),
  mon("gaming-monitor", "viewsonic-vx2758a-2k-pro", "ViewSonic", "ViewSonic VX2758A-2K-PRO 27 Inch QHD IPS 170Hz Gaming Monitor", 29500, 27, "2560x1440 (QHD)", 170, "IPS", ["Adaptive Sync", "HDR"], ["HDMI", "DisplayPort"]),
  mon("pro-monitor", "aoc-q27p3cv", "AOC", "AOC Q27P3CV 27 Inch QHD IPS 75Hz USB-C Monitor", 26500, 27, "2560x1440 (QHD)", 75, "IPS", ["USB-C", "Eye Care", "Height Adjustable"], ["HDMI", "DisplayPort", "USB-C"]),
  mon("pro-monitor", "dell-s2725qc", "Dell", "Dell S2725QC 27 Inch 4K IPS 120Hz USB-C Monitor", 42500, 27, "3840x2160 (4K)", 120, "IPS", ["USB-C", "HDR", "Built-in Speakers"], ["HDMI", "USB-C"]),

  /* ===== Laptops ===== */
  lap("gaming-laptop", "asus-tuf-gaming-a15-fa506nf", "ASUS", "ASUS TUF Gaming A15 FA506NF Ryzen 5 7535HS RTX 2050 16GB 512GB", 92500, "Ryzen 5", "Ryzen 5 7535HS", "Ryzen 7000", 16, "DDR5", "512GB SSD", "RTX 2050", 15.6, "1920x1080 (FHD)", 144, "IPS", ["Backlit Keyboard", "FreeDOS"]),
  lap("gaming-laptop", "msi-thin-15-b13uc", "MSI", "MSI Thin 15 B13UC Core i5-13420H RTX 3050 8GB 512GB", 89500, "Core i5", "Core i5-13420H", "13th Gen", 8, "DDR4", "512GB SSD", "RTX 3050", 15.6, "1920x1080 (FHD)", 144, "IPS", ["Backlit Keyboard", "Windows 11 Home"]),
  lap("everyday-laptop", "lenovo-ideapad-slim-3-15iru8", "Lenovo", "Lenovo IdeaPad Slim 3 15IRU8 Core i3-1305U 8GB 512GB", 46500, "Core i3", "Core i3-1305U", "13th Gen", 8, "DDR4", "512GB SSD", "Integrated", 15.6, "1920x1080 (FHD)", 60, "TN", ["Windows 11 Home"], { featured: true }),
  lap("everyday-laptop", "asus-vivobook-15-x1504za", "ASUS", "ASUS Vivobook 15 X1504ZA Core i5-1235U 8GB 512GB", 58500, "Core i5", "Core i5-1235U", "12th Gen", 8, "DDR4", "512GB SSD", "Integrated", 15.6, "1920x1080 (FHD)", 60, "IPS", ["Backlit Keyboard", "Fingerprint Reader", "Windows 11 Home"]),
  lap("everyday-laptop", "acer-aspire-lite-al15-52", "Acer", "Acer Aspire Lite AL15-52 Core i5-1235U 16GB 512GB", 57000, "Core i5", "Core i5-1235U", "12th Gen", 16, "DDR4", "512GB SSD", "Integrated", 15.6, "1920x1080 (FHD)", 60, "IPS", ["Windows 11 Home"]),
  lap("business-laptop", "hp-probook-450-g10", "HP", "HP ProBook 450 G10 Core i5-1335U 16GB 512GB", 89500, "Core i5", "Core i5-1335U", "13th Gen", 16, "DDR4", "512GB SSD", "Integrated", 15.6, "1920x1080 (FHD)", 60, "IPS", ["Fingerprint Reader", "Backlit Keyboard", "Windows 11 Pro"]),
  lap("business-laptop", "lenovo-thinkpad-e14-gen5", "Lenovo", "Lenovo ThinkPad E14 Gen 5 Ryzen 5 7530U 16GB 512GB", 84000, "Ryzen 5", "Ryzen 5 7530U", "Ryzen 7000", 16, "DDR4", "512GB SSD", "Integrated", 14, "1920x1200 (WUXGA)", 60, "IPS", ["Fingerprint Reader", "Backlit Keyboard", "Windows 11 Pro"]),

  /* ===== Keyboards ===== */
  kb("a4tech-krs-85", "A4Tech", "A4Tech KRS-85 USB Wired Keyboard", 650, "Membrane", "Membrane", "Full Size", ["Wired"], 1.5, ["Numpad", "Spill Resistant"]),
  kb("logitech-k120", "Logitech", "Logitech K120 USB Wired Keyboard", 850, "Membrane", "Membrane", "Full Size", ["Wired"], 1.5, ["Numpad", "Spill Resistant"]),
  kb("logitech-mk270", "Logitech", "Logitech MK270 Wireless Keyboard and Mouse Combo", 2550, "Wireless Combo", "Membrane", "Full Size", ["2.4G Wireless"], undefined, ["Numpad", "Multimedia Keys"]),
  kb("redragon-k552-kumara", "Redragon", "Redragon K552 KUMARA RGB Mechanical Keyboard (Blue Switch)", 4500, "Mechanical", "Blue", "TKL", ["Wired"], 1.8, ["RGB"], "Black"),
  kb("royal-kludge-rk61", "Royal Kludge", "Royal Kludge RK61 Hot-swappable 60% Mechanical Keyboard (Brown Switch)", 5600, "Mechanical", "Brown", "60%", ["Wired", "2.4G Wireless", "Bluetooth"], 1.5, ["RGB", "Hot-swappable"]),

  /* ===== Mice ===== */
  ms("logitech-b100", "Logitech", "Logitech B100 Wired USB Optical Mouse", 450, "Office", ["Wired"], 800, 1.8, []),
  ms("logitech-m171", "Logitech", "Logitech M171 Wireless Mouse", 1050, "Office", ["2.4G Wireless"], 1000, undefined, []),
  ms("fantech-x5s-zeus", "Fantech", "Fantech X5S Zeus RGB Gaming Mouse", 1350, "Gaming", ["Wired"], 4800, 1.8, ["RGB", "Programmable Buttons"]),
  ms("redragon-m711-cobra", "Redragon", "Redragon M711 Cobra RGB Gaming Mouse", 1950, "Gaming", ["Wired"], 10000, 1.8, ["RGB", "Programmable Buttons"]),
  ms("logitech-g102-lightsync", "Logitech", "Logitech G102 LIGHTSYNC Gaming Mouse", 2750, "Gaming", ["Wired"], 8000, 2, ["RGB", "Programmable Buttons"]),

  /* ===== Headphones ===== */
  hp("logitech-h111", "Logitech", "Logitech H111 Stereo Headset (3.5mm)", 1150, "Over-ear", ["3.5mm"], ["Microphone"]),
  hp("havit-h2002d", "Havit", "Havit H2002D Wired Gaming Headphone", 1350, "Over-ear", ["3.5mm"], ["Microphone"]),
  hp("fantech-hg11-captain", "Fantech", "Fantech HG11 Captain 7.1 USB RGB Gaming Headset", 1950, "Over-ear", ["USB"], ["Microphone", "7.1 Surround", "RGB"]),
  hp("redragon-h510-zeus-x", "Redragon", "Redragon H510 Zeus-X RGB 7.1 Gaming Headset", 4200, "Over-ear", ["USB"], ["Microphone", "7.1 Surround", "RGB"]),
  hp("sony-wh-ch520", "Sony", "Sony WH-CH520 Wireless Bluetooth Headphone", 5500, "On-ear", ["Bluetooth"], ["Microphone"]),
  hp("jbl-tune-520bt", "JBL", "JBL Tune 520BT Wireless On-Ear Headphone", 4900, "On-ear", ["Bluetooth", "3.5mm"], ["Microphone"]),

  /* ===== Speakers ===== */
  sp("logitech-z120", "Logitech", "Logitech Z120 2.0 USB Powered Speaker", 1300, "2.0", ["3.5mm AUX", "USB"], 1.2, ["USB Powered"]),
  sp("microlab-m-108", "Microlab", "Microlab M-108 2.1 Multimedia Speaker", 3650, "2.1", ["3.5mm AUX"], 11, ["Subwoofer"]),
  sp("fd-f550x", "F&D", "F&D F550X 2.1 Bluetooth Multimedia Speaker", 4300, "2.1", ["3.5mm AUX", "Bluetooth"], 18, ["Subwoofer", "Bluetooth", "Remote Control"]),
  sp("edifier-r1100", "Edifier", "Edifier R1100 2.0 Active Bookshelf Speaker", 8500, "2.0", ["3.5mm AUX"], 42, []),
  sp("edifier-r1280db", "Edifier", "Edifier R1280DB 2.0 Bluetooth Bookshelf Speaker", 12900, "2.0", ["3.5mm AUX", "Optical", "Bluetooth"], 42, ["Bluetooth", "Remote Control"]),

  /* ===== Mouse pads (prices from the Ryans listing) ===== */
  pad("pc-power-h1-red", "PC Power", "PC Power H-1 Black Mouse Pad (Red Border)", 100, "Small", "Standard", "Cloth", ["Stitched Edge"]),
  pad("pc-power-h1-blue", "PC Power", "PC Power H-1 Black Mouse Pad (Blue Border)", 100, "Small", "Standard", "Cloth", ["Stitched Edge"]),
  pad("havit-hv-mp837", "Havit", "Havit HV-MP837 Mouse Pad", 150, "Small", "Standard", "Cloth", ["Non-slip Base"]),
  pad("havit-mp838", "Havit", "Havit MP838 Mouse Pad", 150, "Small", "Standard", "Cloth", ["Non-slip Base"]),
  pad("havit-mp839", "Havit", "Havit MP839 Mousepad", 150, "Small", "Standard", "Cloth", ["Non-slip Base"]),
  pad("redragon-p032-large", "Redragon", "Redragon P032 Large Gaming Mouse Pad (800x300)", 1350, "Desk Mat (XL)", "Extended", "Cloth", ["Stitched Edge", "Non-slip Base"]),

  /* ===== Networking ===== */
  wifi("tp-link-tl-wn725n", "TP-Link", "TP-Link TL-WN725N 150Mbps Wireless N Nano USB Adapter", 700, "USB WiFi Adapter", "USB 2.0", "N150", []),
  wifi("tp-link-archer-t2u-nano", "TP-Link", "TP-Link Archer T2U Nano AC600 Wireless USB Adapter", 1300, "USB WiFi Adapter", "USB 2.0", "AC600", ["Dual Band"]),
  wifi("tp-link-archer-t3u", "TP-Link", "TP-Link Archer T3U AC1300 Mini Wireless USB Adapter", 2200, "USB WiFi Adapter", "USB 3.0", "AC1300", ["Dual Band"]),
  wifi("tp-link-archer-tx20e", "TP-Link", "TP-Link Archer TX20E AX3000 WiFi 6 PCIe Adapter with Bluetooth 5.2", 5400, "PCIe WiFi Card", "PCIe", "AX3000", ["Dual Band", "Bluetooth 5.x", "WiFi 6"]),
  wifi("tp-link-ub500", "TP-Link", "TP-Link UB500 Bluetooth 5.0 Nano USB Adapter", 750, "USB Bluetooth Adapter", "USB 2.0", "N150", ["Bluetooth 5.x"]),
  lan("tp-link-tg-3468", "TP-Link", "TP-Link TG-3468 Gigabit PCIe Network Adapter", 1050, "PCIe", "Gigabit (1G)", ["Low Profile Bracket"]),
  lan("ugreen-usb3-gigabit", "UGREEN", "UGREEN USB 3.0 to Gigabit Ethernet Adapter", 1450, "USB 3.0", "Gigabit (1G)"),
  rt("tenda-f3", "Tenda", "Tenda F3 300Mbps Wireless N Router", 1450, "Wi-Fi Router", "N300", "Fast Ethernet Ports", []),
  rt("tp-link-archer-c6", "TP-Link", "TP-Link Archer C6 AC1200 Gigabit Wi-Fi Router", 4300, "Wi-Fi Router", "AC1200", "Gigabit Ports", ["Dual Band", "MU-MIMO", "Gigabit LAN"]),
  rt("tp-link-archer-ax23", "TP-Link", "TP-Link Archer AX23 AX1800 Wi-Fi 6 Router", 5900, "Wi-Fi Router", "AX1800", "Gigabit Ports", ["WiFi 6", "Dual Band", "Gigabit LAN"]),

  /* ===== UPS ===== */
  ups("maxgreen-650va-offline", "MaxGreen", "MaxGreen 650VA Offline UPS", 2650, "Offline", 650, 360, []),
  ups("power-guard-850va", "Power Guard", "Power Guard 850VA Line Interactive UPS", 4200, "Line Interactive", 850, 480, ["AVR", "USB Port"]),
  ups("apc-bx1100li-ms", "APC", "APC Back-UPS BX1100LI-MS 1100VA / 550W UPS", 9800, "Line Interactive", 1100, 550, ["AVR", "USB Port"]),
  ups("apc-bx1600mi-ms", "APC", "APC Back-UPS BX1600MI-MS 1600VA / 900W UPS", 14900, "Line Interactive", 1600, 900, ["AVR", "USB Port"]),

  /* ===== Antivirus ===== */
  av("kaspersky-standard-1d", "Kaspersky", "Kaspersky Standard — 1 Device, 1 Year", 1150, "Antivirus", 1, "1 Year", ["Ransomware Protection", "Safe Browsing"]),
  av("kaspersky-plus-3d", "Kaspersky", "Kaspersky Plus — 3 Devices, 1 Year", 2400, "Internet Security", 3, "1 Year", ["Ransomware Protection", "Safe Browsing", "VPN"]),
  av("eset-nod32-1d", "ESET", "ESET NOD32 Antivirus — 1 Device, 1 Year", 1250, "Antivirus", 1, "1 Year", ["Ransomware Protection"]),
  av("bitdefender-total-5d", "Bitdefender", "Bitdefender Total Security — 5 Devices, 1 Year", 3200, "Total Security", 5, "1 Year", ["Ransomware Protection", "Safe Browsing", "Parental Control", "VPN"]),
];

/* ==========================================================================
   Pre-built PCs. Parts are product ids from the list above — the price is
   the live total of those parts (or `priceOverride` if you set one in Admin).
   ========================================================================== */
export const seedBuilds = [
  {
    id: "starter-study-pc",
    name: { en: "Starter Study & Office PC", bn: "স্টার্টার স্টাডি ও অফিস পিসি" },
    tagline: { en: "Quiet, quick and affordable for classes, office work and browsing.", bn: "ক্লাস, অফিসের কাজ ও ব্রাউজিংয়ের জন্য শান্ত, দ্রুত ও সাশ্রয়ী।" },
    useCase: "office", badge: "Budget pick", image: "", priceOverride: null, active: true,
    parts: [
      { id: "amd-ryzen-5-5600g", qty: 1 }, { id: "gigabyte-b450m-k", qty: 1 }, { id: "kingston-fury-beast-16gb-2x8-3200-ddr4", qty: 1 },
      { id: "lexar-ns100-512gb-sata", qty: 1 }, { id: "cooler-master-mwe-450-bronze-v2", qty: 1 }, { id: "cooler-master-masterbox-q300l", qty: 1 },
    ],
    highlights: [
      { en: "Built-in Radeon graphics — no graphics card needed", bn: "বিল্ট-ইন Radeon গ্রাফিক্স — আলাদা গ্রাফিক্স কার্ড লাগে না" },
      { en: "16GB dual-channel RAM — faster graphics and smoother multitasking", bn: "16GB dual-channel RAM — দ্রুত গ্রাফিক্স ও স্মুথ মাল্টিটাস্কিং" },
      { en: "Easy to upgrade later with a graphics card", bn: "পরে গ্রাফিক্স কার্ড যোগ করে সহজেই আপগ্রেড করা যায়" },
    ],
  },
  {
    id: "value-gamer-pc",
    name: { en: "Value 1080p Gamer", bn: "ভ্যালু 1080p গেমার" },
    tagline: { en: "Smooth 1080p gaming on a proven, upgrade-friendly AM4 platform.", bn: "পরীক্ষিত ও আপগ্রেড-বান্ধব AM4 প্ল্যাটফর্মে স্মুথ 1080p গেমিং।" },
    useCase: "gaming", badge: "Most popular", image: "", priceOverride: null, active: true,
    parts: [
      { id: "amd-ryzen-5-5600", qty: 1 }, { id: "gigabyte-b550m-h", qty: 1 }, { id: "kingston-fury-beast-16gb-2x8-3200-ddr4", qty: 1 },
      { id: "lexar-nm620-512gb", qty: 1 }, { id: "asus-dual-rtx-5050-8g", qty: 1 }, { id: "cooler-master-mwe-550-bronze-v2", qty: 1 }, { id: "deepcool-cc560-v2", qty: 1 },
    ],
    highlights: [
      { en: "RTX 5050 8GB for 1080p esports and AAA games", bn: "1080p ই-স্পোর্টস ও AAA গেমের জন্য RTX 5050 8GB" },
      { en: "Dual-channel 2×8GB RAM and NVMe SSD", bn: "dual-channel 2×8GB RAM ও NVMe SSD" },
      { en: "Tempered-glass case with ARGB fans", bn: "ARGB ফ্যানসহ টেম্পারড-গ্লাস কেস" },
    ],
  },
  {
    id: "performance-am5-pc",
    name: { en: "Performance AM5 Gaming & Creator", bn: "পারফরম্যান্স AM5 গেমিং ও ক্রিয়েটর" },
    tagline: { en: "A modern DDR5 platform with room to grow — strong for games and editing.", bn: "বাড়ার জায়গাসহ আধুনিক DDR5 প্ল্যাটফর্ম — গেমিং ও এডিটিংয়ে শক্তিশালী।" },
    useCase: "creator", badge: "Best performance", image: "", priceOverride: null, active: true,
    parts: [
      { id: "amd-ryzen-5-7600", qty: 1 }, { id: "msi-pro-a620m-e", qty: 1 }, { id: "teamgroup-t-force-vulcan-16gb-2x8-5600-ddr5", qty: 1 },
      { id: "lexar-nm620-1tb", qty: 1 }, { id: "asus-dual-rtx-5060-oc-8g", qty: 1 }, { id: "corsair-cv650", qty: 1 }, { id: "deepcool-cc560-v2", qty: 1 },
    ],
    highlights: [
      { en: "Ryzen 5 7600 on AM5 — long upgrade path", bn: "AM5-এ Ryzen 5 7600 — দীর্ঘমেয়াদি আপগ্রেড পথ" },
      { en: "RTX 5060 with DLSS for high-FPS gaming", bn: "হাই-এফপিএস গেমিংয়ের জন্য DLSS সহ RTX 5060" },
      { en: "1TB NVMe SSD and 650W PSU", bn: "1TB NVMe SSD ও 650W PSU" },
    ],
  },
];

/* ==========================================================================
   Offers. kind "discount" lowers prices automatically between the dates;
   kind "perk" is a banner only. These two are samples — edit or delete them
   in Admin → Offers.
   ========================================================================== */
export const seedOffers = [
  {
    id: "free-service-website-builds",
    kind: "perk", active: true, badge: "Free service",
    title: { en: "Service charge is free on PCs built from this website", bn: "ওয়েবসাইট থেকে বিল্ড করা পিসিতে সার্ভিস চার্জ ফ্রি" },
    subtitle: { en: "Pick parts in the PC Builder or choose a pre-built PC and we assemble and set it up at no service charge. Pre-orders accepted. Terms & conditions apply.", bn: "পিসি বিল্ডারে পার্টস বাছাই করুন বা প্রি-বিল্ট পিসি নিন — অ্যাসেম্বল ও সেটআপে কোনো সার্ভিস চার্জ নেই। প্রি-অর্ডার গ্রহণ করা হয়। শর্ত প্রযোজ্য।" },
    target: { categories: [], subs: [], brands: [], productIds: [] },
    startsAt: null, endsAt: null, link: "/pc-builder",
  },
  {
    id: "sample-cooling-deal",
    kind: "discount", type: "percent", value: 5, active: true, badge: "5% off",
    title: { en: "Cooling deal: 5% off CPU coolers and case fans", bn: "কুলিং ডিল: CPU কুলার ও কেস ফ্যানে 5% ছাড়" },
    subtitle: { en: "Sample offer — keep your build cool for less.", bn: "নমুনা অফার — কম খরচে বিল্ড ঠান্ডা রাখুন।" },
    target: { categories: [], subs: ["cpu-cooler", "casing-fan"], brands: [], productIds: [] },
    startsAt: "2026-10-10", endsAt: "2026-11-10", link: "/shop/components",
  },
];

/* ==========================================================================
   Store settings — contact details, the free-service promise and site notes.
   Everything here is editable in Admin → Store settings.
   ========================================================================== */
export const seedStore = {
  whatsapp: "8801948977199",
  whatsappMessage: "Hi Ovi's Fix, I need expert help choosing parts.",
  phone: "+880 1948-977199",
  altPhone: "+880 1845-093399",
  email: "contact.ovisfix@gmail.com",
  address: { en: "Barisur, Keraniganj, Dhaka", bn: "বারিসুর, কেরানীগঞ্জ, ঢাকা" },
  facebook: "https://www.facebook.com/ovisfix",
  instagram: "https://www.instagram.com/ovisfix",
  youtube: "https://www.youtube.com/@OvisFix",
  linkedin: "",
  freeServiceNote: { en: "Build your PC from our website and the service charge is free.", bn: "আমাদের ওয়েবসাইট থেকে পিসি বিল্ড করলে সার্ভিস চার্জ ফ্রি।" },
  preorderNote: { en: "Pre-orders are also accepted.", bn: "প্রি-অর্ডারও গ্রহণ করা হয়।" },
  tcNote: { en: "Terms & conditions apply.", bn: "শর্ত প্রযোজ্য।" },
  priceNote: { en: "Prices are in BDT and can change with the market. We confirm price and availability with you before an order is final.", bn: "দাম টাকায় এবং বাজারের সাথে পরিবর্তন হতে পারে। অর্ডার চূড়ান্ত করার আগে আমরা দাম ও প্রাপ্যতা আপনাকে নিশ্চিত করি।" },
  heroTitle: { en: "Build it. Buy it. Fix it.", bn: "বিল্ড করুন। কিনুন। ঠিক করুন।" },
  heroSub: { en: "Computer parts, pre-built PCs and honest repair service from one shop in Keraniganj, Dhaka.", bn: "কেরানীগঞ্জ, ঢাকার এক দোকান থেকেই কম্পিউটার পার্টস, প্রি-বিল্ট পিসি ও সৎ রিপেয়ার সার্ভিস।" },
};
