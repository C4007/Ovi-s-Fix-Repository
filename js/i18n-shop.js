/* ==========================================================================
   Ovi's Fix — i18n-shop.js
   English + Bangla text for the shop pages. It adds to the dictionaries in
   translations.js, so the same data-i18n / T("a.b") lookups work everywhere.
   Product names and technical values (DDR5, AM5, 16 GB…) stay in English,
   as is normal in Bangladesh computer shops.
   ========================================================================== */

import { translations } from "./translations.js";

const merge = (lang, extra) => {
  for (const [group, values] of Object.entries(extra)) {
    translations[lang][group] = { ...(translations[lang][group] || {}), ...values };
  }
};

merge("en", {
  nav: { shop: "Shop", builder: "PC Builder", builds: "Pre-built PCs", offers: "Offers", service: "Service", cart: "Cart", priceList: "Stock & price list" },
  footer: { company: "Company" },
  shop: {
    title: "Shop", lead: "Computer parts, laptops, monitors and accessories — with honest prices and expert help.",
    viewAll: "View all", popular: "Popular picks", search: "Search", searchAll: "Search all products…", searchPlaceholder: "Search in this list…",
    productsCount: "{n} products", promiseLabel: "Free service charge on PCs built from this website", serviceCharge: "service charge",
    askExpert: "Ask an expert", addToCart: "Add to cart", preorder: "Pre-order", outOfStock: "Out of stock", upcoming: "Up coming",
    unavailable: "This item can't be ordered right now.", addedToCart: "Added to cart", viewCart: "View cart", callForPrice: "Call for price",
    filters: "Filters", clearAll: "Clear all", showResults: "Show {n} results", results: "{n} products found", sortBy: "Sort by",
    sort: { featured: "Featured", "price-asc": "Price: low to high", "price-desc": "Price: high to low", newest: "Newest", discount: "Biggest discount" },
    all: "All", availability: "Availability", price: "Price", min: "Min", max: "Max", brand: "Brand",
    showMore: "Show {n} more", showLess: "Show less", noResults: "No products match your filters",
    noResultsHint: "Try removing a filter or searching with different words.", chooseTypeForFilters: "Pick a type above to see more filters.",
    compatOnly: "Show only parts that fit my build", hiddenIncompatible: "{n} hidden", notCompatible: "Not compatible",
    onSale: "On sale", offer: "Offer", prev: "Previous", next: "Next", pagination: "Pages", view: "View", viewGrid: "Grid view", viewList: "List view",
    product: "Product", category: "Category", close: "Close",
  },
  home: {
    metaTitle: "Ovi's Fix — Computer parts, PC builder & repair in Dhaka",
    metaDesc: "Build your PC online with free service charge, buy computer parts and pre-built PCs, or book computer repair in Keraniganj, Dhaka.",
    doorShop: "Shop parts & PCs", doorShopSub: "Components, laptops, pre-built PCs", doorService: "Book a repair", doorServiceSub: "Diagnostics, repair, setup",
    sheetLabel: "Example build sheet", sheetTitle: "Build sheet", seeBuilds: "See all pre-built PCs",
    categoriesTitle: "Shop by category",
    builderTitle: "Build your own PC",
    builderLead: "Pick parts one by one. The builder checks that they fit, estimates the power you need and shows whether the CPU and graphics card suit each other.",
    builderPoint1: "Fit check for socket, RAM type, case size and more", builderPoint2: "Estimated wattage and the power supply size to buy", builderPoint3: "CPU and graphics card balance check",
    openBuilder: "Open PC Builder",
    buildsTitle: "Pre-built PCs", buildsLead: "Ready-made, budget-friendly builds. Buy them as they are or change any part in the PC Builder.",
    offersTitle: "Offers & discounts",
    servicesTitle: "Repair & IT service", servicesLead: "Home and on-site computer repair, diagnostics and upgrades across Keraniganj and Dhaka.",
    allServices: "All services", free: "Free", fromPrice: "From {price}",
    stepsTitle: "How it works",
    step1: "Pick your parts", step1Body: "Use the PC Builder, choose a pre-built PC, or shop single parts.",
    step2: "We confirm with you", step2Body: "We check price and availability and answer your questions on WhatsApp or by call.",
    step3: "We build and hand over", step3Body: "Your PC is assembled, set up and tested. The service charge is free for PCs built from this website.",
    contactTitle: "Need help choosing?", contactLead: "Message us on WhatsApp and we will help you pick the right parts for your budget.",
  },
  builder: {
    title: "PC Builder", lead: "Choose your parts row by row. We check that they fit together, estimate the power you need and show whether the CPU and graphics card are balanced.",
    groupCore: "Core components", groupPeripherals: "Peripherals & others", hideEmpty: "Hide unconfigured components",
    estWattage: "Estimated wattage", wattTip: "Estimate of the power your parts can use together at full load (Beta).", items: "{n} items", total: "Total", serviceCharge: "Service charge",
    addToCart: "Add to cart", savePc: "Save PC", print: "Print", screenshot: "Screenshot",
    required: "Required", choose: "Choose", change: "Change", addAnother: "Add another", select: "Select", addAnyway: "Add anyway", added: "Part added", chooseRow: "Choose {part}",
    power: "Power", powerEmpty: "Add parts to see the estimate.", recPsu: "Recommended power supply: {w} W or more", psuLoad: "Your PSU: {w} W — about {pct}% load at full use",
    wattDetail: "See breakdown", wattOther: "Board, fans, USB and losses",
    balance: "CPU & GPU balance", useCase: "Used for", gauge: { cpu: "CPU limits", ok: "Balanced", gpu: "GPU limits" },
    bal: {
      none: "Choose a CPU, then a graphics card, to see how well they match.",
      needGpu: "This CPU has no built-in graphics. Add a graphics card.",
      igpu: "No graphics card yet — this PC will use the CPU's built-in graphics. Fine for office work and light games; add a graphics card for gaming.",
      balanced: "Well balanced for {uc}: the CPU and graphics card suit each other.",
      gpuLimited: "The graphics card is the limit here — the CPU has about {pct}% spare power. A better graphics card will help most.",
      mild: "Slight CPU limit (about {pct}%): in some games the CPU may hold the graphics card back a little.",
      moderate: "Noticeable CPU limit (about {pct}%): a stronger CPU would let this graphics card do more.",
      severe: "Strong CPU limit (about {pct}%): the graphics card is much faster than the CPU. Choose a stronger CPU or a smaller graphics card.",
      balancedShort: "Well balanced", gpuLimitedShort: "GPU is the limit (OK)", mildShort: "Slight CPU limit", moderateShort: "CPU limits graphics card", severeShort: "Strong CPU limit", igpuShort: "Built-in graphics",
      tipChannel: "Tip: two RAM sticks (dual-channel) would help here.", tipRam: "Tip: 16 GB of RAM or more is better for gaming.",
    },
    scores: "Relative scores — CPU {cpu}, graphics card {gpu}", balanceNote: "This is an estimate from relative performance scores. Real results change with the game and settings.",
    compatTitle: "Compatibility", summary: "Build summary",
    compat: { empty: "Nothing selected yet.", errors: "{n} problem(s) to fix", warns: "No errors, but {n} thing(s) to check", noneYet: "No problems found so far — add the remaining parts.", ok: "All checks passed." },
    stillNeeded: "Still needed: {list}",
    savedTitle: "Save & load builds", saveName: "Name this build", saveCurrent: "Save current build", copyLink: "Copy share link", load: "Load", noSaved: "No saved builds yet.",
    saved: "Build saved", loaded: "Build loaded", linkCopied: "Link copied", untitled: "My build {n}",
    emptyBuild: "Add some parts first.", needRequired: "Choose the required parts first: {list}",
    confirmErrors: "This build has {n} compatibility problem(s). Add it to the cart anyway?", someUnavailable: "\"{name}\" can't be ordered right now. Change it first.", imageSaved: "Image saved",
  },
  builds: {
    title: "Pre-built PCs", lead: "Budget-friendly PCs we have already put together. Order them as they are or change any part in the PC Builder.",
    none: "No pre-built PCs right now", noneHint: "Build your own in the PC Builder instead.",
    note: "Prices follow the current price of each part, so they can change. We confirm price and availability before your order is final.",
    customize: "Customize", priceFrom: "Total", estWatts: "~{w} W", integrated: "Built-in graphics", partsMissing: "Some parts were removed — check this build",
    freeService: "Service charge free", addedBuild: "PC parts added to cart", someUnavailable: "Some parts can't be ordered right now.",
  },
  cart: {
    title: "Cart", empty: "Your cart is empty", emptyHint: "Add parts from the shop or build a PC.", continue: "Continue shopping", each: "each", qty: "Quantity", remove: "Remove",
    unavailable: "This item can't be ordered right now. Remove it to continue.", goneNote: "Some items are no longer in the shop and were left out.",
    summary: "Order summary", subtotal: "Subtotal", serviceNa: "Quoted when we confirm",
    name: "Your name", phone: "Phone number", address: "Address (optional)", note: "Note (optional)", notePlaceholder: "Delivery time, questions…",
    orderWa: "Order on WhatsApp", orderSend: "Send order request", needContact: "Please enter your name and a valid phone number.",
    sent: "Order request sent. We will contact you soon.", sendFailed: "Could not send. Please use WhatsApp instead.", clear: "Empty cart", clearConfirm: "Remove everything from your cart?",
  },
  components: {
    title: "Components — stock & price list", lead: "Everything we have or can pre-order, with current prices. Search, filter, print or copy the list.",
    print: "Print list", copy: "Copy list", copied: "{n} items copied",
  },
  offers: {
    title: "Offers & discounts", lead: "Current offers and every product with a lower price right now.", none: "No offers right now",
    noneHint: "Check back soon, or message us on WhatsApp to ask about deals.", productsTitle: "Discounted products",
    endsOn: "Ends {date}", alwaysOn: "Always on", shopOffer: "Shop this offer", learnMore: "Learn more", perk: "Perk",
  },
  product: {
    notFound: "Product not found", notFoundHint: "This product may have been removed.", backToShop: "Back to shop",
    preorderHint: "Available to pre-order. We confirm timing with you.", save: "You save {amount}", askAbout: "Ask about this", specs: "Specifications", related: "You may also like",
  },
});

merge("bn", {
  nav: { shop: "শপ", builder: "পিসি বিল্ডার", builds: "প্রি-বিল্ট পিসি", offers: "অফার", service: "সার্ভিস", cart: "কার্ট", priceList: "স্টক ও দামের তালিকা" },
  footer: { company: "কোম্পানি" },
  shop: {
    title: "শপ", lead: "কম্পিউটার পার্টস, ল্যাপটপ, মনিটর ও এক্সেসরিজ — সৎ দাম ও বিশেষজ্ঞ সাহায্যসহ।",
    viewAll: "সব দেখুন", popular: "জনপ্রিয় পণ্য", search: "খুঁজুন", searchAll: "সব পণ্যের মধ্যে খুঁজুন…", searchPlaceholder: "এই তালিকায় খুঁজুন…",
    productsCount: "{n}টি পণ্য", promiseLabel: "এই ওয়েবসাইট থেকে বিল্ড করা পিসিতে সার্ভিস চার্জ ফ্রি", serviceCharge: "সার্ভিস চার্জ",
    askExpert: "বিশেষজ্ঞের সাহায্য নিন", addToCart: "কার্টে যোগ করুন", preorder: "প্রি-অর্ডার", outOfStock: "স্টক নেই", upcoming: "শীঘ্রই আসছে",
    unavailable: "এই পণ্য এখন অর্ডার করা যাচ্ছে না।", addedToCart: "কার্টে যোগ হয়েছে", viewCart: "কার্ট দেখুন", callForPrice: "দামের জন্য কল করুন",
    filters: "ফিল্টার", clearAll: "সব মুছুন", showResults: "{n}টি ফলাফল দেখুন", results: "{n}টি পণ্য পাওয়া গেছে", sortBy: "সাজান",
    sort: { featured: "নির্বাচিত", "price-asc": "দাম: কম থেকে বেশি", "price-desc": "দাম: বেশি থেকে কম", newest: "নতুন", discount: "সবচেয়ে বেশি ছাড়" },
    all: "সব", availability: "প্রাপ্যতা", price: "দাম", min: "সর্বনিম্ন", max: "সর্বোচ্চ", brand: "ব্র্যান্ড",
    showMore: "আরও {n}টি দেখুন", showLess: "কম দেখুন", noResults: "আপনার ফিল্টারে কোনো পণ্য মেলেনি",
    noResultsHint: "একটি ফিল্টার সরিয়ে বা অন্য শব্দে খুঁজে দেখুন।", chooseTypeForFilters: "আরও ফিল্টার দেখতে উপরে একটি ধরন বেছে নিন।",
    compatOnly: "আমার বিল্ডের সাথে মানানসই পার্টস দেখান", hiddenIncompatible: "{n}টি লুকানো", notCompatible: "মানানসই নয়",
    onSale: "ছাড়ে", offer: "অফার", prev: "আগের", next: "পরের", pagination: "পৃষ্ঠা", view: "ভিউ", viewGrid: "গ্রিড ভিউ", viewList: "লিস্ট ভিউ",
    product: "পণ্য", category: "ক্যাটাগরি", close: "বন্ধ করুন",
  },
  home: {
    metaTitle: "ওভি'স ফিক্স — ঢাকায় কম্পিউটার পার্টস, পিসি বিল্ডার ও রিপেয়ার",
    metaDesc: "ফ্রি সার্ভিস চার্জে অনলাইনে নিজের পিসি বানান, কম্পিউটার পার্টস ও প্রি-বিল্ট পিসি কিনুন, বা কেরানীগঞ্জ, ঢাকায় কম্পিউটার রিপেয়ার বুক করুন।",
    doorShop: "পার্টস ও পিসি কিনুন", doorShopSub: "কম্পোনেন্ট, ল্যাপটপ, প্রি-বিল্ট পিসি", doorService: "রিপেয়ার বুক করুন", doorServiceSub: "ডায়াগনস্টিক, রিপেয়ার, সেটআপ",
    sheetLabel: "উদাহরণ বিল্ড শিট", sheetTitle: "বিল্ড শিট", seeBuilds: "সব প্রি-বিল্ট পিসি দেখুন",
    categoriesTitle: "ক্যাটাগরি অনুযায়ী কিনুন",
    builderTitle: "নিজের পিসি নিজেই বানান",
    builderLead: "একে একে পার্টস বাছাই করুন। বিল্ডার দেখে দেয় সেগুলো মানানসই কিনা, কত ওয়াট লাগবে তার হিসাব দেয় এবং CPU ও গ্রাফিক্স কার্ড একে অপরের সাথে মানানসই কিনা জানায়।",
    builderPoint1: "সকেট, RAM টাইপ, কেসের সাইজসহ মানানসই কিনা যাচাই", builderPoint2: "আনুমানিক ওয়াট ও কেনার জন্য পাওয়ার সাপ্লাইয়ের সাইজ", builderPoint3: "CPU ও গ্রাফিক্স কার্ডের ভারসাম্য যাচাই",
    openBuilder: "পিসি বিল্ডার খুলুন",
    buildsTitle: "প্রি-বিল্ট পিসি", buildsLead: "তৈরি করা, বাজেট-বান্ধব বিল্ড। যেমন আছে তেমন কিনুন বা পিসি বিল্ডারে যেকোনো পার্ট বদলান।",
    offersTitle: "অফার ও ছাড়",
    servicesTitle: "রিপেয়ার ও আইটি সার্ভিস", servicesLead: "কেরানীগঞ্জ ও ঢাকা জুড়ে বাসা ও অন-সাইট কম্পিউটার রিপেয়ার, ডায়াগনস্টিক ও আপগ্রেড।",
    allServices: "সব সার্ভিস", free: "ফ্রি", fromPrice: "{price} থেকে",
    stepsTitle: "কীভাবে কাজ করে",
    step1: "পার্টস বাছাই করুন", step1Body: "পিসি বিল্ডার ব্যবহার করুন, প্রি-বিল্ট পিসি বাছুন, বা আলাদা পার্টস কিনুন।",
    step2: "আমরা আপনার সাথে নিশ্চিত করি", step2Body: "আমরা দাম ও প্রাপ্যতা দেখে হোয়াটসঅ্যাপে বা কলে আপনার প্রশ্নের উত্তর দিই।",
    step3: "আমরা বিল্ড করে বুঝিয়ে দিই", step3Body: "আপনার পিসি অ্যাসেম্বল, সেটআপ ও টেস্ট করা হয়। এই ওয়েবসাইট থেকে বিল্ড করা পিসিতে সার্ভিস চার্জ ফ্রি।",
    contactTitle: "বাছাই করতে সাহায্য লাগবে?", contactLead: "হোয়াটসঅ্যাপে মেসেজ দিন, আপনার বাজেট অনুযায়ী ঠিক পার্টস বাছাইয়ে আমরা সাহায্য করব।",
  },
  builder: {
    title: "পিসি বিল্ডার", lead: "এক সারি করে পার্টস বাছাই করুন। আমরা দেখে নিই সেগুলো একসাথে মানায় কিনা, কত ওয়াট লাগবে তার হিসাব দিই এবং CPU ও গ্রাফিক্স কার্ডের ভারসাম্য দেখাই।",
    groupCore: "মূল কম্পোনেন্ট", groupPeripherals: "পেরিফেরাল ও অন্যান্য", hideEmpty: "নির্বাচন না করা কম্পোনেন্ট লুকান",
    estWattage: "আনুমানিক ওয়াট", wattTip: "পূর্ণ লোডে আপনার পার্টস একসাথে সর্বোচ্চ কত পাওয়ার টানতে পারে তার আনুমানিক হিসাব (বেটা)।", items: "{n}টি আইটেম", total: "মোট", serviceCharge: "সার্ভিস চার্জ",
    addToCart: "কার্টে যোগ করুন", savePc: "পিসি সেভ", print: "প্রিন্ট", screenshot: "স্ক্রিনশট",
    required: "আবশ্যক", choose: "বাছাই করুন", change: "বদলান", addAnother: "আরেকটি যোগ করুন", select: "নির্বাচন", addAnyway: "তবুও যোগ করুন", added: "পার্ট যোগ হয়েছে", chooseRow: "{part} বাছাই করুন",
    power: "পাওয়ার", powerEmpty: "আনুমানিক হিসাব দেখতে পার্টস যোগ করুন।", recPsu: "সুপারিশকৃত পাওয়ার সাপ্লাই: {w}W বা তার বেশি", psuLoad: "আপনার PSU: {w}W — পূর্ণ ব্যবহারে প্রায় {pct}% লোড",
    wattDetail: "বিস্তারিত দেখুন", wattOther: "বোর্ড, ফ্যান, USB ও লস",
    balance: "CPU ও GPU ভারসাম্য", useCase: "ব্যবহার", gauge: { cpu: "CPU বাধা", ok: "ভারসাম্য", gpu: "GPU বাধা" },
    bal: {
      none: "মিল দেখতে আগে CPU, তারপর গ্রাফিক্স কার্ড বাছাই করুন।",
      needGpu: "এই CPU-তে বিল্ট-ইন গ্রাফিক্স নেই। একটি গ্রাফিক্স কার্ড যোগ করুন।",
      igpu: "এখনো গ্রাফিক্স কার্ড নেই — এই পিসি CPU-র বিল্ট-ইন গ্রাফিক্স ব্যবহার করবে। অফিসের কাজ ও হালকা গেমের জন্য ঠিক আছে; গেমিংয়ের জন্য গ্রাফিক্স কার্ড যোগ করুন।",
      balanced: "{uc}-এর জন্য ভারসাম্য ভালো: CPU ও গ্রাফিক্স কার্ড একে অপরের সাথে মানানসই।",
      gpuLimited: "এখানে গ্রাফিক্স কার্ডই সীমা — CPU-র প্রায় {pct}% শক্তি বাকি থাকে। ভালো গ্রাফিক্স কার্ড সবচেয়ে বেশি কাজে আসবে।",
      mild: "সামান্য CPU বাধা (প্রায় {pct}%): কিছু গেমে CPU গ্রাফিক্স কার্ডকে একটু পিছিয়ে রাখতে পারে।",
      moderate: "লক্ষণীয় CPU বাধা (প্রায় {pct}%): শক্তিশালী CPU হলে এই গ্রাফিক্স কার্ড আরও ভালো চলবে।",
      severe: "জোরালো CPU বাধা (প্রায় {pct}%): গ্রাফিক্স কার্ড CPU-র চেয়ে অনেক দ্রুত। শক্তিশালী CPU বা ছোট গ্রাফিক্স কার্ড বাছুন।",
      balancedShort: "ভারসাম্য ভালো", gpuLimitedShort: "GPU-ই সীমা (ঠিক আছে)", mildShort: "সামান্য CPU বাধা", moderateShort: "CPU বাধা দিচ্ছে", severeShort: "জোরালো CPU বাধা", igpuShort: "বিল্ট-ইন গ্রাফিক্স",
      tipChannel: "টিপ: দুটি RAM স্টিক (dual-channel) হলে ভালো হবে।", tipRam: "টিপ: গেমিংয়ের জন্য 16GB বা বেশি RAM ভালো।",
    },
    scores: "আপেক্ষিক স্কোর — CPU {cpu}, গ্রাফিক্স কার্ড {gpu}", balanceNote: "এটি আপেক্ষিক পারফরম্যান্স স্কোরের ভিত্তিতে একটি আনুমানিক হিসাব। গেম ও সেটিংসের সাথে আসল ফল বদলায়।",
    compatTitle: "মানানসই যাচাই", summary: "বিল্ডের সারসংক্ষেপ",
    compat: { empty: "এখনো কিছু বাছাই করা হয়নি।", errors: "{n}টি সমস্যা ঠিক করতে হবে", warns: "কোনো ত্রুটি নেই, তবে {n}টি বিষয় দেখে নিন", noneYet: "এ পর্যন্ত কোনো সমস্যা পাওয়া যায়নি — বাকি পার্টস যোগ করুন।", ok: "সব যাচাই সফল।" },
    stillNeeded: "এখনো লাগবে: {list}",
    savedTitle: "বিল্ড সেভ ও লোড", saveName: "বিল্ডের নাম দিন", saveCurrent: "বর্তমান বিল্ড সেভ করুন", copyLink: "শেয়ার লিংক কপি করুন", load: "লোড", noSaved: "এখনো কোনো সেভ করা বিল্ড নেই।",
    saved: "বিল্ড সেভ হয়েছে", loaded: "বিল্ড লোড হয়েছে", linkCopied: "লিংক কপি হয়েছে", untitled: "আমার বিল্ড {n}",
    emptyBuild: "আগে কিছু পার্টস যোগ করুন।", needRequired: "আগে আবশ্যক পার্টস বাছাই করুন: {list}",
    confirmErrors: "এই বিল্ডে {n}টি মানানসই সমস্যা আছে। তবুও কার্টে যোগ করবেন?", someUnavailable: "\"{name}\" এখন অর্ডার করা যাচ্ছে না। আগে এটি বদলান।", imageSaved: "ছবি সেভ হয়েছে",
  },
  builds: {
    title: "প্রি-বিল্ট পিসি", lead: "আমাদের আগে থেকে সাজানো বাজেট-বান্ধব পিসি। যেমন আছে তেমন অর্ডার করুন বা পিসি বিল্ডারে যেকোনো পার্ট বদলান।",
    none: "এখন কোনো প্রি-বিল্ট পিসি নেই", noneHint: "এর বদলে পিসি বিল্ডারে নিজের পিসি বানান।",
    note: "দাম প্রতিটি পার্টসের বর্তমান দাম অনুযায়ী, তাই বদলাতে পারে। অর্ডার চূড়ান্ত করার আগে আমরা দাম ও প্রাপ্যতা নিশ্চিত করি।",
    customize: "কাস্টমাইজ", priceFrom: "মোট", estWatts: "~{w}W", integrated: "বিল্ট-ইন গ্রাফিক্স", partsMissing: "কিছু পার্টস সরানো হয়েছে — বিল্ডটি দেখে নিন",
    freeService: "সার্ভিস চার্জ ফ্রি", addedBuild: "পিসির পার্টস কার্টে যোগ হয়েছে", someUnavailable: "কিছু পার্টস এখন অর্ডার করা যাচ্ছে না।",
  },
  cart: {
    title: "কার্ট", empty: "আপনার কার্ট খালি", emptyHint: "শপ থেকে পার্টস যোগ করুন বা পিসি বানান।", continue: "কেনাকাটা চালিয়ে যান", each: "প্রতিটি", qty: "পরিমাণ", remove: "সরান",
    unavailable: "এই পণ্য এখন অর্ডার করা যাচ্ছে না। এগিয়ে যেতে এটি সরান।", goneNote: "কিছু পণ্য আর শপে নেই, তাই বাদ দেওয়া হয়েছে।",
    summary: "অর্ডারের সারসংক্ষেপ", subtotal: "সাবটোটাল", serviceNa: "নিশ্চিত করার সময় জানানো হবে",
    name: "আপনার নাম", phone: "ফোন নম্বর", address: "ঠিকানা (ঐচ্ছিক)", note: "নোট (ঐচ্ছিক)", notePlaceholder: "ডেলিভারির সময়, প্রশ্ন…",
    orderWa: "হোয়াটসঅ্যাপে অর্ডার করুন", orderSend: "অর্ডার রিকোয়েস্ট পাঠান", needContact: "অনুগ্রহ করে আপনার নাম ও সঠিক ফোন নম্বর দিন।",
    sent: "অর্ডার রিকোয়েস্ট পাঠানো হয়েছে। আমরা শীঘ্রই যোগাযোগ করব।", sendFailed: "পাঠানো যায়নি। অনুগ্রহ করে হোয়াটসঅ্যাপ ব্যবহার করুন।", clear: "কার্ট খালি করুন", clearConfirm: "কার্টের সবকিছু সরাতে চান?",
  },
  components: {
    title: "কম্পোনেন্ট — স্টক ও দামের তালিকা", lead: "আমাদের কাছে যা আছে বা প্রি-অর্ডারে আনা যায়, বর্তমান দামসহ। খুঁজুন, ফিল্টার করুন, তালিকা প্রিন্ট বা কপি করুন।",
    print: "তালিকা প্রিন্ট", copy: "তালিকা কপি", copied: "{n}টি আইটেম কপি হয়েছে",
  },
  offers: {
    title: "অফার ও ছাড়", lead: "চলমান অফার এবং এই মুহূর্তে কম দামে থাকা সব পণ্য।", none: "এখন কোনো অফার নেই",
    noneHint: "শীঘ্রই আবার দেখুন, অথবা ডিলের কথা জানতে হোয়াটসঅ্যাপে মেসেজ দিন।", productsTitle: "ছাড়ের পণ্য",
    endsOn: "শেষ হবে {date}", alwaysOn: "সবসময় চালু", shopOffer: "এই অফারে কিনুন", learnMore: "আরও জানুন", perk: "সুবিধা",
  },
  product: {
    notFound: "পণ্য পাওয়া যায়নি", notFoundHint: "এই পণ্যটি সরিয়ে ফেলা হয়ে থাকতে পারে।", backToShop: "শপে ফিরে যান",
    preorderHint: "প্রি-অর্ডার করা যাবে। সময় আমরা আপনাকে নিশ্চিত করব।", save: "আপনি বাঁচাচ্ছেন {amount}", askAbout: "এ সম্পর্কে জিজ্ঞেস করুন", specs: "স্পেসিফিকেশন", related: "আপনার আরও পছন্দ হতে পারে",
  },
});

/* ---- motherboard-first PC Builder ---- */
merge("en", {
  builder: {
    lead: "Start with the motherboard. Every other list then shows only parts that fit it, we estimate the power you need, and show whether the CPU and graphics card are balanced.",
    startHere: "Start here", boardFirst: "Choose a motherboard first", boardFirstHint: "Every other list will then show only parts that fit it — the right CPU socket, RAM type and case size.",
    chooseBoard: "Choose motherboard", lockedRow: "Locked until you choose a motherboard", boardChosen: "Motherboard selected — other lists now show only parts that fit it.",
    platform: "Your platform", platformHint: "CPU, RAM, cooler and casing lists show only parts that fit this motherboard.",
    fitOnly: "Showing only parts that fit your motherboard",
    boardSwapNote: "If you pick a different motherboard, parts that don't fit it are removed — you will see exactly what was removed.",
    removedForBoard: "Removed because they don't fit the new motherboard: {list}", boardRemoved: "Motherboard removed. Choose one again to keep adding parts.",
    noFit: "No {part} listed yet for this motherboard", noFitHint: "We can often pre-order it for you — ask us on WhatsApp.",
  },
  home: { builderLead: "Start with the motherboard. The builder then shows only parts that fit it, estimates the power you need and tells you whether the CPU and graphics card suit each other." },
});
merge("bn", {
  builder: {
    lead: "মাদারবোর্ড দিয়ে শুরু করুন। এরপর অন্য সব তালিকায় শুধু এর সাথে মানানসই পার্টস দেখানো হয়, কত ওয়াট লাগবে তার হিসাব দিই এবং CPU ও গ্রাফিক্স কার্ডের ভারসাম্য দেখাই।",
    startHere: "এখান থেকে শুরু", boardFirst: "আগে মাদারবোর্ড বাছাই করুন", boardFirstHint: "এরপর অন্য সব তালিকায় শুধু এর সাথে মানানসই পার্টস দেখানো হবে — সঠিক CPU socket, RAM type ও কেসের সাইজ।",
    chooseBoard: "মাদারবোর্ড বাছাই করুন", lockedRow: "মাদারবোর্ড বাছাই না করা পর্যন্ত লক করা", boardChosen: "মাদারবোর্ড বাছাই হয়েছে — অন্য তালিকায় এখন শুধু মানানসই পার্টস দেখাবে।",
    platform: "আপনার প্ল্যাটফর্ম", platformHint: "CPU, RAM, কুলার ও কেসিংয়ের তালিকায় শুধু এই মাদারবোর্ডের সাথে মানানসই পার্টস দেখানো হয়।",
    fitOnly: "শুধু আপনার মাদারবোর্ডের সাথে মানানসই পার্টস দেখানো হচ্ছে",
    boardSwapNote: "অন্য মাদারবোর্ড বাছাই করলে যে পার্টস মানায় না সেগুলো সরে যাবে — কী কী সরেছে তা আপনাকে দেখানো হবে।",
    removedForBoard: "নতুন মাদারবোর্ডের সাথে মানায় না তাই সরানো হয়েছে: {list}", boardRemoved: "মাদারবোর্ড সরানো হয়েছে। পার্টস যোগ করতে আবার একটি বাছাই করুন।",
    noFit: "এই মাদারবোর্ডের জন্য এখনো কোনো {part} তালিকায় নেই", noFitHint: "আমরা প্রায়ই প্রি-অর্ডারে আনতে পারি — হোয়াটসঅ্যাপে জিজ্ঞেস করুন।",
  },
  home: { builderLead: "মাদারবোর্ড দিয়ে শুরু করুন। বিল্ডার এরপর শুধু মানানসই পার্টস দেখায়, কত ওয়াট লাগবে তার হিসাব দেয় এবং CPU ও গ্রাফিক্স কার্ড একে অপরের সাথে মানানসই কিনা জানায়।" },
});

/* ---- /service and /terms additions ---- */
merge("en", {
  service: {
    buildTitle: "Need a new PC instead of a repair?",
    buildLead: "Build one in our PC Builder or pick a pre-built PC. The service charge is free when you order from this website.",
    onThisPage: "On this page",
  },
  terms: { shopTitle: "Shop, PC Builder & Pre-order Terms", shopSubtitle: "How ordering, pre-orders and the free service charge work." },
});
merge("bn", {
  service: {
    buildTitle: "রিপেয়ারের বদলে নতুন পিসি লাগবে?",
    buildLead: "আমাদের পিসি বিল্ডারে নিজের পিসি বানান বা প্রি-বিল্ট পিসি বাছুন। এই ওয়েবসাইট থেকে অর্ডার করলে সার্ভিস চার্জ ফ্রি।",
    onThisPage: "এই পাতায়",
  },
  terms: { shopTitle: "শপ, পিসি বিল্ডার ও প্রি-অর্ডারের শর্ত", shopSubtitle: "অর্ডার, প্রি-অর্ডার ও ফ্রি সার্ভিস চার্জ কীভাবে কাজ করে।" },
});

/* ---- 404 ---- */
merge("en", { notfound: { title: "We can't find that page", hint: "The link may be old or mistyped. Try the shop, or head back home.", home: "Go to home" } });
merge("bn", { notfound: { title: "এই পাতাটি খুঁজে পাওয়া যাচ্ছে না", hint: "লিংকটি পুরোনো বা ভুল হতে পারে। শপে দেখুন, অথবা হোমে ফিরে যান।", home: "হোমে যান" } });
