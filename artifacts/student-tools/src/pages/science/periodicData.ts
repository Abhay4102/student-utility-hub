export type Phase = "solid" | "liquid" | "gas" | "synthetic";
export type Block = "s" | "p" | "d" | "f";

export type ElementCategory =
  | "alkali-metal" | "alkaline-earth" | "transition-metal" | "post-transition"
  | "metalloid" | "nonmetal" | "halogen" | "noble-gas"
  | "lanthanide" | "actinide";

export interface ElementData {
  number: number;
  symbol: string;
  name: string;
  mass: string;
  category: ElementCategory;
  period: number;
  group: number;
  config: string;
  melt?: string;
  boil?: string;
  discovered?: string;
  /** Pauling electronegativity */
  en?: number;
  /** Density g/cm³ (solids/liquids) or g/L (gases) */
  density?: number;
  /** Atomic radius (Van der Waals or empirical) in pm */
  radius?: number;
  phase: Phase;
  /** Short one-liner description / common use */
  note?: string;
}

export const ELEMENTS: ElementData[] = [
  { number: 1, symbol: "H", name: "Hydrogen", mass: "1.008", category: "nonmetal", period: 1, group: 1, config: "1s¹", melt: "-259.1°C", boil: "-252.9°C", discovered: "1766", en: 2.20, density: 0.09, radius: 53, phase: "gas", note: "Most abundant element in the universe; fuels stars." },
  { number: 2, symbol: "He", name: "Helium", mass: "4.003", category: "noble-gas", period: 1, group: 18, config: "1s²", boil: "-269°C", discovered: "1868", density: 0.18, radius: 31, phase: "gas", note: "Inert gas used in balloons and MRI cooling." },
  { number: 3, symbol: "Li", name: "Lithium", mass: "6.941", category: "alkali-metal", period: 2, group: 1, config: "[He] 2s¹", melt: "180.5°C", boil: "1342°C", discovered: "1817", en: 0.98, density: 0.53, radius: 167, phase: "solid", note: "Powers rechargeable batteries; treats bipolar disorder." },
  { number: 4, symbol: "Be", name: "Beryllium", mass: "9.012", category: "alkaline-earth", period: 2, group: 2, config: "[He] 2s²", melt: "1287°C", boil: "2469°C", discovered: "1797", en: 1.57, density: 1.85, radius: 112, phase: "solid", note: "Light and stiff; used in aerospace alloys." },
  { number: 5, symbol: "B", name: "Boron", mass: "10.811", category: "metalloid", period: 2, group: 13, config: "[He] 2s² 2p¹", melt: "2077°C", boil: "4000°C", discovered: "1808", en: 2.04, density: 2.34, radius: 87, phase: "solid", note: "Found in borax and tough boron-silicate glass." },
  { number: 6, symbol: "C", name: "Carbon", mass: "12.011", category: "nonmetal", period: 2, group: 14, config: "[He] 2s² 2p²", melt: "3550°C", boil: "4827°C", discovered: "ancient", en: 2.55, density: 2.27, radius: 67, phase: "solid", note: "Backbone of all known life; diamond and graphite." },
  { number: 7, symbol: "N", name: "Nitrogen", mass: "14.007", category: "nonmetal", period: 2, group: 15, config: "[He] 2s² 2p³", melt: "-210°C", boil: "-196°C", discovered: "1772", en: 3.04, density: 1.25, radius: 56, phase: "gas", note: "78% of Earth's atmosphere; key for proteins and DNA." },
  { number: 8, symbol: "O", name: "Oxygen", mass: "15.999", category: "nonmetal", period: 2, group: 16, config: "[He] 2s² 2p⁴", melt: "-218.8°C", boil: "-183°C", discovered: "1774", en: 3.44, density: 1.43, radius: 48, phase: "gas", note: "Essential for breathing and combustion." },
  { number: 9, symbol: "F", name: "Fluorine", mass: "18.998", category: "halogen", period: 2, group: 17, config: "[He] 2s² 2p⁵", melt: "-219.6°C", boil: "-188°C", discovered: "1886", en: 3.98, density: 1.70, radius: 42, phase: "gas", note: "Most electronegative element; in toothpaste and Teflon." },
  { number: 10, symbol: "Ne", name: "Neon", mass: "20.180", category: "noble-gas", period: 2, group: 18, config: "[He] 2s² 2p⁶", boil: "-246°C", discovered: "1898", density: 0.90, radius: 38, phase: "gas", note: "Glows red-orange in classic neon signs." },
  { number: 11, symbol: "Na", name: "Sodium", mass: "22.990", category: "alkali-metal", period: 3, group: 1, config: "[Ne] 3s¹", melt: "97.8°C", boil: "883°C", discovered: "1807", en: 0.93, density: 0.97, radius: 190, phase: "solid", note: "Half of table salt; vital for nerve signalling." },
  { number: 12, symbol: "Mg", name: "Magnesium", mass: "24.305", category: "alkaline-earth", period: 3, group: 2, config: "[Ne] 3s²", melt: "650°C", boil: "1091°C", discovered: "1755", en: 1.31, density: 1.74, radius: 145, phase: "solid", note: "Burns bright white; central atom in chlorophyll." },
  { number: 13, symbol: "Al", name: "Aluminum", mass: "26.982", category: "post-transition", period: 3, group: 13, config: "[Ne] 3s² 3p¹", melt: "660.3°C", boil: "2519°C", discovered: "1825", en: 1.61, density: 2.70, radius: 118, phase: "solid", note: "Lightweight metal — cans, foil, aircraft." },
  { number: 14, symbol: "Si", name: "Silicon", mass: "28.086", category: "metalloid", period: 3, group: 14, config: "[Ne] 3s² 3p²", melt: "1414°C", boil: "3265°C", discovered: "1823", en: 1.90, density: 2.33, radius: 111, phase: "solid", note: "Backbone of computer chips and glass." },
  { number: 15, symbol: "P", name: "Phosphorus", mass: "30.974", category: "nonmetal", period: 3, group: 15, config: "[Ne] 3s² 3p³", melt: "44.2°C", boil: "280°C", discovered: "1669", en: 2.19, density: 1.82, radius: 98, phase: "solid", note: "Found in DNA, matches and fertiliser." },
  { number: 16, symbol: "S", name: "Sulfur", mass: "32.065", category: "nonmetal", period: 3, group: 16, config: "[Ne] 3s² 3p⁴", melt: "112.8°C", boil: "444.6°C", discovered: "ancient", en: 2.58, density: 2.07, radius: 88, phase: "solid", note: "Yellow nonmetal; used to make sulfuric acid." },
  { number: 17, symbol: "Cl", name: "Chlorine", mass: "35.453", category: "halogen", period: 3, group: 17, config: "[Ne] 3s² 3p⁵", melt: "-101.5°C", boil: "-34.1°C", discovered: "1774", en: 3.16, density: 3.21, radius: 79, phase: "gas", note: "Disinfects pools and drinking water." },
  { number: 18, symbol: "Ar", name: "Argon", mass: "39.948", category: "noble-gas", period: 3, group: 18, config: "[Ne] 3s² 3p⁶", boil: "-185.9°C", discovered: "1894", density: 1.78, radius: 71, phase: "gas", note: "Inert gas in light bulbs and welding." },
  { number: 19, symbol: "K", name: "Potassium", mass: "39.098", category: "alkali-metal", period: 4, group: 1, config: "[Ar] 4s¹", melt: "63.4°C", boil: "759°C", discovered: "1807", en: 0.82, density: 0.86, radius: 243, phase: "solid", note: "Critical electrolyte; in bananas and fertilisers." },
  { number: 20, symbol: "Ca", name: "Calcium", mass: "40.078", category: "alkaline-earth", period: 4, group: 2, config: "[Ar] 4s²", melt: "842°C", boil: "1484°C", discovered: "1808", en: 1.00, density: 1.55, radius: 194, phase: "solid", note: "Builds bones, teeth and limestone." },
  { number: 21, symbol: "Sc", name: "Scandium", mass: "44.956", category: "transition-metal", period: 4, group: 3, config: "[Ar] 3d¹ 4s²", melt: "1541°C", boil: "2836°C", discovered: "1879", en: 1.36, density: 2.99, radius: 184, phase: "solid", note: "Strengthens aluminium for aerospace use." },
  { number: 22, symbol: "Ti", name: "Titanium", mass: "47.867", category: "transition-metal", period: 4, group: 4, config: "[Ar] 3d² 4s²", melt: "1668°C", boil: "3287°C", discovered: "1791", en: 1.54, density: 4.51, radius: 176, phase: "solid", note: "Strong, light, corrosion-resistant — implants and jets." },
  { number: 23, symbol: "V", name: "Vanadium", mass: "50.942", category: "transition-metal", period: 4, group: 5, config: "[Ar] 3d³ 4s²", melt: "1910°C", boil: "3407°C", discovered: "1801", en: 1.63, density: 6.0, radius: 171, phase: "solid", note: "Hardens steel for tools and springs." },
  { number: 24, symbol: "Cr", name: "Chromium", mass: "51.996", category: "transition-metal", period: 4, group: 6, config: "[Ar] 3d⁵ 4s¹", melt: "1907°C", boil: "2671°C", discovered: "1798", en: 1.66, density: 7.15, radius: 166, phase: "solid", note: "Gives stainless steel its shiny finish." },
  { number: 25, symbol: "Mn", name: "Manganese", mass: "54.938", category: "transition-metal", period: 4, group: 7, config: "[Ar] 3d⁵ 4s²", melt: "1246°C", boil: "2061°C", discovered: "1774", en: 1.55, density: 7.21, radius: 161, phase: "solid", note: "Hardens steel; essential trace mineral." },
  { number: 26, symbol: "Fe", name: "Iron", mass: "55.845", category: "transition-metal", period: 4, group: 8, config: "[Ar] 3d⁶ 4s²", melt: "1538°C", boil: "2862°C", discovered: "ancient", en: 1.83, density: 7.87, radius: 156, phase: "solid", note: "Most-used metal; carries oxygen in haemoglobin." },
  { number: 27, symbol: "Co", name: "Cobalt", mass: "58.933", category: "transition-metal", period: 4, group: 9, config: "[Ar] 3d⁷ 4s²", melt: "1495°C", boil: "2927°C", discovered: "1735", en: 1.88, density: 8.86, radius: 152, phase: "solid", note: "Powers lithium-ion batteries; deep-blue pigment." },
  { number: 28, symbol: "Ni", name: "Nickel", mass: "58.693", category: "transition-metal", period: 4, group: 10, config: "[Ar] 3d⁸ 4s²", melt: "1455°C", boil: "2913°C", discovered: "1751", en: 1.91, density: 8.91, radius: 149, phase: "solid", note: "Used in coins and stainless steel." },
  { number: 29, symbol: "Cu", name: "Copper", mass: "63.546", category: "transition-metal", period: 4, group: 11, config: "[Ar] 3d¹⁰ 4s¹", melt: "1085°C", boil: "2562°C", discovered: "ancient", en: 1.90, density: 8.96, radius: 145, phase: "solid", note: "Excellent electrical conductor; wires & pipes." },
  { number: 30, symbol: "Zn", name: "Zinc", mass: "65.38", category: "transition-metal", period: 4, group: 12, config: "[Ar] 3d¹⁰ 4s²", melt: "419.5°C", boil: "907°C", discovered: "ancient", en: 1.65, density: 7.13, radius: 142, phase: "solid", note: "Galvanises steel; essential dietary mineral." },
  { number: 31, symbol: "Ga", name: "Gallium", mass: "69.723", category: "post-transition", period: 4, group: 13, config: "[Ar] 3d¹⁰ 4s² 4p¹", melt: "29.8°C", boil: "2204°C", discovered: "1875", en: 1.81, density: 5.91, radius: 136, phase: "solid", note: "Melts in your hand — used in LEDs." },
  { number: 32, symbol: "Ge", name: "Germanium", mass: "72.630", category: "metalloid", period: 4, group: 14, config: "[Ar] 3d¹⁰ 4s² 4p²", melt: "938.2°C", boil: "2820°C", discovered: "1886", en: 2.01, density: 5.32, radius: 125, phase: "solid", note: "Semiconductor used in early transistors." },
  { number: 33, symbol: "As", name: "Arsenic", mass: "74.922", category: "metalloid", period: 4, group: 15, config: "[Ar] 3d¹⁰ 4s² 4p³", melt: "817°C", boil: "614°C", discovered: "1250", en: 2.18, density: 5.78, radius: 114, phase: "solid", note: "Highly toxic; historical poison and pesticide." },
  { number: 34, symbol: "Se", name: "Selenium", mass: "78.971", category: "nonmetal", period: 4, group: 16, config: "[Ar] 3d¹⁰ 4s² 4p⁴", melt: "220.8°C", boil: "685°C", discovered: "1817", en: 2.55, density: 4.81, radius: 103, phase: "solid", note: "Used in photocells and dandruff shampoo." },
  { number: 35, symbol: "Br", name: "Bromine", mass: "79.904", category: "halogen", period: 4, group: 17, config: "[Ar] 3d¹⁰ 4s² 4p⁵", melt: "-7.2°C", boil: "58.9°C", discovered: "1826", en: 2.96, density: 3.10, radius: 94, phase: "liquid", note: "One of two liquid elements at room temp." },
  { number: 36, symbol: "Kr", name: "Krypton", mass: "83.798", category: "noble-gas", period: 4, group: 18, config: "[Ar] 3d¹⁰ 4s² 4p⁶", boil: "-153.2°C", discovered: "1898", en: 3.00, density: 3.75, radius: 88, phase: "gas", note: "Used in high-intensity flash lamps." },
  { number: 37, symbol: "Rb", name: "Rubidium", mass: "85.468", category: "alkali-metal", period: 5, group: 1, config: "[Kr] 5s¹", melt: "39.3°C", boil: "688°C", discovered: "1861", en: 0.82, density: 1.53, radius: 265, phase: "solid", note: "Soft, silvery metal — atomic clocks." },
  { number: 38, symbol: "Sr", name: "Strontium", mass: "87.62", category: "alkaline-earth", period: 5, group: 2, config: "[Kr] 5s²", melt: "769°C", boil: "1382°C", discovered: "1790", en: 0.95, density: 2.64, radius: 219, phase: "solid", note: "Gives fireworks their bright red colour." },
  { number: 39, symbol: "Y", name: "Yttrium", mass: "88.906", category: "transition-metal", period: 5, group: 3, config: "[Kr] 4d¹ 5s²", melt: "1526°C", boil: "3345°C", discovered: "1794", en: 1.22, density: 4.47, radius: 212, phase: "solid", note: "Used in red phosphors for old TVs." },
  { number: 40, symbol: "Zr", name: "Zirconium", mass: "91.224", category: "transition-metal", period: 5, group: 4, config: "[Kr] 4d² 5s²", melt: "1855°C", boil: "4409°C", discovered: "1789", en: 1.33, density: 6.51, radius: 206, phase: "solid", note: "Corrosion-resistant; nuclear-reactor cladding." },
  { number: 41, symbol: "Nb", name: "Niobium", mass: "92.906", category: "transition-metal", period: 5, group: 5, config: "[Kr] 4d⁴ 5s¹", melt: "2477°C", boil: "4744°C", discovered: "1801", en: 1.6, density: 8.57, radius: 198, phase: "solid", note: "Superconducting magnet wires." },
  { number: 42, symbol: "Mo", name: "Molybdenum", mass: "95.96", category: "transition-metal", period: 5, group: 6, config: "[Kr] 4d⁵ 5s¹", melt: "2623°C", boil: "4639°C", discovered: "1781", en: 2.16, density: 10.28, radius: 190, phase: "solid", note: "High-strength steel alloying element." },
  { number: 43, symbol: "Tc", name: "Technetium", mass: "98", category: "transition-metal", period: 5, group: 7, config: "[Kr] 4d⁵ 5s²", melt: "2157°C", boil: "4265°C", discovered: "1937", en: 1.9, density: 11.0, radius: 183, phase: "solid", note: "First artificial element; medical imaging." },
  { number: 44, symbol: "Ru", name: "Ruthenium", mass: "101.07", category: "transition-metal", period: 5, group: 8, config: "[Kr] 4d⁷ 5s¹", melt: "2334°C", boil: "4150°C", discovered: "1844", en: 2.2, density: 12.45, radius: 178, phase: "solid", note: "Hard platinum-group metal — electrical contacts." },
  { number: 45, symbol: "Rh", name: "Rhodium", mass: "102.906", category: "transition-metal", period: 5, group: 9, config: "[Kr] 4d⁸ 5s¹", melt: "1964°C", boil: "3695°C", discovered: "1803", en: 2.28, density: 12.41, radius: 173, phase: "solid", note: "Catalytic converters; rarer than gold." },
  { number: 46, symbol: "Pd", name: "Palladium", mass: "106.42", category: "transition-metal", period: 5, group: 10, config: "[Kr] 4d¹⁰", melt: "1555°C", boil: "2963°C", discovered: "1803", en: 2.20, density: 12.02, radius: 169, phase: "solid", note: "Absorbs hydrogen; used in catalysts." },
  { number: 47, symbol: "Ag", name: "Silver", mass: "107.868", category: "transition-metal", period: 5, group: 11, config: "[Kr] 4d¹⁰ 5s¹", melt: "961.8°C", boil: "2162°C", discovered: "ancient", en: 1.93, density: 10.49, radius: 165, phase: "solid", note: "Best electrical conductor; jewellery and coins." },
  { number: 48, symbol: "Cd", name: "Cadmium", mass: "112.411", category: "transition-metal", period: 5, group: 12, config: "[Kr] 4d¹⁰ 5s²", melt: "321.1°C", boil: "767°C", discovered: "1817", en: 1.69, density: 8.65, radius: 161, phase: "solid", note: "Toxic; used in rechargeable Ni-Cd batteries." },
  { number: 49, symbol: "In", name: "Indium", mass: "114.818", category: "post-transition", period: 5, group: 13, config: "[Kr] 4d¹⁰ 5s² 5p¹", melt: "156.6°C", boil: "2072°C", discovered: "1863", en: 1.78, density: 7.31, radius: 156, phase: "solid", note: "Touch-screen transparent conductive coatings." },
  { number: 50, symbol: "Sn", name: "Tin", mass: "118.710", category: "post-transition", period: 5, group: 14, config: "[Kr] 4d¹⁰ 5s² 5p²", melt: "231.9°C", boil: "2602°C", discovered: "ancient", en: 1.96, density: 7.31, radius: 145, phase: "solid", note: "Used in solder and tin cans (plating)." },
  { number: 51, symbol: "Sb", name: "Antimony", mass: "121.760", category: "metalloid", period: 5, group: 15, config: "[Kr] 4d¹⁰ 5s² 5p³", melt: "630.6°C", boil: "1587°C", discovered: "ancient", en: 2.05, density: 6.69, radius: 133, phase: "solid", note: "Used in flame retardants." },
  { number: 52, symbol: "Te", name: "Tellurium", mass: "127.60", category: "metalloid", period: 5, group: 16, config: "[Kr] 4d¹⁰ 5s² 5p⁴", melt: "449.5°C", boil: "988°C", discovered: "1782", en: 2.1, density: 6.24, radius: 123, phase: "solid", note: "Solar cells and rewritable optical discs." },
  { number: 53, symbol: "I", name: "Iodine", mass: "126.904", category: "halogen", period: 5, group: 17, config: "[Kr] 4d¹⁰ 5s² 5p⁵", melt: "113.7°C", boil: "184.3°C", discovered: "1811", en: 2.66, density: 4.93, radius: 115, phase: "solid", note: "Disinfectant; needed for thyroid hormones." },
  { number: 54, symbol: "Xe", name: "Xenon", mass: "131.293", category: "noble-gas", period: 5, group: 18, config: "[Kr] 4d¹⁰ 5s² 5p⁶", boil: "-108.1°C", discovered: "1898", en: 2.6, density: 5.90, radius: 108, phase: "gas", note: "Bright car headlamps; ion thrusters." },
  { number: 55, symbol: "Cs", name: "Cesium", mass: "132.905", category: "alkali-metal", period: 6, group: 1, config: "[Xe] 6s¹", melt: "28.4°C", boil: "671°C", discovered: "1860", en: 0.79, density: 1.87, radius: 298, phase: "solid", note: "Defines the SI second via atomic clocks." },
  { number: 56, symbol: "Ba", name: "Barium", mass: "137.327", category: "alkaline-earth", period: 6, group: 2, config: "[Xe] 6s²", melt: "727°C", boil: "1870°C", discovered: "1808", en: 0.89, density: 3.62, radius: 253, phase: "solid", note: "Used in medical X-ray contrast meals." },
  { number: 57, symbol: "La", name: "Lanthanum", mass: "138.905", category: "lanthanide", period: 6, group: 4, config: "[Xe] 5d¹ 6s²", melt: "920°C", boil: "3464°C", discovered: "1839", en: 1.10, density: 6.15, radius: 226, phase: "solid", note: "High-end camera lenses (low dispersion glass)." },
  { number: 58, symbol: "Ce", name: "Cerium", mass: "140.116", category: "lanthanide", period: 6, group: 5, config: "[Xe] 4f¹ 5d¹ 6s²", melt: "798°C", boil: "3443°C", discovered: "1803", en: 1.12, density: 6.77, radius: 210, phase: "solid", note: "Catalytic converters; lighter flints." },
  { number: 59, symbol: "Pr", name: "Praseodymium", mass: "140.908", category: "lanthanide", period: 6, group: 6, config: "[Xe] 4f³ 6s²", melt: "931°C", boil: "3520°C", discovered: "1885", en: 1.13, density: 6.77, radius: 247, phase: "solid", note: "Yellow glass colorant; aircraft engine magnets." },
  { number: 60, symbol: "Nd", name: "Neodymium", mass: "144.242", category: "lanthanide", period: 6, group: 7, config: "[Xe] 4f⁴ 6s²", melt: "1021°C", boil: "3074°C", discovered: "1885", en: 1.14, density: 7.01, radius: 206, phase: "solid", note: "World's strongest permanent magnets." },
  { number: 61, symbol: "Pm", name: "Promethium", mass: "145", category: "lanthanide", period: 6, group: 8, config: "[Xe] 4f⁵ 6s²", melt: "1042°C", boil: "3000°C", discovered: "1945", en: 1.13, density: 7.26, radius: 205, phase: "synthetic", note: "Radioactive; in luminous instrument dials." },
  { number: 62, symbol: "Sm", name: "Samarium", mass: "150.36", category: "lanthanide", period: 6, group: 9, config: "[Xe] 4f⁶ 6s²", melt: "1074°C", boil: "1794°C", discovered: "1879", en: 1.17, density: 7.52, radius: 238, phase: "solid", note: "Heat-resistant permanent magnets." },
  { number: 63, symbol: "Eu", name: "Europium", mass: "151.964", category: "lanthanide", period: 6, group: 10, config: "[Xe] 4f⁷ 6s²", melt: "822°C", boil: "1529°C", discovered: "1901", en: 1.2, density: 5.24, radius: 231, phase: "solid", note: "Red and blue phosphors in screens." },
  { number: 64, symbol: "Gd", name: "Gadolinium", mass: "157.25", category: "lanthanide", period: 6, group: 11, config: "[Xe] 4f⁷ 5d¹ 6s²", melt: "1313°C", boil: "3273°C", discovered: "1880", en: 1.20, density: 7.90, radius: 233, phase: "solid", note: "MRI contrast agent; great neutron absorber." },
  { number: 65, symbol: "Tb", name: "Terbium", mass: "158.925", category: "lanthanide", period: 6, group: 12, config: "[Xe] 4f⁹ 6s²", melt: "1356°C", boil: "3230°C", discovered: "1843", en: 1.10, density: 8.23, radius: 225, phase: "solid", note: "Green light in trichromatic lamps." },
  { number: 66, symbol: "Dy", name: "Dysprosium", mass: "162.500", category: "lanthanide", period: 6, group: 13, config: "[Xe] 4f¹⁰ 6s²", melt: "1412°C", boil: "2567°C", discovered: "1886", en: 1.22, density: 8.55, radius: 228, phase: "solid", note: "High-temp neodymium magnets for EV motors." },
  { number: 67, symbol: "Ho", name: "Holmium", mass: "164.930", category: "lanthanide", period: 6, group: 14, config: "[Xe] 4f¹¹ 6s²", melt: "1474°C", boil: "2700°C", discovered: "1878", en: 1.23, density: 8.80, radius: 226, phase: "solid", note: "Strongest magnetic field of any element." },
  { number: 68, symbol: "Er", name: "Erbium", mass: "167.259", category: "lanthanide", period: 6, group: 15, config: "[Xe] 4f¹² 6s²", melt: "1529°C", boil: "2868°C", discovered: "1843", en: 1.24, density: 9.07, radius: 226, phase: "solid", note: "Amplifies signals in fibre-optic cables." },
  { number: 69, symbol: "Tm", name: "Thulium", mass: "168.934", category: "lanthanide", period: 6, group: 16, config: "[Xe] 4f¹³ 6s²", melt: "1545°C", boil: "1950°C", discovered: "1879", en: 1.25, density: 9.32, radius: 222, phase: "solid", note: "Portable X-ray devices." },
  { number: 70, symbol: "Yb", name: "Ytterbium", mass: "173.054", category: "lanthanide", period: 6, group: 17, config: "[Xe] 4f¹⁴ 6s²", melt: "824°C", boil: "1196°C", discovered: "1878", en: 1.1, density: 6.97, radius: 222, phase: "solid", note: "Used in next-gen atomic clocks." },
  { number: 71, symbol: "Lu", name: "Lutetium", mass: "174.967", category: "lanthanide", period: 6, group: 18, config: "[Xe] 4f¹⁴ 5d¹ 6s²", melt: "1663°C", boil: "3402°C", discovered: "1907", en: 1.27, density: 9.84, radius: 217, phase: "solid", note: "Rarest stable rare-earth; PET scanners." },
  { number: 72, symbol: "Hf", name: "Hafnium", mass: "178.49", category: "transition-metal", period: 6, group: 4, config: "[Xe] 4f¹⁴ 5d² 6s²", melt: "2233°C", boil: "4603°C", discovered: "1923", en: 1.3, density: 13.31, radius: 208, phase: "solid", note: "Nuclear reactor control rods." },
  { number: 73, symbol: "Ta", name: "Tantalum", mass: "180.948", category: "transition-metal", period: 6, group: 5, config: "[Xe] 4f¹⁴ 5d³ 6s²", melt: "3017°C", boil: "5458°C", discovered: "1802", en: 1.5, density: 16.65, radius: 200, phase: "solid", note: "Tiny capacitors in every phone." },
  { number: 74, symbol: "W", name: "Tungsten", mass: "183.84", category: "transition-metal", period: 6, group: 6, config: "[Xe] 4f¹⁴ 5d⁴ 6s²", melt: "3422°C", boil: "5555°C", discovered: "1783", en: 2.36, density: 19.25, radius: 193, phase: "solid", note: "Highest melting point of any metal." },
  { number: 75, symbol: "Re", name: "Rhenium", mass: "186.207", category: "transition-metal", period: 6, group: 7, config: "[Xe] 4f¹⁴ 5d⁵ 6s²", melt: "3186°C", boil: "5596°C", discovered: "1925", en: 1.9, density: 21.02, radius: 188, phase: "solid", note: "Jet engine turbine blades." },
  { number: 76, symbol: "Os", name: "Osmium", mass: "190.23", category: "transition-metal", period: 6, group: 8, config: "[Xe] 4f¹⁴ 5d⁶ 6s²", melt: "3033°C", boil: "5012°C", discovered: "1803", en: 2.2, density: 22.59, radius: 185, phase: "solid", note: "Densest naturally occurring element." },
  { number: 77, symbol: "Ir", name: "Iridium", mass: "192.217", category: "transition-metal", period: 6, group: 9, config: "[Xe] 4f¹⁴ 5d⁷ 6s²", melt: "2446°C", boil: "4428°C", discovered: "1803", en: 2.20, density: 22.56, radius: 180, phase: "solid", note: "Most corrosion-resistant metal known." },
  { number: 78, symbol: "Pt", name: "Platinum", mass: "195.084", category: "transition-metal", period: 6, group: 10, config: "[Xe] 4f¹⁴ 5d⁹ 6s¹", melt: "1768°C", boil: "3825°C", discovered: "1735", en: 2.28, density: 21.45, radius: 177, phase: "solid", note: "Catalytic converters; fine jewellery." },
  { number: 79, symbol: "Au", name: "Gold", mass: "196.967", category: "transition-metal", period: 6, group: 11, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹", melt: "1064°C", boil: "2856°C", discovered: "ancient", en: 2.54, density: 19.30, radius: 174, phase: "solid", note: "Doesn't tarnish; jewellery and electronics." },
  { number: 80, symbol: "Hg", name: "Mercury", mass: "200.59", category: "transition-metal", period: 6, group: 12, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s²", melt: "-38.8°C", boil: "356.7°C", discovered: "ancient", en: 2.00, density: 13.53, radius: 171, phase: "liquid", note: "Only metal liquid at room temperature." },
  { number: 81, symbol: "Tl", name: "Thallium", mass: "204.383", category: "post-transition", period: 6, group: 13, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹", melt: "304°C", boil: "1473°C", discovered: "1861", en: 1.62, density: 11.85, radius: 156, phase: "solid", note: "Highly toxic; once used as rat poison." },
  { number: 82, symbol: "Pb", name: "Lead", mass: "207.2", category: "post-transition", period: 6, group: 14, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²", melt: "327.5°C", boil: "1749°C", discovered: "ancient", en: 2.33, density: 11.34, radius: 154, phase: "solid", note: "Dense; shields against X-rays and gamma rays." },
  { number: 83, symbol: "Bi", name: "Bismuth", mass: "208.980", category: "post-transition", period: 6, group: 15, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³", melt: "271.4°C", boil: "1564°C", discovered: "1753", en: 2.02, density: 9.78, radius: 143, phase: "solid", note: "Forms rainbow stair-step crystals." },
  { number: 84, symbol: "Po", name: "Polonium", mass: "209", category: "metalloid", period: 6, group: 16, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴", melt: "254°C", boil: "962°C", discovered: "1898", en: 2.0, density: 9.20, radius: 135, phase: "solid", note: "Highly radioactive; discovered by the Curies." },
  { number: 85, symbol: "At", name: "Astatine", mass: "210", category: "halogen", period: 6, group: 17, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵", melt: "302°C", boil: "337°C", discovered: "1940", en: 2.2, radius: 127, phase: "solid", note: "Rarest natural element on Earth." },
  { number: 86, symbol: "Rn", name: "Radon", mass: "222", category: "noble-gas", period: 6, group: 18, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶", boil: "-61.7°C", discovered: "1900", density: 9.73, radius: 120, phase: "gas", note: "Radioactive gas; seeps into basements." },
  { number: 87, symbol: "Fr", name: "Francium", mass: "223", category: "alkali-metal", period: 7, group: 1, config: "[Rn] 7s¹", melt: "27°C", boil: "677°C", discovered: "1939", en: 0.7, radius: 348, phase: "solid", note: "Highly radioactive; <30g exists on Earth." },
  { number: 88, symbol: "Ra", name: "Radium", mass: "226", category: "alkaline-earth", period: 7, group: 2, config: "[Rn] 7s²", melt: "700°C", boil: "1737°C", discovered: "1898", en: 0.9, density: 5.50, radius: 283, phase: "solid", note: "Glows in the dark; once in watch dials." },
  { number: 89, symbol: "Ac", name: "Actinium", mass: "227", category: "actinide", period: 7, group: 4, config: "[Rn] 6d¹ 7s²", melt: "1051°C", boil: "3198°C", discovered: "1899", en: 1.1, density: 10.07, radius: 247, phase: "solid", note: "150× more radioactive than radium." },
  { number: 90, symbol: "Th", name: "Thorium", mass: "232.038", category: "actinide", period: 7, group: 5, config: "[Rn] 6d² 7s²", melt: "1750°C", boil: "4788°C", discovered: "1829", en: 1.3, density: 11.72, radius: 245, phase: "solid", note: "Potential next-generation nuclear fuel." },
  { number: 91, symbol: "Pa", name: "Protactinium", mass: "231.036", category: "actinide", period: 7, group: 6, config: "[Rn] 5f² 6d¹ 7s²", melt: "1572°C", boil: "4000°C", discovered: "1913", en: 1.5, density: 15.37, radius: 243, phase: "solid", note: "Rare and very radioactive." },
  { number: 92, symbol: "U", name: "Uranium", mass: "238.029", category: "actinide", period: 7, group: 7, config: "[Rn] 5f³ 6d¹ 7s²", melt: "1135°C", boil: "4131°C", discovered: "1789", en: 1.38, density: 19.05, radius: 241, phase: "solid", note: "Powers nuclear reactors and weapons." },
  { number: 93, symbol: "Np", name: "Neptunium", mass: "237", category: "actinide", period: 7, group: 8, config: "[Rn] 5f⁴ 6d¹ 7s²", melt: "644°C", boil: "4000°C", discovered: "1940", en: 1.36, density: 20.45, radius: 239, phase: "solid", note: "First synthetic transuranic element." },
  { number: 94, symbol: "Pu", name: "Plutonium", mass: "244", category: "actinide", period: 7, group: 9, config: "[Rn] 5f⁶ 7s²", melt: "640°C", boil: "3228°C", discovered: "1940", en: 1.28, density: 19.84, radius: 243, phase: "solid", note: "Fuel for nuclear bombs and reactors." },
  { number: 95, symbol: "Am", name: "Americium", mass: "243", category: "actinide", period: 7, group: 10, config: "[Rn] 5f⁷ 7s²", melt: "1176°C", boil: "2607°C", discovered: "1944", en: 1.13, density: 13.69, radius: 244, phase: "solid", note: "Inside household smoke detectors." },
  { number: 96, symbol: "Cm", name: "Curium", mass: "247", category: "actinide", period: 7, group: 11, config: "[Rn] 5f⁷ 6d¹ 7s²", melt: "1345°C", boil: "3110°C", discovered: "1944", en: 1.28, density: 13.51, radius: 245, phase: "solid", note: "Glows purple from intense radioactivity." },
  { number: 97, symbol: "Bk", name: "Berkelium", mass: "247", category: "actinide", period: 7, group: 12, config: "[Rn] 5f⁹ 7s²", melt: "986°C", discovered: "1949", en: 1.3, density: 14.78, radius: 244, phase: "solid", note: "Synthetic; named for Berkeley, California." },
  { number: 98, symbol: "Cf", name: "Californium", mass: "251", category: "actinide", period: 7, group: 13, config: "[Rn] 5f¹⁰ 7s²", melt: "900°C", discovered: "1950", en: 1.3, density: 15.10, radius: 245, phase: "solid", note: "Neutron source for cancer treatment." },
  { number: 99, symbol: "Es", name: "Einsteinium", mass: "252", category: "actinide", period: 7, group: 14, config: "[Rn] 5f¹¹ 7s²", melt: "860°C", discovered: "1952", en: 1.3, density: 8.84, radius: 245, phase: "synthetic", note: "Discovered in H-bomb test fallout." },
  { number: 100, symbol: "Fm", name: "Fermium", mass: "257", category: "actinide", period: 7, group: 15, config: "[Rn] 5f¹² 7s²", discovered: "1952", en: 1.3, radius: 245, phase: "synthetic", note: "Named after physicist Enrico Fermi." },
  { number: 101, symbol: "Md", name: "Mendelevium", mass: "258", category: "actinide", period: 7, group: 16, config: "[Rn] 5f¹³ 7s²", discovered: "1955", en: 1.3, radius: 246, phase: "synthetic", note: "Named after Dmitri Mendeleev." },
  { number: 102, symbol: "No", name: "Nobelium", mass: "259", category: "actinide", period: 7, group: 17, config: "[Rn] 5f¹⁴ 7s²", discovered: "1966", en: 1.3, radius: 246, phase: "synthetic", note: "Named after Alfred Nobel." },
  { number: 103, symbol: "Lr", name: "Lawrencium", mass: "262", category: "actinide", period: 7, group: 18, config: "[Rn] 5f¹⁴ 7p¹", discovered: "1961", en: 1.3, radius: 246, phase: "synthetic", note: "Last of the actinide series." },
  { number: 104, symbol: "Rf", name: "Rutherfordium", mass: "267", category: "transition-metal", period: 7, group: 4, config: "[Rn] 5f¹⁴ 6d² 7s²", discovered: "1969", radius: 257, phase: "synthetic", note: "Highly radioactive; named for Rutherford." },
  { number: 105, symbol: "Db", name: "Dubnium", mass: "268", category: "transition-metal", period: 7, group: 5, config: "[Rn] 5f¹⁴ 6d³ 7s²", discovered: "1970", radius: 249, phase: "synthetic", note: "Named after Dubna, Russia." },
  { number: 106, symbol: "Sg", name: "Seaborgium", mass: "271", category: "transition-metal", period: 7, group: 6, config: "[Rn] 5f¹⁴ 6d⁴ 7s²", discovered: "1974", radius: 243, phase: "synthetic", note: "Named after Glenn T. Seaborg." },
  { number: 107, symbol: "Bh", name: "Bohrium", mass: "272", category: "transition-metal", period: 7, group: 7, config: "[Rn] 5f¹⁴ 6d⁵ 7s²", discovered: "1981", radius: 241, phase: "synthetic", note: "Named after Niels Bohr." },
  { number: 108, symbol: "Hs", name: "Hassium", mass: "277", category: "transition-metal", period: 7, group: 8, config: "[Rn] 5f¹⁴ 6d⁶ 7s²", discovered: "1984", radius: 234, phase: "synthetic", note: "Latin name for Hesse, Germany." },
  { number: 109, symbol: "Mt", name: "Meitnerium", mass: "278", category: "transition-metal", period: 7, group: 9, config: "[Rn] 5f¹⁴ 6d⁷ 7s²", discovered: "1982", radius: 229, phase: "synthetic", note: "Named after Lise Meitner." },
  { number: 110, symbol: "Ds", name: "Darmstadtium", mass: "281", category: "transition-metal", period: 7, group: 10, config: "[Rn] 5f¹⁴ 6d⁸ 7s²", discovered: "1994", radius: 228, phase: "synthetic", note: "Named for Darmstadt, Germany." },
  { number: 111, symbol: "Rg", name: "Roentgenium", mass: "282", category: "transition-metal", period: 7, group: 11, config: "[Rn] 5f¹⁴ 6d¹⁰ 7s¹", discovered: "1994", radius: 228, phase: "synthetic", note: "Named for Wilhelm Röntgen (X-rays)." },
  { number: 112, symbol: "Cn", name: "Copernicium", mass: "285", category: "transition-metal", period: 7, group: 12, config: "[Rn] 5f¹⁴ 6d¹⁰ 7s²", discovered: "1996", radius: 233, phase: "synthetic", note: "Named after Nicolaus Copernicus." },
  { number: 113, symbol: "Nh", name: "Nihonium", mass: "286", category: "post-transition", period: 7, group: 13, config: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹", discovered: "2004", radius: 236, phase: "synthetic", note: "First element discovered in Asia (Japan)." },
  { number: 114, symbol: "Fl", name: "Flerovium", mass: "289", category: "post-transition", period: 7, group: 14, config: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²", discovered: "1999", radius: 243, phase: "synthetic", note: "Named after physicist Georgy Flerov." },
  { number: 115, symbol: "Mc", name: "Moscovium", mass: "290", category: "post-transition", period: 7, group: 15, config: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³", discovered: "2003", radius: 162, phase: "synthetic", note: "Named after Moscow Oblast, Russia." },
  { number: 116, symbol: "Lv", name: "Livermorium", mass: "293", category: "post-transition", period: 7, group: 16, config: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴", discovered: "2000", radius: 175, phase: "synthetic", note: "Named after Lawrence Livermore Lab." },
  { number: 117, symbol: "Ts", name: "Tennessine", mass: "294", category: "halogen", period: 7, group: 17, config: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵", discovered: "2010", radius: 165, phase: "synthetic", note: "Named after the state of Tennessee." },
  { number: 118, symbol: "Og", name: "Oganesson", mass: "294", category: "noble-gas", period: 7, group: 18, config: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶", discovered: "2002", radius: 157, phase: "synthetic", note: "Heaviest element ever made; only a few atoms." },
];

export const CATEGORY_STYLES: Record<ElementCategory, {
  cell: string; cellHover: string; text: string; ring: string;
  badgeBg: string; badgeText: string; gradient: string; label: string;
}> = {
  "alkali-metal":     { cell: "bg-rose-100/90 dark:bg-rose-950/60 border-rose-300 dark:border-rose-500/40",       cellHover: "hover:bg-rose-200 dark:hover:bg-rose-900/70",       text: "text-rose-900 dark:text-rose-100",       ring: "ring-rose-500",       badgeBg: "bg-rose-100 dark:bg-rose-950/60",       badgeText: "text-rose-700 dark:text-rose-300",       gradient: "from-rose-500/20 to-rose-600/10",       label: "Alkali Metal" },
  "alkaline-earth":   { cell: "bg-orange-100/90 dark:bg-orange-950/60 border-orange-300 dark:border-orange-500/40", cellHover: "hover:bg-orange-200 dark:hover:bg-orange-900/70", text: "text-orange-900 dark:text-orange-100", ring: "ring-orange-500",   badgeBg: "bg-orange-100 dark:bg-orange-950/60",   badgeText: "text-orange-700 dark:text-orange-300", gradient: "from-orange-500/20 to-orange-600/10",   label: "Alkaline Earth" },
  "transition-metal": { cell: "bg-amber-100/90 dark:bg-amber-950/60 border-amber-300 dark:border-amber-500/40",   cellHover: "hover:bg-amber-200 dark:hover:bg-amber-900/70",   text: "text-amber-900 dark:text-amber-100",   ring: "ring-amber-500",     badgeBg: "bg-amber-100 dark:bg-amber-950/60",     badgeText: "text-amber-700 dark:text-amber-300",   gradient: "from-amber-500/20 to-amber-600/10",     label: "Transition Metal" },
  "post-transition":  { cell: "bg-lime-100/90 dark:bg-lime-950/60 border-lime-300 dark:border-lime-500/40",       cellHover: "hover:bg-lime-200 dark:hover:bg-lime-900/70",       text: "text-lime-900 dark:text-lime-100",       ring: "ring-lime-500",       badgeBg: "bg-lime-100 dark:bg-lime-950/60",       badgeText: "text-lime-700 dark:text-lime-300",     gradient: "from-lime-500/20 to-lime-600/10",       label: "Post-Transition Metal" },
  "metalloid":        { cell: "bg-teal-100/90 dark:bg-teal-950/60 border-teal-300 dark:border-teal-500/40",       cellHover: "hover:bg-teal-200 dark:hover:bg-teal-900/70",       text: "text-teal-900 dark:text-teal-100",       ring: "ring-teal-500",       badgeBg: "bg-teal-100 dark:bg-teal-950/60",       badgeText: "text-teal-700 dark:text-teal-300",     gradient: "from-teal-500/20 to-teal-600/10",       label: "Metalloid" },
  "nonmetal":         { cell: "bg-sky-100/90 dark:bg-sky-950/60 border-sky-300 dark:border-sky-500/40",           cellHover: "hover:bg-sky-200 dark:hover:bg-sky-900/70",         text: "text-sky-900 dark:text-sky-100",         ring: "ring-sky-500",         badgeBg: "bg-sky-100 dark:bg-sky-950/60",         badgeText: "text-sky-700 dark:text-sky-300",       gradient: "from-sky-500/20 to-sky-600/10",         label: "Nonmetal" },
  "halogen":          { cell: "bg-violet-100/90 dark:bg-violet-950/60 border-violet-300 dark:border-violet-500/40", cellHover: "hover:bg-violet-200 dark:hover:bg-violet-900/70", text: "text-violet-900 dark:text-violet-100", ring: "ring-violet-500",     badgeBg: "bg-violet-100 dark:bg-violet-950/60",   badgeText: "text-violet-700 dark:text-violet-300", gradient: "from-violet-500/20 to-violet-600/10",   label: "Halogen" },
  "noble-gas":        { cell: "bg-slate-200/90 dark:bg-slate-800/70 border-slate-400 dark:border-slate-500/50",   cellHover: "hover:bg-slate-300 dark:hover:bg-slate-700/80",   text: "text-slate-900 dark:text-slate-100",   ring: "ring-slate-500",     badgeBg: "bg-slate-200 dark:bg-slate-800/70",     badgeText: "text-slate-700 dark:text-slate-300",   gradient: "from-slate-500/20 to-slate-600/10",     label: "Noble Gas" },
  "lanthanide":       { cell: "bg-pink-100/90 dark:bg-pink-950/60 border-pink-300 dark:border-pink-500/40",       cellHover: "hover:bg-pink-200 dark:hover:bg-pink-900/70",       text: "text-pink-900 dark:text-pink-100",       ring: "ring-pink-500",       badgeBg: "bg-pink-100 dark:bg-pink-950/60",       badgeText: "text-pink-700 dark:text-pink-300",     gradient: "from-pink-500/20 to-pink-600/10",       label: "Lanthanide" },
  "actinide":         { cell: "bg-fuchsia-100/90 dark:bg-fuchsia-950/60 border-fuchsia-300 dark:border-fuchsia-500/40", cellHover: "hover:bg-fuchsia-200 dark:hover:bg-fuchsia-900/70", text: "text-fuchsia-900 dark:text-fuchsia-100", ring: "ring-fuchsia-500", badgeBg: "bg-fuchsia-100 dark:bg-fuchsia-950/60", badgeText: "text-fuchsia-700 dark:text-fuchsia-300", gradient: "from-fuchsia-500/20 to-fuchsia-600/10", label: "Actinide" },
};

/**
 * Column position in the 32-wide extended (long-form) periodic table.
 *   s-block (group 1-2)      → cols 1-2
 *   f-block (lanthanides)    → cols 3-17  (La #57 → col 3 … Lu #71 → col 17)
 *   f-block (actinides)      → cols 3-17  (Ac #89 → col 3 … Lr #103 → col 17)
 *   d-block group 3          → col 17     (Sc, Y stay here)
 *   d-block (group 4-12)     → cols 18-26
 *   p-block (group 13-18)    → cols 27-32
 */
export function xCol(el: ElementData): number {
  if (el.category === "lanthanide") return el.number - 54; // 57→3 … 71→17
  if (el.category === "actinide")   return el.number - 86; // 89→3 … 103→17
  if (el.group <= 2) return el.group;
  return el.group + 14; // 3→17, 4→18 … 18→32
}

export function getBlock(el: ElementData): Block {
  if (el.category === "lanthanide" || el.category === "actinide") return "f";
  if (el.category === "transition-metal") return "d";
  if (el.category === "alkali-metal" || el.category === "alkaline-earth") return "s";
  if (el.symbol === "He") return "s";
  return "p";
}

/**
 * Compute electron shell occupancy for atomic number Z using Madelung
 * (n+l) ordering. This is the textbook approximation — a handful of
 * real-world exceptions (Cr, Cu, Pd, etc.) differ by ±1 electron in
 * the outermost shells; close enough for an educational Bohr diagram.
 */
export function getShells(z: number): number[] {
  // (shell, capacity) in fill order: 1s 2s 2p 3s 3p 4s 3d 4p 5s 4d 5p 6s 4f 5d 6p 7s 5f 6d 7p
  const FILL: Array<[number, number]> = [
    [1, 2], [2, 2], [2, 6], [3, 2], [3, 6], [4, 2], [3, 10],
    [4, 6], [5, 2], [4, 10], [5, 6], [6, 2], [4, 14], [5, 10],
    [6, 6], [7, 2], [5, 14], [6, 10], [7, 6],
  ];
  const shells: number[] = [];
  let remaining = z;
  for (const [n, cap] of FILL) {
    if (remaining <= 0) break;
    const put = Math.min(remaining, cap);
    shells[n - 1] = (shells[n - 1] || 0) + put;
    remaining -= put;
  }
  // Backfill empty shells with 0 so length === highest n
  for (let i = 0; i < shells.length; i++) if (shells[i] === undefined) shells[i] = 0;
  return shells;
}
