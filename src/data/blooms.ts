export type BloomMonth =
  | 'Jan'
  | 'Feb'
  | 'Mar'
  | 'Apr'
  | 'May'
  | 'Jun'
  | 'Jul'
  | 'Aug'
  | 'Sep'
  | 'Oct'
  | 'Nov'
  | 'Dec';

export type BloomEvent = {
  id: string;
  plant: string;
  commonName: string;
  locationName: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  bestMonths: BloomMonth[];
  seasonLabel: string;
  description: string;
  travelNote: string;
  sourceNote: string;
  imageEmoji: string;
};

export const monthOrder: BloomMonth[] = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const bloomEvents: BloomEvent[] = [
  {
    id: 'provence-lavender',
    plant: 'Lavandula',
    commonName: 'Lavender',
    locationName: 'Provence lavender fields',
    region: 'Provence-Alpes-Côte d’Azur',
    country: 'France',
    latitude: 43.9493,
    longitude: 5.7682,
    bestMonths: ['Jun', 'Jul'],
    seasonLabel: 'Late June to mid July',
    description:
      'Rolling purple fields around Valensole, Sault, and Luberon. One of the classic summer bloom trips in Europe.',
    travelNote: 'Go early morning or golden hour; harvest timing varies by altitude and weather.',
    sourceNote: 'Seed entry; verify annually against local tourism boards before production use.',
    imageEmoji: '💜',
  },
  {
    id: 'brihuega-lavender',
    plant: 'Lavandula',
    commonName: 'Lavender',
    locationName: 'Brihuega lavender fields',
    region: 'Castilla-La Mancha',
    country: 'Spain',
    latitude: 40.7606,
    longitude: -2.8704,
    bestMonths: ['Jul'],
    seasonLabel: 'July',
    description:
      'A concentrated lavender destination northeast of Madrid, known for July bloom and local lavender festival energy.',
    travelNote: 'Use Guadalajara/Madrid as a base; check festival and field access dates.',
    sourceNote: 'Seed entry; confirm with Brihuega tourism sources before production use.',
    imageEmoji: '🪻',
  },
  {
    id: 'japan-sakura',
    plant: 'Prunus serrulata',
    commonName: 'Cherry blossom',
    locationName: 'Tokyo and Kyoto sakura corridors',
    region: 'Honshu',
    country: 'Japan',
    latitude: 35.6764,
    longitude: 139.6500,
    bestMonths: ['Mar', 'Apr'],
    seasonLabel: 'Late March to early April',
    description:
      'Iconic spring bloom season across parks, riversides, temples, and city streets. Peak timing moves with weather.',
    travelNote: 'Watch annual sakura forecasts; book lodging early for peak weeks.',
    sourceNote: 'Seed entry; production version should ingest annual forecast data.',
    imageEmoji: '🌸',
  },
  {
    id: 'netherlands-tulips',
    plant: 'Tulipa',
    commonName: 'Tulip',
    locationName: 'Bollenstreek tulip fields',
    region: 'South Holland',
    country: 'Netherlands',
    latitude: 52.2671,
    longitude: 4.5456,
    bestMonths: ['Apr', 'May'],
    seasonLabel: 'Mid April to early May',
    description:
      'Color-block tulip fields around Lisse, Noordwijk, and Keukenhof. A very accessible first-time bloom trip.',
    travelNote: 'Respect field boundaries; many fields are working farms, not photo studios.',
    sourceNote: 'Seed entry; verify timing with Keukenhof/region updates.',
    imageEmoji: '🌷',
  },
  {
    id: 'ashikaga-wisteria',
    plant: 'Wisteria floribunda',
    commonName: 'Wisteria',
    locationName: 'Ashikaga Flower Park',
    region: 'Tochigi',
    country: 'Japan',
    latitude: 36.3147,
    longitude: 139.5222,
    bestMonths: ['Apr', 'May'],
    seasonLabel: 'Late April to mid May',
    description:
      'Canopies and tunnels of purple, white, and pink wisteria. One of Japan’s most photogenic late-spring flower trips.',
    travelNote: 'Visit at opening or evening illumination; peak weekends are crowded.',
    sourceNote: 'Seed entry; verify with park bloom reports.',
    imageEmoji: '💜',
  },
  {
    id: 'pretoria-jacaranda',
    plant: 'Jacaranda mimosifolia',
    commonName: 'Jacaranda',
    locationName: 'Pretoria jacaranda streets',
    region: 'Gauteng',
    country: 'South Africa',
    latitude: -25.7479,
    longitude: 28.2293,
    bestMonths: ['Oct', 'Nov'],
    seasonLabel: 'October to November',
    description:
      'Thousands of jacaranda trees turn streets purple in late spring, especially around older Pretoria neighborhoods.',
    travelNote: 'Use local bloom reports; flowering intensity depends on rain and temperature.',
    sourceNote: 'Seed entry; verify with local tourism/community reports.',
    imageEmoji: '💜',
  },
  {
    id: 'texas-bluebonnets',
    plant: 'Lupinus texensis',
    commonName: 'Bluebonnet',
    locationName: 'Texas Hill Country bluebonnet routes',
    region: 'Texas',
    country: 'United States',
    latitude: 30.2672,
    longitude: -98.8719,
    bestMonths: ['Mar', 'Apr'],
    seasonLabel: 'March to April',
    description:
      'Roadside fields and rolling Hill Country landscapes filled with bluebonnets and mixed spring wildflowers.',
    travelNote: 'Weather swings matter; check highway and wildflower reports before driving.',
    sourceNote: 'Seed entry; verify with Texas wildflower reports.',
    imageEmoji: '💙',
  },
  {
    id: 'tuscany-sunflowers',
    plant: 'Helianthus annuus',
    commonName: 'Sunflower',
    locationName: 'Tuscany sunflower fields',
    region: 'Tuscany',
    country: 'Italy',
    latitude: 43.3188,
    longitude: 11.3308,
    bestMonths: ['Jun', 'Jul'],
    seasonLabel: 'June to July',
    description:
      'Summer sunflower fields between hill towns, vineyards, and cypress-lined roads.',
    travelNote: 'Fields rotate year to year; treat sightings as route planning, not fixed attractions.',
    sourceNote: 'Seed entry; verify with current local travel reports.',
    imageEmoji: '🌻',
  },
  {
    id: 'antelope-poppies',
    plant: 'Eschscholzia californica',
    commonName: 'California poppy',
    locationName: 'Antelope Valley poppy reserve',
    region: 'California',
    country: 'United States',
    latitude: 34.7248,
    longitude: -118.3969,
    bestMonths: ['Mar', 'Apr'],
    seasonLabel: 'March to April',
    description:
      'Orange carpets of California poppies during strong superbloom years in the Mojave Desert grassland.',
    travelNote: 'Bloom quality varies dramatically with winter rain; check official reserve updates.',
    sourceNote: 'Seed entry; production version should include official bloom status links.',
    imageEmoji: '🧡',
  },
  {
    id: 'pinggu-peach',
    plant: 'Prunus persica',
    commonName: 'Peach blossom',
    locationName: 'Pinggu peach blossom area',
    region: 'Beijing',
    country: 'China',
    latitude: 40.1406,
    longitude: 117.1214,
    bestMonths: ['Mar', 'Apr'],
    seasonLabel: 'Late March to April',
    description:
      'Large peach-growing area with pink spring bloom across orchards and mountain-adjacent villages.',
    travelNote: 'Exact timing depends on spring temperatures; check district bloom festival dates.',
    sourceNote: 'Seed entry; verify with local tourism calendars.',
    imageEmoji: '🌸',
  },
  {
    id: 'hokkaido-lavender',
    plant: 'Lavandula',
    commonName: 'Lavender',
    locationName: 'Furano lavender fields',
    region: 'Hokkaido',
    country: 'Japan',
    latitude: 43.3420,
    longitude: 142.3832,
    bestMonths: ['Jul'],
    seasonLabel: 'July',
    description:
      'Northern Japan lavender fields, especially around Farm Tomita and Furano’s summer flower routes.',
    travelNote: 'Peak tends to be July; combine with wider Hokkaido summer flower fields.',
    sourceNote: 'Seed entry; verify with farm/region bloom reports.',
    imageEmoji: '🪻',
  },
  {
    id: 'madeira-hydrangeas',
    plant: 'Hydrangea macrophylla',
    commonName: 'Hydrangea',
    locationName: 'Madeira hydrangea roadsides',
    region: 'Madeira',
    country: 'Portugal',
    latitude: 32.7607,
    longitude: -16.9595,
    bestMonths: ['May', 'Jun', 'Jul'],
    seasonLabel: 'May to July',
    description:
      'Blue and purple hydrangeas line roads, levadas, and mountain routes across the island in late spring and summer.',
    travelNote: 'Renting a car helps; mountain weather can change quickly.',
    sourceNote: 'Seed entry; verify with Madeira seasonal travel guides.',
    imageEmoji: '💙',
  },
];
