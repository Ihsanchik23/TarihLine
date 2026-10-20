import type { HistoryRecord } from "@/lib/history-types";

export const prototypeRecords: HistoryRecord[] = [
  {
    id: "prototype-semipalatinsk-1949",
    slug: "semipalatinsk-first-nuclear-test",
    type: "event",
    title: {
      ru: "Первое ядерное испытание на Семипалатинском полигоне",
      kk: "Семей полигонындағы алғашқы ядролық сынақ",
    },
    summary: {
      ru: "29 августа 1949 года на полигоне было проведено первое советское испытание атомного оружия.",
      kk: "1949 жылғы 29 тамызда полигонда кеңестік атом қаруының алғашқы сынағы өткізілді.",
    },
    description: {
      ru: "Испытание РДС-1 открыло многолетний период ядерных испытаний в регионе. Последствия полигона стали одной из важнейших тем истории Казахстана XX века.",
      kk: "РДС-1 сынағы өңірдегі көпжылдық ядролық сынақтар кезеңін бастады. Полигонның зардаптары Қазақстанның XX ғасыр тарихындағы маңызды тақырыптардың біріне айналды.",
    },
    significance: {
      ru: "Событие изменило мировой ядерный баланс и оказало длительное воздействие на население и окружающую среду региона.",
      kk: "Оқиға әлемдік ядролық тепе-теңдікті өзгертіп, өңір халқы мен қоршаған ортаға ұзақ мерзімді әсер етті.",
    },
    category: "science",
    startYear: 1949,
    endYear: 1949,
    dateLabel: { ru: "29 августа 1949", kk: "1949 жылғы 29 тамыз" },
    location: { ru: "Семипалатинский полигон", kk: "Семей полигоны" },
    coordinates: [78.2167, 50.4333],
    locationKind: "event",
    sources: [
      {
        title: "History of nuclear testing",
        url: "https://www.un.org/en/observances/end-nuclear-tests-day/history",
        publisher: "United Nations",
      },
    ],
  },
  {
    id: "prototype-prc-1949",
    slug: "proclamation-of-the-prc",
    type: "event",
    title: {
      ru: "Провозглашение Китайской Народной Республики",
      kk: "Қытай Халық Республикасының жариялануы",
    },
    summary: {
      ru: "1 октября 1949 года в Пекине была провозглашена Китайская Народная Республика.",
      kk: "1949 жылғы 1 қазанда Бейжіңде Қытай Халық Республикасы жарияланды.",
    },
    description: {
      ru: "Создание нового государства стало итогом гражданской войны в Китае и заметно изменило политическую карту Восточной Азии.",
      kk: "Жаңа мемлекеттің құрылуы Қытайдағы азамат соғысының қорытындысы болып, Шығыс Азияның саяси картасын едәуір өзгертті.",
    },
    significance: {
      ru: "Китай стал одним из ключевых участников международной политики второй половины XX века.",
      kk: "Қытай XX ғасырдың екінші жартысындағы халықаралық саясаттың негізгі қатысушыларының біріне айналды.",
    },
    category: "politics",
    startYear: 1949,
    endYear: 1949,
    dateLabel: { ru: "1 октября 1949", kk: "1949 жылғы 1 қазан" },
    location: { ru: "Пекин, Китай", kk: "Бейжің, Қытай" },
    coordinates: [116.3975, 39.9087],
    locationKind: "event",
    sources: [
      {
        title: "China profile — Timeline",
        url: "https://www.bbc.com/news/world-asia-pacific-13017877",
        publisher: "BBC",
      },
    ],
  },
  {
    id: "prototype-baikonur-1955",
    slug: "baikonur-cosmodrome-founded",
    type: "event",
    title: {
      ru: "Создание космодрома Байконур",
      kk: "Байқоңыр ғарыш айлағының құрылуы",
    },
    summary: {
      ru: "В 1955 году началось создание испытательного полигона, позднее ставшего космодромом Байконур.",
      kk: "1955 жылы кейін Байқоңыр ғарыш айлағына айналған сынақ полигонын құру басталды.",
    },
    description: {
      ru: "Комплекс в Казахстане стал основной стартовой площадкой ранней советской космической программы.",
      kk: "Қазақстандағы кешен кеңестік ғарыш бағдарламасының алғашқы кезеңіндегі негізгі ұшыру алаңына айналды.",
    },
    significance: {
      ru: "С Байконура были запущены первый искусственный спутник Земли и первый пилотируемый космический корабль.",
      kk: "Байқоңырдан Жердің алғашқы жасанды серігі мен алғашқы адам басқаратын ғарыш кемесі ұшырылды.",
    },
    category: "space",
    startYear: 1955,
    endYear: 1955,
    dateLabel: { ru: "1955 год", kk: "1955 жыл" },
    location: { ru: "Байконур, Казахская ССР", kk: "Байқоңыр, Қазақ КСР" },
    coordinates: [63.342, 45.965],
    locationKind: "event",
    sources: [
      {
        title: "Baikonur Cosmodrome",
        url: "https://www.esa.int/Science_Exploration/Space_Science/Baikonur_Cosmodrome",
        publisher: "European Space Agency",
      },
    ],
  },
  {
    id: "prototype-sputnik-1957",
    slug: "sputnik-one",
    type: "event",
    title: {
      ru: "Запуск первого искусственного спутника Земли",
      kk: "Жердің алғашқы жасанды серігінің ұшырылуы",
    },
    summary: {
      ru: "4 октября 1957 года с Байконура был запущен «Спутник-1».",
      kk: "1957 жылғы 4 қазанда Байқоңырдан «Спутник-1» ұшырылды.",
    },
    description: {
      ru: "Небольшой аппарат передавал радиосигнал с орбиты и стал первым созданным человеком объектом на околоземной орбите.",
      kk: "Шағын аппарат орбитадан радиосигнал таратып, Жер маңындағы орбитаға шыққан адам жасаған алғашқы нысан болды.",
    },
    significance: {
      ru: "Запуск положил начало космической эре и ускорил международное соперничество в исследованиях космоса.",
      kk: "Ұшыру ғарыш дәуірін бастап, ғарышты зерттеудегі халықаралық бәсекені жеделдетті.",
    },
    category: "space",
    startYear: 1957,
    endYear: 1957,
    dateLabel: { ru: "4 октября 1957", kk: "1957 жылғы 4 қазан" },
    location: { ru: "Байконур, Казахская ССР", kk: "Байқоңыр, Қазақ КСР" },
    coordinates: [63.342, 45.965],
    locationKind: "event",
    sources: [
      {
        title: "Sputnik and the Dawn of the Space Age",
        url: "https://www.nasa.gov/history/sputnik/index.html",
        publisher: "NASA",
      },
    ],
  },
  {
    id: "prototype-belka-strelka-1960",
    slug: "belka-strelka-spaceflight",
    type: "event",
    title: {
      ru: "Полёт Белки и Стрелки",
      kk: "Белка мен Стрелканың ғарышқа ұшуы",
    },
    summary: {
      ru: "В августе 1960 года корабль с собаками Белкой и Стрелкой совершил орбитальный полёт и вернулся на Землю.",
      kk: "1960 жылғы тамызда Белка мен Стрелка мінген кеме орбиталық ұшу жасап, Жерге оралды.",
    },
    description: {
      ru: "Полёт подтвердил возможность безопасного возвращения живых организмов после длительного пребывания на орбите.",
      kk: "Ұшу тірі ағзалардың орбитада ұзақ уақыт болғаннан кейін қауіпсіз оралу мүмкіндігін растады.",
    },
    significance: {
      ru: "Миссия стала важным этапом подготовки первого пилотируемого космического полёта.",
      kk: "Миссия алғашқы адам басқаратын ғарыш сапарына дайындықтың маңызды кезеңі болды.",
    },
    category: "space",
    startYear: 1960,
    endYear: 1960,
    dateLabel: { ru: "19–20 августа 1960", kk: "1960 жылғы 19–20 тамыз" },
    location: { ru: "Байконур, Казахская ССР", kk: "Байқоңыр, Қазақ КСР" },
    coordinates: [63.342, 45.965],
    locationKind: "event",
    sources: [
      {
        title: "Animals in Space",
        url: "https://history.nasa.gov/animals.html",
        publisher: "NASA History",
      },
    ],
  },
  {
    id: "prototype-gagarin-1961",
    slug: "first-human-spaceflight",
    type: "event",
    title: {
      ru: "Первый полёт человека в космос",
      kk: "Адамның ғарышқа алғашқы ұшуы",
    },
    summary: {
      ru: "12 апреля 1961 года Юрий Гагарин стартовал с Байконура на корабле «Восток-1».",
      kk: "1961 жылғы 12 сәуірде Юрий Гагарин Байқоңырдан «Восток-1» кемесімен ұшты.",
    },
    description: {
      ru: "Корабль совершил один оборот вокруг Земли. Полёт продолжался 108 минут и завершился успешным возвращением космонавта.",
      kk: "Кеме Жерді бір рет айналып шықты. 108 минутқа созылған сапар ғарышкердің сәтті оралуымен аяқталды.",
    },
    significance: {
      ru: "Полёт доказал возможность пребывания человека в космосе и стал международным событием.",
      kk: "Ұшу адамның ғарышта болу мүмкіндігін дәлелдеп, халықаралық маңызы бар оқиғаға айналды.",
    },
    category: "space",
    startYear: 1961,
    endYear: 1961,
    dateLabel: { ru: "12 апреля 1961", kk: "1961 жылғы 12 сәуір" },
    location: { ru: "Байконур, Казахская ССР", kk: "Байқоңыр, Қазақ КСР" },
    coordinates: [63.342, 45.965],
    locationKind: "event",
    sources: [
      {
        title: "Yuri Gagarin becomes the first person in space",
        url: "https://science.nasa.gov/resource/yuri-gagarin-first-human-in-space/",
        publisher: "NASA",
      },
    ],
  },
  {
    id: "prototype-berlin-wall-1961",
    slug: "berlin-wall-construction",
    type: "event",
    title: {
      ru: "Начало строительства Берлинской стены",
      kk: "Берлин қабырғасының құрылысының басталуы",
    },
    summary: {
      ru: "13 августа 1961 года власти ГДР перекрыли границу между Восточным и Западным Берлином.",
      kk: "1961 жылғы 13 тамызда ГДР билігі Шығыс және Батыс Берлин арасындағы шекараны жапты.",
    },
    description: {
      ru: "Временные заграждения быстро превратились в укреплённую систему, разделившую город и семьи почти на три десятилетия.",
      kk: "Уақытша бөгеттер тез арада қаланы және отбасыларды отыз жылға жуық бөлген бекіністі жүйеге айналды.",
    },
    significance: {
      ru: "Стена стала одним из главных символов политического разделения Европы во время холодной войны.",
      kk: "Қабырға қырғи-қабақ соғыс кезіндегі Еуропаның саяси бөлінуінің басты нышандарының біріне айналды.",
    },
    category: "politics",
    startYear: 1961,
    endYear: 1961,
    dateLabel: { ru: "13 августа 1961", kk: "1961 жылғы 13 тамыз" },
    location: { ru: "Берлин, Германия", kk: "Берлин, Германия" },
    coordinates: [13.405, 52.52],
    locationKind: "event",
    sources: [
      {
        title: "The Berlin Wall",
        url: "https://www.nato.int/cps/en/natohq/declassified_136183.htm",
        publisher: "NATO",
      },
    ],
  },
  {
    id: "prototype-cuban-crisis-1962",
    slug: "cuban-missile-crisis",
    type: "event",
    title: {
      ru: "Карибский кризис",
      kk: "Кариб дағдарысы",
    },
    summary: {
      ru: "В октябре 1962 года размещение советских ракет на Кубе вызвало острое противостояние СССР и США.",
      kk: "1962 жылғы қазанда Кубада кеңестік зымырандардың орналастырылуы КСРО мен АҚШ арасындағы өткір текетіреске әкелді.",
    },
    description: {
      ru: "Тринадцатидневный кризис был урегулирован после переговоров и взаимных обязательств сторон.",
      kk: "Он үш күнге созылған дағдарыс келіссөздер мен тараптардың өзара міндеттемелерінен кейін реттелді.",
    },
    significance: {
      ru: "Мир оказался близок к ядерной войне, после чего сверхдержавы усилили механизмы прямой связи и контроля рисков.",
      kk: "Әлем ядролық соғысқа жақындады, содан кейін алпауыт державалар тікелей байланыс пен тәуекелдерді бақылау тетіктерін күшейтті.",
    },
    category: "politics",
    startYear: 1962,
    endYear: 1962,
    dateLabel: { ru: "16–28 октября 1962", kk: "1962 жылғы 16–28 қазан" },
    location: { ru: "Куба", kk: "Куба" },
    coordinates: [-82.3666, 23.1136],
    locationKind: "event",
    sources: [
      {
        title: "The Cuban Missile Crisis, October 1962",
        url: "https://history.state.gov/milestones/1961-1968/cuban-missile-crisis",
        publisher: "U.S. Department of State",
      },
    ],
  },
  {
    id: "prototype-tereshkova-1963",
    slug: "first-woman-in-space",
    type: "event",
    title: {
      ru: "Первый полёт женщины в космос",
      kk: "Әйел адамның ғарышқа алғашқы ұшуы",
    },
    summary: {
      ru: "16 июня 1963 года Валентина Терешкова стартовала с Байконура на корабле «Восток-6».",
      kk: "1963 жылғы 16 маусымда Валентина Терешкова Байқоңырдан «Восток-6» кемесімен ұшты.",
    },
    description: {
      ru: "За почти трое суток Терешкова совершила 48 оборотов вокруг Земли и стала первой женщиной-космонавтом.",
      kk: "Үш тәулікке жуық уақытта Терешкова Жерді 48 рет айналып, алғашқы әйел ғарышкер атанды.",
    },
    significance: {
      ru: "Полёт расширил представление об участии женщин в космической программе и стал важной частью истории пилотируемой космонавтики.",
      kk: "Ұшу әйелдердің ғарыш бағдарламасына қатысу мүмкіндігін кеңейтіп, адам басқаратын ғарыш тарихының маңызды бөлігіне айналды.",
    },
    category: "space",
    startYear: 1963,
    endYear: 1963,
    dateLabel: { ru: "16–19 июня 1963", kk: "1963 жылғы 16–19 маусым" },
    location: { ru: "Байконур, Казахская ССР", kk: "Байқоңыр, Қазақ КСР" },
    coordinates: [63.342, 45.965],
    locationKind: "event",
    sources: [
      {
        title: "Valentina Tereshkova and Vostok 6",
        url: "https://www.nasa.gov/history/sally-ride-and-valentina-tereshkova-changing-the-course-of-human-space-exploration/",
        publisher: "NASA",
      },
    ],
  },
  {
    id: "prototype-person-gagarin",
    slug: "yuri-gagarin",
    type: "person",
    title: { ru: "Юрий Гагарин", kk: "Юрий Гагарин" },
    summary: {
      ru: "Советский лётчик-космонавт, первый человек в мировой истории, совершивший полёт в космос.",
      kk: "Кеңес ғарышкері, әлем тарихында ғарышқа ұшқан алғашқы адам.",
    },
    description: {
      ru: "12 апреля 1961 года выполнил орбитальный полёт на корабле «Восток-1», стартовавшем с Байконура.",
      kk: "1961 жылғы 12 сәуірде Байқоңырдан ұшқан «Восток-1» кемесімен орбиталық сапар жасады.",
    },
    significance: null,
    category: "cosmonaut",
    startYear: 1934,
    endYear: 1968,
    dateLabel: { ru: "1934–1968", kk: "1934–1968" },
    location: { ru: "Байконур", kk: "Байқоңыр" },
    coordinates: [63.31, 45.92],
    locationKind: "period",
    sources: [
      {
        title: "Yuri Gagarin becomes the first person in space",
        url: "https://science.nasa.gov/resource/yuri-gagarin-first-human-in-space/",
        publisher: "NASA",
      },
    ],
  },
  {
    id: "prototype-person-tereshkova",
    slug: "valentina-tereshkova",
    type: "person",
    title: { ru: "Валентина Терешкова", kk: "Валентина Терешкова" },
    summary: {
      ru: "Первая женщина, совершившая космический полёт.",
      kk: "Ғарышқа ұшқан алғашқы әйел.",
    },
    description: {
      ru: "В июне 1963 года провела почти трое суток на орбите на корабле «Восток-6».",
      kk: "1963 жылғы маусымда «Восток-6» кемесімен орбитада үш тәулікке жуық болды.",
    },
    significance: null,
    category: "cosmonaut",
    startYear: 1937,
    endYear: null,
    dateLabel: { ru: "род. 1937", kk: "1937 ж. туған" },
    location: { ru: "Ярославская область", kk: "Ярославль облысы" },
    coordinates: [39.8737, 57.6261],
    locationKind: "biographical",
    sources: [
      {
        title: "Valentina Tereshkova and Vostok 6",
        url: "https://www.nasa.gov/history/sally-ride-and-valentina-tereshkova-changing-the-course-of-human-space-exploration/",
        publisher: "NASA",
      },
    ],
  },
  {
    id: "prototype-person-kunayev",
    slug: "dinmukhamed-kunayev",
    type: "person",
    title: { ru: "Динмухамед Кунаев", kk: "Дінмұхамед Қонаев" },
    summary: {
      ru: "Казахстанский государственный деятель, возглавлявший руководство Казахской ССР в разные периоды.",
      kk: "Қазақ КСР басшылығын әр кезеңде басқарған мемлекет қайраткері.",
    },
    description: {
      ru: "В январе 1960 года стал первым секретарём Центрального комитета Компартии Казахстана.",
      kk: "1960 жылғы қаңтарда Қазақстан Компартиясы Орталық Комитетінің бірінші хатшысы болды.",
    },
    significance: null,
    category: "politician",
    startYear: 1912,
    endYear: 1993,
    dateLabel: { ru: "1912–1993", kk: "1912–1993" },
    location: { ru: "Алма-Ата, Казахская ССР", kk: "Алматы, Қазақ КСР" },
    coordinates: [76.886, 43.238],
    locationKind: "biographical",
    sources: [
      {
        title: "Dinmukhamed Kunayev",
        url: "https://e-history.kz/en/prominent-figures/show/12730",
        publisher: "Qazaqstan Tarihy",
      },
    ],
  },
  {
    id: "prototype-person-momyshuly",
    slug: "baurzhan-momyshuly",
    type: "person",
    title: { ru: "Бауыржан Момышулы", kk: "Бауыржан Момышұлы" },
    summary: {
      ru: "Казахский военный офицер и писатель, участник Второй мировой войны.",
      kk: "Қазақ әскери офицері және жазушы, Екінші дүниежүзілік соғысқа қатысушы.",
    },
    description: {
      ru: "После военной службы занимался литературной работой; его произведения обращались к опыту войны и вопросам нравственности.",
      kk: "Әскери қызметтен кейін әдебиетпен айналысып, шығармаларында соғыс тәжірибесі мен адамгершілік мәселелерін көтерді.",
    },
    significance: null,
    category: "writer",
    startYear: 1910,
    endYear: 1982,
    dateLabel: { ru: "1910–1982", kk: "1910–1982" },
    location: { ru: "Алма-Ата, Казахская ССР", kk: "Алматы, Қазақ КСР" },
    coordinates: [76.93, 43.25],
    locationKind: "biographical",
    sources: [
      {
        title: "Bauyrzhan Momyshuly",
        url: "https://e-history.kz/en/calendar/show/27763",
        publisher: "Qazaqstan Tarihy",
      },
    ],
  },
  {
    id: "prototype-person-castro",
    slug: "fidel-castro",
    type: "person",
    title: { ru: "Фидель Кастро", kk: "Фидель Кастро" },
    summary: {
      ru: "Кубинский политический деятель, руководитель правительства Кубы в период Карибского кризиса.",
      kk: "Кариб дағдарысы кезінде Куба үкіметін басқарған кубалық саяси қайраткер.",
    },
    description: {
      ru: "После Кубинской революции возглавил правительство страны и стал одной из центральных фигур холодной войны в Латинской Америке.",
      kk: "Куба революциясынан кейін ел үкіметін басқарып, Латын Америкасындағы қырғи-қабақ соғыстың негізгі тұлғаларының біріне айналды.",
    },
    significance: null,
    category: "politician",
    startYear: 1926,
    endYear: 2016,
    dateLabel: { ru: "1926–2016", kk: "1926–2016" },
    location: { ru: "Гавана, Куба", kk: "Гавана, Куба" },
    coordinates: [-82.3666, 23.1136],
    locationKind: "biographical",
    sources: [
      {
        title: "Fidel Castro",
        url: "https://www.britannica.com/biography/Fidel-Castro",
        publisher: "Encyclopaedia Britannica",
      },
    ],
  },
];
