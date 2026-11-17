export const CATEGORIES = {
  Newspaper: 14,
  Books: 12,
  Paper: 10,
  Cardboard: 9,
  'Plastic bottles': 18,
  'PET bottles': 22,
  'HDPE containers': 16,
  'Plastic film': 6,
  'Tetra packs': 4,
  'Mixed plastic': 8,
  'Glass bottles': 3,
  'Aluminum cans': 110,
  'Iron and steel': 32,
  Copper: 620,
  Brass: 410,
  'Cables & wires': 95,
  'E-Waste': 60,
  'Mobile phones': 120,
  'Small electronics': 45,
  Batteries: 25,
  Appliances: 25,
  Textiles: 15,
  'Used cooking oil': 25,
  Wood: 4,
  Other: 5
}

const LABEL_RULES = [
  { pattern: /newspaper|newsprint/, category: 'Newspaper' },
  { pattern: /book|notebook|paperback|comic/, category: 'Books' },
  { pattern: /tetra pack|juice carton|milk carton/, category: 'Tetra packs' },
  { pattern: /cardboard|carton|box|envelope/, category: 'Cardboard' },
  { pattern: /wine glass|beer glass|glass bottle|jar|goblet/, category: 'Glass bottles' },
  { pattern: /pet bottle|plastic bottle|water jug|pop bottle/, category: 'PET bottles' },
  { pattern: /hdpe|detergent bottle|shampoo bottle|plastic container/, category: 'HDPE containers' },
  { pattern: /plastic bag|plastic wrap|plastic film/, category: 'Plastic film' },
  { pattern: /plastic/, category: 'Mixed plastic' },
  { pattern: /can opener|tin can|pop can|soda can|beer can|aluminum/, category: 'Aluminum cans' },
  { pattern: /copper/, category: 'Copper' },
  { pattern: /brass/, category: 'Brass' },
  { pattern: /cable|wire/, category: 'Cables & wires' },
  { pattern: /smartphone|mobile phone|cellular telephone/, category: 'Mobile phones' },
  { pattern: /calculator|headphone|earphone|game controller|router/, category: 'Small electronics' },
  { pattern: /iron|steel|chain|wrench|hammer|nail|screw|metal/, category: 'Iron and steel' },
  { pattern: /battery|power bank/, category: 'Batteries' },
  { pattern: /laptop|computer|keyboard|mouse|monitor|screen|telephone|cellular|remote control|printer|camera|ipod|radio|speaker|charger|tablet|television|tv/, category: 'E-Waste' },
  { pattern: /microwave|washing machine|refrigerator|dishwasher|toaster|stove|vacuum|blender|coffeemaker|appliance/, category: 'Appliances' },
  { pattern: /shirt|jersey|jean|denim|sock|sweater|coat|dress|shoe|sandal|fabric|towel|textile/, category: 'Textiles' },
  { pattern: /wood|wooden|timber|lumber/, category: 'Wood' },
  { pattern: /paper|book jacket|tissue|toilet paper/, category: 'Paper' }
]

let mobilenetPromise
async function loadImageClassifier() {
  if (!mobilenetPromise) {
    mobilenetPromise = import('@tensorflow-models/mobilenet')
      .then(({ load }) => load({ version: 2, alpha: 0.5 }))
      .catch(error => {
        mobilenetPromise = null
        throw error
      })
  }
  return mobilenetPromise
}

export async function recognizeScrap(file) {
  if (!file || !file.type.startsWith('image/')) throw new Error('Choose an image file to identify the product.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Choose an image smaller than 10 MB.')
  if (typeof createImageBitmap !== 'function') throw new Error('Image recognition is not supported in this browser.')

  const image = await createImageBitmap(file)
  try {
    const model = await loadImageClassifier()
    const predictions = await model.classify(image, 5)
    if (!predictions.length) throw new Error('The image classifier did not find a product. Try a clearer photo.')
    const matches = predictions.map(prediction => {
      const rule = LABEL_RULES.find(candidate => candidate.pattern.test(prediction.className.toLowerCase()))
      return { label: prediction.className, confidence: prediction.probability, category: rule?.category || 'Other' }
    })
    const best = matches[0]
    return {
      category: best.category,
      confidence: best.confidence,
      label: best.label,
      perKg: CATEGORIES[best.category],
      alternatives: [...new Set(matches.map(match => match.category))].slice(0, 4)
    }
  } finally {
    image.close()
  }
}
export const predictPrices = (base, months = 6) => ['Dec','Jan','Feb','Mar','Apr','May'].slice(0, months).map((month, i) => ({ month, price: +(base * (1 + 0.015 * i + 0.04 * Math.sin(i))).toFixed(1) }))
export function batchPickups(pickups, minGroup = 2) { // group small pickups by area so one trip serves many
  const g = {}; pickups.forEach(p => (g[p.area] ||= []).push(p))
  return Object.entries(g).filter(([, l]) => l.length >= minGroup).map(([area, list]) => ({ area, list, kg: list.reduce((s, p) => s + p.weight, 0), saved: (list.length - 1) * 80 })) }
const d = (a, b) => Math.hypot(a.lat - b.lat, a.lng - b.lng)
export function optimizeRoute(stops, start) { // nearest-neighbour heuristic
  const left = [...stops], out = []; let cur = start
  while (left.length) { left.sort((a, b) => d(cur, a) - d(cur, b)); cur = left.shift(); out.push(cur) }
  return out }
export const impact = kg => ({ trees: +(kg * 0.017).toFixed(1), co2: Math.round(kg * 1.2), water: Math.round(kg * 26), energy: Math.round(kg * 4.1), landfill: kg })
