/* ==========================================================================
   Ovi's Fix — content data (bilingual: en = English, bn = Bangla)
   Edit this file to change prices, copy, or images. No build step needed —
   just save and refresh.
   ========================================================================== */

// ---- Service catalogue -----------------------------------------------------
// This is the FALLBACK dataset — what the site shows if the admin panel's
// live data (fetched from /api/services, backed by Upstash) isn't reachable
// or hasn't been set up yet. See js/render.js's loadServices(). Edit this
// array to change the defaults; edit live data via /admin.html once Upstash
// is configured (see README.md).
// `unit` is what prints after the price, e.g. "500 / per visit"
export const defaultServices = [
  {
    id: "diagnostic-report",
    icon: "report",
    free: true,
    price: 0,
    unit: { en: "per visit", bn: "প্রতি ভিজিট" },
    title: { en: "System Diagnostic Report", bn: "সিস্টেম ডায়াগনস্টিক রিপোর্ট" },
    desc: {
      en: "A full check-up of your PC or laptop for software glitches and hardware faults, with a clear written report — on us.",
      bn: "আপনার পিসি বা ল্যাপটপের সফটওয়্যার ও হার্ডওয়্যার সমস্যার সম্পূর্ণ পরীক্ষা, স্পষ্ট লিখিত রিপোর্টসহ — সম্পূর্ণ বিনামূল্যে।",
    },
  },
  {
    id: "computer-diagnostics",
    image: "diagnostics-maintenance.jpg",
    price: 150,
    unit: { en: "per service", bn: "প্রতি সার্ভিস" },
    title: { en: "Computer Diagnostics", bn: "কম্পিউটার ডায়াগনস্টিকস" },
    desc: {
      en: "A focused hardware and software health check, with a proper report delivered straight to you.",
      bn: "হার্ডওয়্যার ও সফটওয়্যারের সুনির্দিষ্ট স্বাস্থ্য পরীক্ষা, যথাযথ রিপোর্টসহ।",
    },
  },
  {
    id: "data-backup",
    image: "data-backup.jpg",
    price: 300,
    unit: { en: "per service", bn: "প্রতি সার্ভিস" },
    title: { en: "Data Backup (Full)", bn: "ডেটা ব্যাকআপ (সম্পূর্ণ)" },
    desc: {
      en: "A complete backup of your files before any repair or reinstallation, so nothing is ever lost.",
      bn: "যেকোনো মেরামত বা রিইনস্টলেশনের আগে আপনার সব ফাইলের সম্পূর্ণ ব্যাকআপ, যাতে কিছুই হারিয়ে না যায়।",
    },
  },
  {
    id: "malware-removal",
    image: "malware-removal.jpg",
    price: 500,
    unit: { en: "per service", bn: "প্রতি সার্ভিস" },
    title: { en: "Virus & Malware Removal", bn: "ভাইরাস ও ম্যালওয়্যার অপসারণ" },
    desc: {
      en: "Thorough removal of viruses, malware, and unwanted software that's slowing your machine down.",
      bn: "ভাইরাস, ম্যালওয়্যার ও অবাঞ্ছিত সফটওয়্যার সম্পূর্ণরূপে অপসারণ করা হয়।",
    },
  },
  {
    id: "driver-installation",
    image: "driver-installation.jpg",
    price: 300,
    unit: { en: "per service", bn: "প্রতি সার্ভিস" },
    title: { en: "Driver Installation", bn: "ড্রাইভার ইনস্টলেশন" },
    desc: {
      en: "Installation and configuration of the correct hardware drivers for your exact system.",
      bn: "আপনার সিস্টেমের জন্য সঠিক হার্ডওয়্যার ড্রাইভার ইনস্টলেশন ও কনফিগারেশন।",
    },
  },
  {
    id: "windows-installation",
    image: "windows-installation.png",
    price: 300,
    unit: { en: "per service", bn: "প্রতি সার্ভিস" },
    title: { en: "Windows Installation", bn: "উইন্ডোজ ইনস্টলেশন" },
    desc: {
      en: "Clean installation of Windows XP through 11, complete with all the drivers it needs to run smoothly.",
      bn: "উইন্ডোজ XP থেকে ১১ পর্যন্ত ক্লিন ইনস্টলেশন, প্রয়োজনীয় সব ড্রাইভারসহ।",
    },
  },
  {
    id: "win10-oem",
    image: "win10-oem.png",
    price: 450,
    unit: { en: "per license", bn: "প্রতি লাইসেন্স" },
    title: { en: "Genuine Windows 10 (OEM)", bn: "জেনুইন উইন্ডোজ ১০ (OEM)" },
    desc: {
      en: "Activation of a genuine Windows 10 OEM license for long-term stability and updates.",
      bn: "দীর্ঘমেয়াদী স্থিতিশীলতা ও আপডেটের জন্য জেনুইন উইন্ডোজ ১০ (OEM) লাইসেন্স অ্যাক্টিভেশন।",
    },
  },
  {
    id: "win11-oem",
    image: "win11-oem.jpg",
    price: 500,
    unit: { en: "per license", bn: "প্রতি লাইসেন্স" },
    title: { en: "Genuine Windows 11 (OEM)", bn: "জেনুইন উইন্ডোজ ১১ (OEM)" },
    desc: {
      en: "Activation of a genuine Windows 11 OEM license, done right and built to last.",
      bn: "জেনুইন উইন্ডোজ ১১ (OEM) লাইসেন্স সঠিক ও স্থায়ীভাবে অ্যাক্টিভেশন।",
    },
  },
  {
    id: "ms-office",
    image: "ms-office.jpg",
    price: 100,
    unit: { en: "per service", bn: "প্রতি সার্ভিস" },
    title: { en: "Microsoft Office Setup & Activation", bn: "মাইক্রোসফট অফিস সেটআপ ও অ্যাক্টিভেশন" },
    desc: {
      en: "Installation and activation support for Microsoft Office on your device.",
      bn: "আপনার ডিভাইসে মাইক্রোসফট অফিস ইনস্টলেশন ও অ্যাক্টিভেশন সহায়তা।",
    },
  },
  {
    id: "adobe-apps",
    image: "adobe-apps.jpg",
    price: 300,
    unit: { en: "per service", bn: "প্রতি সার্ভিস" },
    title: { en: "Adobe Creative Cloud Setup", bn: "Adobe Creative Cloud সেটআপ" },
    desc: {
      en: "Installation and setup support for your selected Adobe Creative Cloud applications.",
      bn: "আপনার পছন্দের Adobe Creative Cloud অ্যাপ্লিকেশনের ইনস্টলেশন ও সেটআপ সহায়তা।",
    },
  },
  {
    id: "dual-boot",
    image: "dual-boot.png",
    price: 500,
    unit: { en: "per service", bn: "প্রতি সার্ভিস" },
    title: { en: "Dual Boot Setup", bn: "ডুয়াল বুট সেটআপ" },
    desc: {
      en: "Windows and Linux, set up side by side — pick whichever you need right at startup.",
      bn: "উইন্ডোজ ও লিনাক্স পাশাপাশি সেটআপ — স্টার্টআপেই যেকোনোটি বেছে নেওয়ার সুবিধা।",
    },
  },
  {
    id: "bios-update",
    image: "bios.webp",
    price: 300,
    unit: { en: "per service", bn: "প্রতি সার্ভিস" },
    title: { en: "BIOS / Firmware Update", bn: "BIOS / ফার্মওয়্যার আপডেট" },
    desc: {
      en: "Careful BIOS/UEFI or firmware updates for supported laptops and desktops.",
      bn: "সাপোর্টেড ল্যাপটপ ও ডেস্কটপের জন্য যত্নসহকারে BIOS/UEFI বা ফার্মওয়্যার আপডেট।",
    },
  },
  {
    id: "laptop-maintenance",
    image: "diagnostics-maintenance.jpg",
    price: 500,
    unit: { en: "per service", bn: "প্রতি সার্ভিস" },
    title: { en: "Laptop / Desktop Maintenance", bn: "ল্যাপটপ / ডেস্কটপ রক্ষণাবেক্ষণ" },
    desc: {
      en: "Internal cleaning and routine maintenance that keeps dust and heat under control.",
      bn: "ধুলা ও অতিরিক্ত তাপ নিয়ন্ত্রণে রাখতে ভেতরের পরিষ্কার ও নিয়মিত রক্ষণাবেক্ষণ।",
    },
  },
  {
    id: "performance-optimization",
    image: "performance-optimization.png",
    price: 500,
    unit: { en: "per service", bn: "প্রতি সার্ভিস" },
    title: { en: "Performance Optimization", bn: "পারফরম্যান্স অপ্টিমাইজেশন" },
    desc: {
      en: "Personalized software tuning to boost your computer's speed by up to 10x.",
      bn: "আপনার কম্পিউটারের গতি ১০ গুণ পর্যন্ত বাড়াতে ব্যক্তিগতকৃত সফটওয়্যার টিউনিং।",
    },
  },
  {
    id: "system-performance-upgrade",
    image: "system-performance-upgrade.jpg",
    price: 2000,
    unit: { en: "per service", bn: "প্রতি সার্ভিস" },
    title: { en: "System Performance Upgrade", bn: "সিস্টেম পারফরম্যান্স আপগ্রেড" },
    desc: {
      en: "SSD migration, RAM upgrade, and complete system tuning for a noticeably faster machine.",
      bn: "SSD মাইগ্রেশন, র‍্যাম আপগ্রেড ও সম্পূর্ণ সিস্টেম টিউনিং — লক্ষণীয়ভাবে দ্রুতগতির কম্পিউটারের জন্য।",
    },
  },
  {
    id: "on-site-service",
    image: "on-site-servicing.avif",
    price: 500,
    unit: { en: "per visit", bn: "প্রতি ভিজিট" },
    title: { en: "On-Site Computer Service", bn: "অন-সাইট কম্পিউটার সার্ভিস" },
    desc: {
      en: "Our technician comes to your home or office — nothing to unplug, pack, or carry.",
      bn: "আমাদের টেকনিশিয়ান সরাসরি আপনার বাসা বা অফিসে চলে আসবে — কিছু খুলে বহন করার দরকার নেই।",
    },
  },
  {
    id: "technical-consultation",
    image: "technical-consultation.jpg",
    price: 500,
    unit: { en: "per hour", bn: "প্রতি ঘণ্টা" },
    title: { en: "Technical Consultation", bn: "টেকনিক্যাল পরামর্শ" },
    desc: {
      en: "One-on-one advice and recommendations for any IT decision or problem you're facing.",
      bn: "আপনার যেকোনো আইটি সমস্যা বা সিদ্ধান্তের জন্য ব্যক্তিগত পরামর্শ ও সুপারিশ।",
    },
  },
  {
    id: "custom-pc-build",
    image: "custom-pc-build.webp",
    price: 3000,
    unit: { en: "per build", bn: "প্রতি বিল্ড" },
    title: { en: "Custom PC Build", bn: "কাস্টম পিসি বিল্ড" },
    desc: {
      en: "A complete quotation and hands-on build of a new custom PC, matched to your needs and budget.",
      bn: "আপনার প্রয়োজন ও বাজেট অনুযায়ী নতুন কাস্টম পিসির সম্পূর্ণ কোটেশন ও বিল্ড।",
    },
    featured: true,
  },
];

// ---- Market comparison (illustrative) --------------------------------------
// NOTE: "market" figures are rounded estimates for comparison purposes, not
// verified competitor quotes. Swap these for real researched numbers whenever
// you have them — see the README for how this section works.
export const comparison = [
  { id: "on-site-service", market: 900 },
  { id: "malware-removal", market: 800 },
  { id: "system-performance-upgrade", market: 3200 },
  { id: "data-backup", market: 500 },
  { id: "custom-pc-build", market: 5000 },
  { id: "windows-installation", market: 500 },
  { id: "driver-installation", market: 450 },
  { id: "laptop-maintenance", market: 800 },
];

// ---- Why choose us -----------------------------------------------------
export const whyUs = [
  {
    icon: "cpu",
    title: { en: "Engineering-Trained Technician", bn: "ইঞ্জিনিয়ারিং-প্রশিক্ষিত টেকনিশিয়ান" },
    desc: {
      en: "Every repair is handled with the precision of an electrical & electronic engineering background.",
      bn: "প্রতিটি মেরামত ইলেকট্রিক্যাল ও ইলেকট্রনিক ইঞ্জিনিয়ারিং জ্ঞানের নির্ভুলতায় করা হয়।",
    },
  },
  {
    icon: "tag",
    title: { en: "No Hidden Charges", bn: "কোনো লুকানো খরচ নেই" },
    desc: {
      en: "The price you see is the price you pay — quoted upfront, every single time.",
      bn: "যে দাম আপনি দেখেন, সেটাই আপনি পরিশোধ করবেন — প্রতিবার আগে থেকেই জানানো হয়।",
    },
  },
  {
    icon: "home",
    title: { en: "We Come To You", bn: "আমরা আপনার কাছে আসি" },
    desc: {
      en: "On-site visits across Keraniganj and Dhaka, so your PC never has to leave home.",
      bn: "কেরাণীগঞ্জ ও ঢাকা জুড়ে অন-সাইট ভিজিট, আপনার পিসিকে বাসা থেকে বের করতে হয় না।",
    },
  },
  {
    icon: "shield",
    title: { en: "7-Day Service Warranty", bn: "৭ দিনের সার্ভিস ওয়ারেন্টি" },
    desc: {
      en: "Every repair is covered for 7 days against the same issue, at no extra charge.",
      bn: "একই সমস্যার জন্য প্রতিটি মেরামতে ৭ দিনের বিনামূল্যে কভারেজ থাকে।",
    },
  },
  {
    icon: "database",
    title: { en: "Data-Safe Process", bn: "ডেটা-নিরাপদ প্রক্রিয়া" },
    desc: {
      en: "We back up what matters before we touch anything, so nothing is ever lost along the way.",
      bn: "কিছু স্পর্শ করার আগে আমরা গুরুত্বপূর্ণ ফাইল ব্যাকআপ করি, যাতে কিছুই না হারায়।",
    },
  },
];

// ---- FAQ -----------------------------------------------------------------
export const faq = [
  {
    q: { en: "Do you really come to my home?", bn: "আপনারা কি সত্যিই আমার বাসায় আসেন?" },
    a: {
      en: "Yes. On-site service is available across Keraniganj and greater Dhaka for a flat visit fee of BDT 500.",
      bn: "হ্যাঁ। কেরাণীগঞ্জ ও বৃহত্তর ঢাকা জুড়ে মাত্র ৫০০ টাকা নির্ধারিত ভিজিট ফি-তে অন-সাইট সার্ভিস পাওয়া যায়।",
    },
  },
  {
    q: { en: "What happens to my data during a repair?", bn: "মেরামতের সময় আমার ডেটার কী হয়?" },
    a: {
      en: "We always recommend, and can perform, a full backup before starting any work — so your files stay safe.",
      bn: "কাজ শুরুর আগে আমরা সবসময় সম্পূর্ণ ব্যাকআপের পরামর্শ দিই এবং করে দিতে পারি, যাতে আপনার ফাইল নিরাপদ থাকে।",
    },
  },
  {
    q: { en: "Is there a warranty on repairs?", bn: "মেরামতের উপর কি ওয়ারেন্টি আছে?" },
    a: {
      en: "Every repair comes with a 7-day warranty for the same problem. New or unrelated issues aren't covered under it.",
      bn: "প্রতিটি মেরামতে একই সমস্যার জন্য ৭ দিনের ওয়ারেন্টি থাকে। নতুন বা ভিন্ন সমস্যা এই ওয়ারেন্টির আওতায় পড়ে না।",
    },
  },
  {
    q: { en: "Do you install genuine software?", bn: "আপনারা কি জেনুইন সফটওয়্যার ইনস্টল করেন?" },
    a: {
      en: "Yes — we offer genuine Windows 10/11 OEM activation, and help install and activate licenses you already own.",
      bn: "হ্যাঁ — আমরা জেনুইন উইন্ডোজ ১০/১১ (OEM) অ্যাক্টিভেশন অফার করি, এবং আপনার নিজের কেনা লাইসেন্স ইনস্টল ও অ্যাক্টিভেট করতে সহায়তা করি।",
    },
  },
  {
    q: { en: "How long does a typical repair take?", bn: "একটি সাধারণ মেরামতে কত সময় লাগে?" },
    a: {
      en: "Most software services — driver installs, OS installs, malware removal — are done same-day. Hardware upgrades and custom builds may take 1–2 days depending on parts availability.",
      bn: "বেশিরভাগ সফটওয়্যার সার্ভিস (ড্রাইভার ইনস্টল, OS ইনস্টল, ম্যালওয়্যার অপসারণ) একই দিনে সম্পন্ন হয়। হার্ডওয়্যার আপগ্রেড ও কাস্টম বিল্ডে যন্ত্রাংশের প্রাপ্যতার উপর নির্ভর করে ১–২ দিন লাগতে পারে।",
    },
  },
  {
    q: { en: "How do I pay?", bn: "আমি কীভাবে পেমেন্ট করব?" },
    a: {
      en: "Payment is due once the service is completed, unless we've agreed on different terms in advance.",
      bn: "অন্য কোনো শর্তে আগে থেকে সম্মত না হলে, সার্ভিস সম্পন্ন হওয়ার পরই পেমেন্ট দিতে হবে।",
    },
  },
  {
    q: { en: "Which areas do you serve?", bn: "আপনারা কোন কোন এলাকায় সেবা দেন?" },
    a: {
      en: "We're based in Keraniganj and serve customers across Dhaka. On-site availability may vary a little by location.",
      bn: "আমরা কেরাণীগঞ্জ-ভিত্তিক এবং ঢাকা জুড়ে গ্রাহকদের সেবা দিই। এলাকাভেদে অন-সাইট সুবিধা কিছুটা ভিন্ন হতে পারে।",
    },
  },
];

// ---- Terms & Conditions ---------------------------------------------------
export const terms = [
  {
    en: "Please back up your important files before giving us your device.",
    bn: "আপনার ডিভাইস আমাদের হাতে দেওয়ার আগে দয়া করে গুরুত্বপূর্ণ ফাইলের ব্যাকআপ নিন।",
  },
  {
    en: "We are not responsible for any loss of data or problems caused by existing hardware issues.",
    bn: "আগে থেকে থাকা হার্ডওয়্যার সমস্যার কারণে সৃষ্ট কোনো ডেটা হারানো বা সমস্যার জন্য আমরা দায়ী নই।",
  },
  {
    en: "If you ask us to install software, you are responsible for having the right to use it.",
    bn: "আপনি যদি আমাদের কোনো সফটওয়্যার ইনস্টল করতে বলেন, সেটি ব্যবহারের অধিকার থাকার দায়িত্ব আপনার।",
  },
  {
    en: "BIOS or firmware updates and recovery carry a small risk of failure. While we take every precaution, Ovi's Fix is not responsible for issues caused by power loss, faulty hardware, or manufacturer-related problems during the process.",
    bn: "BIOS বা ফার্মওয়্যার আপডেট এবং রিকভারিতে ব্যর্থ হওয়ার সামান্য ঝুঁকি থাকে। আমরা যথাসাধ্য সতর্কতা অবলম্বন করলেও, প্রক্রিয়ার সময় বিদ্যুৎ বিভ্রাট, ত্রুটিপূর্ণ হার্ডওয়্যার বা প্রস্তুতকারক-সংক্রান্ত সমস্যার জন্য Ovi's Fix দায়ী নয়।",
  },
  {
    en: "Our repair work comes with a 7-day service warranty for the same problem only. New or different problems are not covered.",
    bn: "আমাদের মেরামত কাজে শুধুমাত্র একই সমস্যার জন্য ৭ দিনের সার্ভিস ওয়ারেন্টি প্রযোজ্য। নতুন বা ভিন্ন সমস্যা এর আওতাভুক্ত নয়।",
  },
  {
    en: "Payment is due when the service is completed, unless we agree otherwise.",
    bn: "অন্যথায় সম্মত না হলে, সার্ভিস সম্পন্ন হওয়ার সাথে সাথেই পেমেন্ট পরিশোধযোগ্য।",
  },
];

// ---- PC Configurator preview (coming soon) ---------------------------------
export const configurator = {
  modes: [
    {
      id: "expert",
      image: "pc-parts-explode.jpg",
      title: {
        en: "Expert Mode: Full Creative Control",
        bn: "এক্সপার্ট মোড: সম্পূর্ণ সৃজনশীল নিয়ন্ত্রণ",
      },
      intro: {
        en: "If you are confident with PC hardware and want complete control over your setup, Expert Mode is made for you. This option is ideal for gamers, streamers and creators who know exactly what they need and want to build a system that matches their performance goals and personal style. With Expert Mode, you are not just selecting a PC — you are designing a high performance machine from the ground up.",
        bn: "আপনি যদি পিসি হার্ডওয়্যারে আত্মবিশ্বাসী হন এবং নিজের সেটআপের উপর সম্পূর্ণ নিয়ন্ত্রণ চান, তাহলে এক্সপার্ট মোড আপনার জন্যই তৈরি। এই অপশনটি গেমার, স্ট্রিমার ও ক্রিয়েটরদের জন্য আদর্শ, যারা ঠিক জানেন তাদের কী প্রয়োজন এবং নিজের পারফরম্যান্স লক্ষ্য ও ব্যক্তিগত স্টাইলের সাথে মিলিয়ে একটি সিস্টেম তৈরি করতে চান। এক্সপার্ট মোডে আপনি শুধু একটি পিসি বেছে নিচ্ছেন না — আপনি শুরু থেকে একটি হাই-পারফরম্যান্স মেশিন ডিজাইন করছেন।",
      },
      steps: [
        {
          en: "Start from scratch with a blank canvas.",
          bn: "একদম শূন্য থেকে শুরু করুন, ফাঁকা ক্যানভাস দিয়ে।",
        },
        {
          en: "Choose every part yourself: case, CPU, GPU, storage, cooling, memory, and more.",
          bn: "প্রতিটি পার্টস নিজে বেছে নিন: কেসিং, CPU, GPU, স্টোরেজ, কুলিং, মেমরি এবং আরও অনেক কিছু।",
        },
        {
          en: "Watch your build take shape in real time with a live summary.",
          bn: "লাইভ সামারির মাধ্যমে রিয়েল-টাইমে আপনার বিল্ড তৈরি হতে দেখুন।",
        },
        {
          en: "Built-in compatibility checks keep everything stress-free and performance-ready.",
          bn: "বিল্ট-ইন কম্প্যাটিবিলিটি চেক সবকিছু ঝামেলাহীন ও পারফরম্যান্সের জন্য প্রস্তুত রাখে।",
        },
      ],
      closing: {
        en: "Whether you want an ultra-responsive battle station for dropping into Warzone or a powerhouse for Microsoft's Flight Simulator, the configurator puts you fully in control.",
        bn: "Warzone-এ নামার জন্য একটি আলট্রা-রেসপন্সিভ ব্যাটল স্টেশন হোক, বা Microsoft-এর Flight Simulator-এর জন্য একটি পাওয়ারহাউস — কনফিগারেটর আপনাকে সম্পূর্ণ নিয়ন্ত্রণে রাখবে।",
      },
    },
    {
      id: "preconfigured",
      image: "gaming-pc-configurator.jpg",
      title: {
        en: "Pre-configured Mode: Expertly Curated Starting Points",
        bn: "প্রি-কনফিগার্ড মোড: বিশেষজ্ঞ-নির্বাচিত শুরুর পয়েন্ট",
      },
      intro: {
        en: "If you are new to PC building or simply want a quick and reliable way to get started, Pre-configured Mode is the ideal choice. This mode is designed to guide you through the process with ease, while still giving you the freedom to personalise your setup. With Pre-configured Mode, you begin with a professionally curated base system that is already optimised for performance and compatibility. These starting builds are inspired by our most popular configurations and cover a wide range of gaming styles, budgets and technical needs.",
        bn: "আপনি যদি পিসি বিল্ডিংয়ে নতুন হন বা শুরু করার জন্য একটি দ্রুত ও নির্ভরযোগ্য উপায় চান, তাহলে প্রি-কনফিগার্ড মোড আদর্শ পছন্দ। এই মোডটি আপনাকে সহজে পুরো প্রক্রিয়ার মধ্য দিয়ে গাইড করার জন্য তৈরি, একই সাথে নিজের সেটআপ নিজের মতো করে সাজানোর স্বাধীনতাও দেয়। প্রি-কনফিগার্ড মোডে আপনি শুরু করবেন একটি পেশাদারভাবে নির্বাচিত বেস সিস্টেম দিয়ে, যা ইতিমধ্যেই পারফরম্যান্স ও কম্প্যাটিবিলিটির জন্য অপ্টিমাইজড। এই শুরুর বিল্ডগুলো আমাদের সবচেয়ে জনপ্রিয় কনফিগারেশন থেকে অনুপ্রাণিত এবং বিভিন্ন গেমিং স্টাইল, বাজেট ও টেকনিক্যাল প্রয়োজন কভার করে।",
      },
      steps: [
        {
          en: "Pre-assembled base systems tailored to different gaming experiences and budgets.",
          bn: "বিভিন্ন গেমিং অভিজ্ঞতা ও বাজেট অনুযায়ী তৈরি প্রি-অ্যাসেম্বলড বেস সিস্টেম।",
        },
        {
          en: "These builds are inspired by our most popular systems, from entry-level rigs to NVIDIA RTX 50 Series builds.",
          bn: "এই বিল্ডগুলো আমাদের সবচেয়ে জনপ্রিয় সিস্টেম থেকে অনুপ্রাণিত, এন্ট্রি-লেভেল রিগ থেকে শুরু করে NVIDIA RTX 50 সিরিজ বিল্ড পর্যন্ত।",
        },
        {
          en: "Clear explanations that remove technical jargon, so you understand what you're choosing and why.",
          bn: "স্পষ্ট ব্যাখ্যা যা টেকনিক্যাল জার্গন দূর করে, যাতে আপনি বুঝতে পারেন কী বেছে নিচ্ছেন এবং কেন।",
        },
        {
          en: "Optimised compatibility, so you don't need to worry about bottlenecks or mismatched hardware.",
          bn: "অপ্টিমাইজড কম্প্যাটিবিলিটি, তাই বটলনেক বা অমিল হার্ডওয়্যার নিয়ে চিন্তা করতে হবে না।",
        },
      ],
      closing: {
        en: "No matter if you are building your first gaming PC or upgrading from a console, Pre-configured Mode makes the process smooth and stress free. You get a strong foundation to build on, with the flexibility to make it your own.",
        bn: "আপনি প্রথমবার গেমিং পিসি বানাচ্ছেন হোক বা কনসোল থেকে আপগ্রেড করছেন — প্রি-কনফিগার্ড মোড পুরো প্রক্রিয়াটি সহজ ও ঝামেলাহীন করে তোলে। আপনি পাবেন একটি শক্ত ভিত্তি, যার উপর নিজের মতো করে গড়ে তোলার স্বাধীনতা থাকবে।",
      },
    },
  ],
};

// ---- Hero banner image ------------------------------------------------
// FALLBACK — same pattern as defaultServices/defaultTicker above. Live
// data is admin-uploaded at /admin.html (with strict resolution
// validation) and fetched from /api/hero.
export const defaultHeroImage = "images/hero-banner.webp";

// ---- Hero ticker lines ------------------------------------------------
// FALLBACK dataset — same pattern as defaultServices above. Live data is
// admin-editable at /admin.html and fetched from /api/ticker.
export const defaultTicker = [
  { en: "Custom PC Build — From ৳3,000", bn: "কাস্টম পিসি বিল্ড — ৳৩,০০০ থেকে শুরু" },
  { en: "7-Day Warranty on Every Repair", bn: "প্রতিটি মেরামতে ৭ দিনের ওয়ারেন্টি" },
  { en: "Free Diagnostic Report, Every Visit", bn: "প্রতি ভিজিটে ফ্রি ডায়াগনস্টিক রিপোর্ট" },
  { en: "Home & On-Site Service in Dhaka", bn: "ঢাকায় হোম ও অন-সাইট সার্ভিস" },
];

// ---- Trust stats strip (hero) ---------------------------------------------
export const stats = [
  { count: 18, suffix: "", icon: "cpu", label: { en: "services offered", bn: "সার্ভিস অফার করা হয়" } },
  { free: true, icon: "tag", label: { en: "cost diagnostic report", bn: "খরচে ডায়াগনস্টিক রিপোর্ট" } },
  { count: 7, suffix: "", icon: "shield", label: { en: "day service warranty", bn: "দিনের সার্ভিস ওয়ারেন্টি" } },
  { count: 100, suffix: "%", icon: "home", label: { en: "on-site in Dhaka", bn: "অন-সাইট সেবা ঢাকায়" } },
];

// ---- Site-wide appearance settings (fonts / colors / background / glass) --
// FALLBACK dataset — same "bundled default, admin-overridable" pattern as
// defaultServices/defaultTicker/defaultHeroImage above. Live data is
// admin-editable at /admin.html (Appearance tab) and fetched from
// /api/settings. Mirrors the shape of DEFAULT_SETTINGS in
// lib/settings-store.js — keep the two in sync if this shape changes.
export const defaultSiteSettings = {
  fonts: {
    heading: "Montserrat",
    body: "Montserrat",
    customFonts: [],
  },
  colors: {
    light: { accent: "#e4342f", accent2: "#2f6fed", heading: "#0b1b33", body: "#2c3546" },
    dark: { accent: "#ff5d57", accent2: "#2f6fed", heading: "#eef1f8", body: "#ffffff" },
  },
  background: {
    type: "default",
    solid: "#f6f5f1",
    gradientFrom: "#0b1b33",
    gradientTo: "#2f6fed",
    gradientAngle: 135,
    image: null,
  },
  glass: {
    light: { blur: 14, tint: "clear" },
    dark: { blur: 14, tint: "clear" },
  },
};
