import { readFile, writeFile } from "node:fs/promises";

const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) throw new Error("Usage: node scripts/localize-map-labels.mjs <input.geojson> <output.geojson>");

const document = JSON.parse(await readFile(inputPath, "utf8"));
if (document.type !== "FeatureCollection" || !Array.isArray(document.features)) throw new Error("Expected a GeoJSON FeatureCollection");

const overrides = {
  "Kingdom of Monaco": { ru: "Королевство Монако", kk: "Монако патшалығы" },
  "Principality of Monaco": { ru: "Княжество Монако", kk: "Монако кінәздігі" },
  Netherlands: { ru: "Нидерланды", kk: "Нидерланд" },
  "(Netherlands)": { ru: "Нидерланды", kk: "Нидерланд" },
  "French Third Republic": { ru: "Третья Французская республика", kk: "Үшінші Француз Республикасы" },
  "(French Third Republic)": { ru: "Третья Французская республика", kk: "Үшінші Француз Республикасы" },
  "Brazilian Republic": { ru: "Бразильская республика", kk: "Бразилия Республикасы" },
  "Unitary State of Brazil": { ru: "Унитарное государство Бразилия", kk: "Бразилия унитарлық мемлекеті" },
  "Federated Republic of Brazil": { ru: "Федеративная Республика Бразилия", kk: "Бразилия Федеративтік Республикасы" },
  "Republic of Brazil": { ru: "Республика Бразилия", kk: "Бразилия Республикасы" },
  "Portuguese Colonies": { ru: "Португальские колонии", kk: "Португалия отарлары" },
  "(Portuguese Empire)": { ru: "Португальская империя", kk: "Португалия империясы" },
  Swaziland: { ru: "Свазиленд", kk: "Свазиленд" },
  Eswatini: { ru: "Эсватини", kk: "Эсватини" },
  "Empire of Japan": { ru: "Японская империя", kk: "Жапон империясы" },
  Japan: { ru: "Япония", kk: "Жапония" },
  "Qatar Dynasty": { ru: "Династия Катара", kk: "Қатар әулеті" },
  Qatar: { ru: "Катар", kk: "Қатар" },
  "State of Qatar": { ru: "Государство Катар", kk: "Қатар мемлекеті" },
  "British Colonial Empire": { ru: "Британская колониальная империя", kk: "Британ отарлық империясы" },
  "(British Empire)": { ru: "Британская империя", kk: "Британ империясы" },
  "Austria-Hungary": { ru: "Австро-Венгрия", kk: "Аустрия-Мажарстан" },
  Hungary: { ru: "Венгрия", kk: "Мажарстан" },
  "Hungarian Nationalists": { ru: "Венгерские националисты", kk: "Мажар ұлтшылдары" },
  "Republic of Cuba": { ru: "Республика Куба", kk: "Куба Республикасы" },
  "Communist Cuba": { ru: "Социалистическая Куба", kk: "Социалистік Куба" },
  "Republic of China": { ru: "Китайская Республика", kk: "Қытай Республикасы" },
  "People's Republic of China": { ru: "Китайская Народная Республика", kk: "Қытай Халық Республикасы" },
  "Azerbaijan Democratic Republic": { ru: "Азербайджанская Демократическая Республика", kk: "Әзербайжан Демократиялық Республикасы" },
  "Republic of Azerbaijan": { ru: "Азербайджанская Республика", kk: "Әзербайжан Республикасы" },
  Armenia: { ru: "Армения", kk: "Армения" },
  "Republic of Armenia": { ru: "Республика Армения", kk: "Армения Республикасы" },
  Czechoslovakia: { ru: "Чехословакия", kk: "Чехословакия" },
  Slovakia: { ru: "Словакия", kk: "Словакия" },
  "Kingdom of Romania": { ru: "Королевство Румыния", kk: "Румыния патшалығы" },
  Romania: { ru: "Румыния", kk: "Румыния" },
  Yugoslavia: { ru: "Югославия", kk: "Югославия" },
  "Socialist Federal Republic of Yugoslavia": { ru: "Социалистическая Федеративная Республика Югославия", kk: "Югославия Социалистік Федеративтік Республикасы" },
  Estonia: { ru: "Эстония", kk: "Эстония" },
  "Republic of Estonia": { ru: "Эстонская Республика", kk: "Эстония Республикасы" },
  "French Mandate for Syria and Lebanon": { ru: "Французский мандат в Сирии и Ливане", kk: "Сирия мен Ливандағы Француз мандаты" },
  Lebanon: { ru: "Ливан", kk: "Ливан" },
  "Chinese Communists": { ru: "Китайские коммунисты", kk: "Қытай коммунистері" },
  "Communist Party of China": { ru: "Коммунистическая партия Китая", kk: "Қытай Коммунистік партиясы" },
  "(Vichy France)": { ru: "Режим Виши", kk: "Виши режимі" },
  "Vichy France": { ru: "Режим Виши", kk: "Виши режимі" },
  "French Fourth Republic": { ru: "Четвёртая Французская республика", kk: "Төртінші Француз Республикасы" },
  "(French Fourth Republic)": { ru: "Четвёртая Французская республика", kk: "Төртінші Француз Республикасы" },
  "People's Socialist Republic of Albania": { ru: "Народная Социалистическая Республика Албания", kk: "Албания Халық Социалистік Республикасы" },
  "Republic of Albania": { ru: "Республика Албания", kk: "Албания Республикасы" },
  "People's Republic of Bulgaria": { ru: "Народная Республика Болгария", kk: "Болгария Халық Республикасы" },
  "Republic of Bulgaria": { ru: "Республика Болгария", kk: "Болгария Республикасы" },
  "Democratic People's Republic of Korea": { ru: "Корейская Народно-Демократическая Республика", kk: "Корей Халық Демократиялық Республикасы" },
  "Republic of Korea": { ru: "Республика Корея", kk: "Корея Республикасы" },
  Burma: { ru: "Бирма", kk: "Бирма" },
  "Union of Myanmar": { ru: "Союз Мьянма", kk: "Мьянма Одағы" },
  "Republic of Egypt": { ru: "Республика Египет", kk: "Мысыр Республикасы" },
  "Arab Republic of Egypt": { ru: "Арабская Республика Египет", kk: "Мысыр Араб Республикасы" },
  "Republic of Vietnam": { ru: "Республика Вьетнам", kk: "Вьетнам Республикасы" },
  "Democratic Republic of Vietnam": { ru: "Демократическая Республика Вьетнам", kk: "Вьетнам Демократиялық Республикасы" },
  Guinea: { ru: "Гвинея", kk: "Гвинея" },
  "Equatorial Guinea": { ru: "Экваториальная Гвинея", kk: "Экваторлық Гвинея" },
  "Democratic Republic of the Congo": { ru: "Демократическая Республика Конго", kk: "Конго Демократиялық Республикасы" },
  "Republic of the Congo": { ru: "Республика Конго", kk: "Конго Республикасы" },
  "Republic of Syria": { ru: "Сирийская Республика", kk: "Сирия Республикасы" },
  "Ba'athist Syria": { ru: "Баасистская Сирия", kk: "Баасшыл Сирия" },
  "State of Kuwait": { ru: "Государство Кувейт", kk: "Кувейт мемлекеті" },
  Kuwait: { ru: "Кувейт", kk: "Кувейт" },
  "People's Democratic Republic of Yemen": { ru: "Народная Демократическая Республика Йемен", kk: "Йемен Халық Демократиялық Республикасы" },
  "Republic of Yemen": { ru: "Йеменская Республика", kk: "Йемен Республикасы" },
  "(Russian Federation)": { ru: "Российская Федерация", kk: "Ресей Федерациясы" },
  "Russian Federation": { ru: "Российская Федерация", kk: "Ресей Федерациясы" },
  Bali: { ru: "Бали", kk: "Бали" },
  "Argentine Confederation": { ru: "Аргентинская конфедерация", kk: "Аргентина конфедерациясы" },
  "First Hellenic Republic": { ru: "Первая Греческая республика", kk: "Бірінші Грек Республикасы" },
  "Principality of Bulgaria": { ru: "Княжество Болгария", kk: "Болгария кінәздігі" },
  "New Hebrides": { ru: "Новые Гебриды", kk: "Жаңа Гебридтер" },
  "Rattanakosin Kingdom": { ru: "Королевство Раттанакосин", kk: "Раттанакосин патшалығы" },
  "Dutch East Indies": { ru: "Нидерландская Ост-Индия", kk: "Нидерланд Ост-Үндістаны" },
  "Cretan State": { ru: "Критское государство", kk: "Крит мемлекеті" },
  "Sokoto Caliphate": { ru: "Халифат Сокото", kk: "Сокото халифаты" },
  "Ethiopian Empire": { ru: "Эфиопская империя", kk: "Эфиопия империясы" },
  "Kingdom of Portugal": { ru: "Королевство Португалия", kk: "Португалия патшалығы" },
  "United Principalities of Moldavia and Wallachia": { ru: "Соединённые княжества Молдавии и Валахии", kk: "Молдавия мен Валахияның Біріккен кінәздіктері" },
  "Natalia Republic": { ru: "Республика Наталь", kk: "Наталь Республикасы" },
  Kelantan: { ru: "Келантан", kk: "Келантан" },
  "French Indochina": { ru: "Французский Индокитай", kk: "Француз Үндіқытайы" },
  "Belgian Congo": { ru: "Бельгийское Конго", kk: "Бельгиялық Конго" },
  "Tangier International Zone": { ru: "Международная зона Танжер", kk: "Танжер халықаралық аймағы" },
  Georgia: { ru: "Грузия", kk: "Грузия" },
  "Kingdom of Iceland": { ru: "Королевство Исландия", kk: "Исландия патшалығы" },
  "North Yemen": { ru: "Северный Йемен", kk: "Солтүстік Йемен" },
  "Kingdom of Lithuania": { ru: "Королевство Литва", kk: "Литва патшалығы" },
  "Free City of Danzig": { ru: "Вольный город Данциг", kk: "Данциг еркін қаласы" },
  "Second Polish Republic": { ru: "Вторая Польская республика", kk: "Екінші Польша Республикасы" },
  "Kingdom of Egypt": { ru: "Королевство Египет", kk: "Мысыр патшалығы" },
  "Irish Free State": { ru: "Ирландское Свободное государство", kk: "Ирландия Еркін Мемлекеті" },
  "Provisional Priamurye Government": { ru: "Приамурский земский край", kk: "Амур маңының уақытша үкіметі" },
  "Kingdom of Afghanistan": { ru: "Королевство Афганистан", kk: "Ауғанстан патшалығы" },
  "Estado Novo": { ru: "Новое государство", kk: "Жаңа мемлекет" },
  "Kingdom of Iraq": { ru: "Королевство Ирак", kk: "Ирак патшалығы" },
  Éire: { ru: "Ирландия", kk: "Ирландия" },
  "Francoist Spain": { ru: "Франкистская Испания", kk: "Франкистік Испания" },
  "Yugoslav Partisans": { ru: "Югославские партизаны", kk: "Югослав партизандары" },
  "Kingdom of Greece": { ru: "Королевство Греция", kk: "Грекия патшалығы" },
  "Second Syrian Republic": { ru: "Вторая Сирийская республика", kk: "Екінші Сирия Республикасы" },
  "Kingdom of Bulgaria": { ru: "Царство Болгария", kk: "Болгария патшалығы" },
  "Hyderabad State": { ru: "Хайдарабадское государство", kk: "Хайдарабад мемлекеті" },
  "Socialist Republic of Romania": { ru: "Социалистическая Республика Румыния", kk: "Румыния Социалистік Республикасы" },
  "Hungarian People's Republic": { ru: "Венгерская Народная Республика", kk: "Мажар Халық Республикасы" },
  "Kingdom of Libya": { ru: "Королевство Ливия", kk: "Ливия патшалығы" },
  "Kingdom of Laos": { ru: "Королевство Лаос", kk: "Лаос патшалығы" },
  "United Arab Republic": { ru: "Объединённая Арабская Республика", kk: "Біріккен Араб Республикасы" },
  "Arab Federation": { ru: "Арабская Федерация", kk: "Араб Федерациясы" },
  "French Fifth Republic": { ru: "Пятая Французская республика", kk: "Бесінші Француз Республикасы" },
  "Federation of Malaya": { ru: "Малайская Федерация", kk: "Малайя Федерациясы" },
  "Mali Federation": { ru: "Федерация Мали", kk: "Мали Федерациясы" },
  Rhodesia: { ru: "Родезия", kk: "Родезия" },
  "Saint Kitts": { ru: "Сент-Китс", kk: "Сент-Китс" },
  "Republic of Afghanistan": { ru: "Республика Афганистан", kk: "Ауғанстан Республикасы" },
  Zaire: { ru: "Заир", kk: "Заир" },
  "Third Hellenic Republic": { ru: "Третья Греческая республика", kk: "Үшінші Грек Республикасы" },
  "People's Republic of Kampuchea": { ru: "Народная Республика Кампучия", kk: "Кампучия Халық Республикасы" },
  "Zimbabwe Rhodesia": { ru: "Зимбабве-Родезия", kk: "Зимбабве-Родезия" },
  "British Overseas Territories": { ru: "Британские заморские территории", kk: "Ұлыбританияның теңіз асып жатқан аумақтары" },
  "Russian-occupied territories": { ru: "Территории, оккупированные Россией", kk: "Ресей басып алған аумақтар" },
};

const ids = [...new Set(document.features.map((feature) => feature.properties?.wikidata).filter((value) => typeof value === "string" && /^Q\d+$/.test(value)))];
const entities = new Map();

for (let offset = 0; offset < ids.length; offset += 50) {
  const query = new URLSearchParams({
    action: "wbgetentities",
    ids: ids.slice(offset, offset + 50).join("|"),
    props: "labels",
    languages: "ru|kk|en",
    format: "json",
    formatversion: "2",
  });
  const response = await fetch(`https://www.wikidata.org/w/api.php?${query}`, {
    headers: { "user-agent": "TarihLine/0.1 (https://github.com/Ihsanchik23/TarihLine)" },
  });
  if (!response.ok) throw new Error(`Wikidata request failed with ${response.status}`);
  const data = await response.json();
  for (const entity of Object.values(data.entities ?? {})) entities.set(entity.id, entity.labels ?? {});
}

const coverage = { ru: 0, kk: 0, curated: 0, total: document.features.length };
for (const feature of document.features) {
  const properties = feature.properties ?? {};
  const labels = entities.get(properties.wikidata) ?? {};
  const original = typeof properties.name === "string" ? properties.name : "";
  const english = labels.en?.value ?? original;
  const override = overrides[original];
  const nameRu = override?.ru ?? labels.ru?.value ?? english;
  const nameKk = override?.kk ?? labels.kk?.value ?? english;
  if (nameRu) coverage.ru += 1;
  if (nameKk) coverage.kk += 1;
  if (override) coverage.curated += 1;
  feature.properties = {
    ...properties,
    name_ru: nameRu,
    name_kk: nameKk,
  };
}

await writeFile(outputPath, JSON.stringify(document));
console.log(JSON.stringify({ entities: ids.length, features: document.features.length, coverage }, null, 2));
