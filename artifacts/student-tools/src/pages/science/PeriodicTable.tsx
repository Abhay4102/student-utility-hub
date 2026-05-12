import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { FlaskConical, X } from "lucide-react";

type ElementData = {
  number: number;
  symbol: string;
  name: string;
  mass: string;
  category: string;
  period: number;
  group: number;
  config: string;
  melt?: string;
  boil?: string;
  discovered?: string;
};

const ELEMENTS: ElementData[] = [
  { number: 1, symbol: "H", name: "Hydrogen", mass: "1.008", category: "nonmetal", period: 1, group: 1, config: "1s¹", melt: "-259.1°C", boil: "-252.9°C", discovered: "1766" },
  { number: 2, symbol: "He", name: "Helium", mass: "4.003", category: "noble-gas", period: 1, group: 18, config: "1s²", boil: "-269°C", discovered: "1868" },
  { number: 3, symbol: "Li", name: "Lithium", mass: "6.941", category: "alkali-metal", period: 2, group: 1, config: "[He] 2s¹", melt: "180.5°C", boil: "1342°C", discovered: "1817" },
  { number: 4, symbol: "Be", name: "Beryllium", mass: "9.012", category: "alkaline-earth", period: 2, group: 2, config: "[He] 2s²", melt: "1287°C", boil: "2469°C", discovered: "1797" },
  { number: 5, symbol: "B", name: "Boron", mass: "10.811", category: "metalloid", period: 2, group: 13, config: "[He] 2s² 2p¹", melt: "2077°C", boil: "4000°C", discovered: "1808" },
  { number: 6, symbol: "C", name: "Carbon", mass: "12.011", category: "nonmetal", period: 2, group: 14, config: "[He] 2s² 2p²", melt: "3550°C", boil: "4827°C", discovered: "ancient" },
  { number: 7, symbol: "N", name: "Nitrogen", mass: "14.007", category: "nonmetal", period: 2, group: 15, config: "[He] 2s² 2p³", melt: "-210°C", boil: "-196°C", discovered: "1772" },
  { number: 8, symbol: "O", name: "Oxygen", mass: "15.999", category: "nonmetal", period: 2, group: 16, config: "[He] 2s² 2p⁴", melt: "-218.8°C", boil: "-183°C", discovered: "1774" },
  { number: 9, symbol: "F", name: "Fluorine", mass: "18.998", category: "halogen", period: 2, group: 17, config: "[He] 2s² 2p⁵", melt: "-219.6°C", boil: "-188°C", discovered: "1886" },
  { number: 10, symbol: "Ne", name: "Neon", mass: "20.180", category: "noble-gas", period: 2, group: 18, config: "[He] 2s² 2p⁶", boil: "-246°C", discovered: "1898" },
  { number: 11, symbol: "Na", name: "Sodium", mass: "22.990", category: "alkali-metal", period: 3, group: 1, config: "[Ne] 3s¹", melt: "97.8°C", boil: "883°C", discovered: "1807" },
  { number: 12, symbol: "Mg", name: "Magnesium", mass: "24.305", category: "alkaline-earth", period: 3, group: 2, config: "[Ne] 3s²", melt: "650°C", boil: "1091°C", discovered: "1755" },
  { number: 13, symbol: "Al", name: "Aluminum", mass: "26.982", category: "post-transition", period: 3, group: 13, config: "[Ne] 3s² 3p¹", melt: "660.3°C", boil: "2519°C", discovered: "1825" },
  { number: 14, symbol: "Si", name: "Silicon", mass: "28.086", category: "metalloid", period: 3, group: 14, config: "[Ne] 3s² 3p²", melt: "1414°C", boil: "3265°C", discovered: "1823" },
  { number: 15, symbol: "P", name: "Phosphorus", mass: "30.974", category: "nonmetal", period: 3, group: 15, config: "[Ne] 3s² 3p³", melt: "44.2°C", boil: "280°C", discovered: "1669" },
  { number: 16, symbol: "S", name: "Sulfur", mass: "32.065", category: "nonmetal", period: 3, group: 16, config: "[Ne] 3s² 3p⁴", melt: "112.8°C", boil: "444.6°C", discovered: "ancient" },
  { number: 17, symbol: "Cl", name: "Chlorine", mass: "35.453", category: "halogen", period: 3, group: 17, config: "[Ne] 3s² 3p⁵", melt: "-101.5°C", boil: "-34.1°C", discovered: "1774" },
  { number: 18, symbol: "Ar", name: "Argon", mass: "39.948", category: "noble-gas", period: 3, group: 18, config: "[Ne] 3s² 3p⁶", boil: "-185.9°C", discovered: "1894" },
  { number: 19, symbol: "K", name: "Potassium", mass: "39.098", category: "alkali-metal", period: 4, group: 1, config: "[Ar] 4s¹", melt: "63.4°C", boil: "759°C", discovered: "1807" },
  { number: 20, symbol: "Ca", name: "Calcium", mass: "40.078", category: "alkaline-earth", period: 4, group: 2, config: "[Ar] 4s²", melt: "842°C", boil: "1484°C", discovered: "1808" },
  { number: 21, symbol: "Sc", name: "Scandium", mass: "44.956", category: "transition-metal", period: 4, group: 3, config: "[Ar] 3d¹ 4s²", melt: "1541°C", boil: "2836°C", discovered: "1879" },
  { number: 22, symbol: "Ti", name: "Titanium", mass: "47.867", category: "transition-metal", period: 4, group: 4, config: "[Ar] 3d² 4s²", melt: "1668°C", boil: "3287°C", discovered: "1791" },
  { number: 23, symbol: "V", name: "Vanadium", mass: "50.942", category: "transition-metal", period: 4, group: 5, config: "[Ar] 3d³ 4s²", melt: "1910°C", boil: "3407°C", discovered: "1801" },
  { number: 24, symbol: "Cr", name: "Chromium", mass: "51.996", category: "transition-metal", period: 4, group: 6, config: "[Ar] 3d⁵ 4s¹", melt: "1907°C", boil: "2671°C", discovered: "1798" },
  { number: 25, symbol: "Mn", name: "Manganese", mass: "54.938", category: "transition-metal", period: 4, group: 7, config: "[Ar] 3d⁵ 4s²", melt: "1246°C", boil: "2061°C", discovered: "1774" },
  { number: 26, symbol: "Fe", name: "Iron", mass: "55.845", category: "transition-metal", period: 4, group: 8, config: "[Ar] 3d⁶ 4s²", melt: "1538°C", boil: "2862°C", discovered: "ancient" },
  { number: 27, symbol: "Co", name: "Cobalt", mass: "58.933", category: "transition-metal", period: 4, group: 9, config: "[Ar] 3d⁷ 4s²", melt: "1495°C", boil: "2927°C", discovered: "1735" },
  { number: 28, symbol: "Ni", name: "Nickel", mass: "58.693", category: "transition-metal", period: 4, group: 10, config: "[Ar] 3d⁸ 4s²", melt: "1455°C", boil: "2913°C", discovered: "1751" },
  { number: 29, symbol: "Cu", name: "Copper", mass: "63.546", category: "transition-metal", period: 4, group: 11, config: "[Ar] 3d¹⁰ 4s¹", melt: "1085°C", boil: "2562°C", discovered: "ancient" },
  { number: 30, symbol: "Zn", name: "Zinc", mass: "65.38", category: "transition-metal", period: 4, group: 12, config: "[Ar] 3d¹⁰ 4s²", melt: "419.5°C", boil: "907°C", discovered: "ancient" },
  { number: 31, symbol: "Ga", name: "Gallium", mass: "69.723", category: "post-transition", period: 4, group: 13, config: "[Ar] 3d¹⁰ 4s² 4p¹", melt: "29.8°C", boil: "2204°C", discovered: "1875" },
  { number: 32, symbol: "Ge", name: "Germanium", mass: "72.630", category: "metalloid", period: 4, group: 14, config: "[Ar] 3d¹⁰ 4s² 4p²", melt: "938.2°C", boil: "2820°C", discovered: "1886" },
  { number: 33, symbol: "As", name: "Arsenic", mass: "74.922", category: "metalloid", period: 4, group: 15, config: "[Ar] 3d¹⁰ 4s² 4p³", melt: "817°C", boil: "614°C", discovered: "1250" },
  { number: 34, symbol: "Se", name: "Selenium", mass: "78.971", category: "nonmetal", period: 4, group: 16, config: "[Ar] 3d¹⁰ 4s² 4p⁴", melt: "220.8°C", boil: "685°C", discovered: "1817" },
  { number: 35, symbol: "Br", name: "Bromine", mass: "79.904", category: "halogen", period: 4, group: 17, config: "[Ar] 3d¹⁰ 4s² 4p⁵", melt: "-7.2°C", boil: "58.9°C", discovered: "1826" },
  { number: 36, symbol: "Kr", name: "Krypton", mass: "83.798", category: "noble-gas", period: 4, group: 18, config: "[Ar] 3d¹⁰ 4s² 4p⁶", boil: "-153.2°C", discovered: "1898" },
  { number: 37, symbol: "Rb", name: "Rubidium", mass: "85.468", category: "alkali-metal", period: 5, group: 1, config: "[Kr] 5s¹", melt: "39.3°C", boil: "688°C", discovered: "1861" },
  { number: 38, symbol: "Sr", name: "Strontium", mass: "87.62", category: "alkaline-earth", period: 5, group: 2, config: "[Kr] 5s²", melt: "769°C", boil: "1382°C", discovered: "1790" },
  { number: 39, symbol: "Y", name: "Yttrium", mass: "88.906", category: "transition-metal", period: 5, group: 3, config: "[Kr] 4d¹ 5s²", melt: "1526°C", boil: "3345°C", discovered: "1794" },
  { number: 40, symbol: "Zr", name: "Zirconium", mass: "91.224", category: "transition-metal", period: 5, group: 4, config: "[Kr] 4d² 5s²", melt: "1855°C", boil: "4409°C", discovered: "1789" },
  { number: 41, symbol: "Nb", name: "Niobium", mass: "92.906", category: "transition-metal", period: 5, group: 5, config: "[Kr] 4d⁴ 5s¹", melt: "2477°C", boil: "4744°C", discovered: "1801" },
  { number: 42, symbol: "Mo", name: "Molybdenum", mass: "95.96", category: "transition-metal", period: 5, group: 6, config: "[Kr] 4d⁵ 5s¹", melt: "2623°C", boil: "4639°C", discovered: "1781" },
  { number: 43, symbol: "Tc", name: "Technetium", mass: "98", category: "transition-metal", period: 5, group: 7, config: "[Kr] 4d⁵ 5s²", melt: "2157°C", boil: "4265°C", discovered: "1937" },
  { number: 44, symbol: "Ru", name: "Ruthenium", mass: "101.07", category: "transition-metal", period: 5, group: 8, config: "[Kr] 4d⁷ 5s¹", melt: "2334°C", boil: "4150°C", discovered: "1844" },
  { number: 45, symbol: "Rh", name: "Rhodium", mass: "102.906", category: "transition-metal", period: 5, group: 9, config: "[Kr] 4d⁸ 5s¹", melt: "1964°C", boil: "3695°C", discovered: "1803" },
  { number: 46, symbol: "Pd", name: "Palladium", mass: "106.42", category: "transition-metal", period: 5, group: 10, config: "[Kr] 4d¹⁰", melt: "1555°C", boil: "2963°C", discovered: "1803" },
  { number: 47, symbol: "Ag", name: "Silver", mass: "107.868", category: "transition-metal", period: 5, group: 11, config: "[Kr] 4d¹⁰ 5s¹", melt: "961.8°C", boil: "2162°C", discovered: "ancient" },
  { number: 48, symbol: "Cd", name: "Cadmium", mass: "112.411", category: "transition-metal", period: 5, group: 12, config: "[Kr] 4d¹⁰ 5s²", melt: "321.1°C", boil: "767°C", discovered: "1817" },
  { number: 49, symbol: "In", name: "Indium", mass: "114.818", category: "post-transition", period: 5, group: 13, config: "[Kr] 4d¹⁰ 5s² 5p¹", melt: "156.6°C", boil: "2072°C", discovered: "1863" },
  { number: 50, symbol: "Sn", name: "Tin", mass: "118.710", category: "post-transition", period: 5, group: 14, config: "[Kr] 4d¹⁰ 5s² 5p²", melt: "231.9°C", boil: "2602°C", discovered: "ancient" },
  { number: 51, symbol: "Sb", name: "Antimony", mass: "121.760", category: "metalloid", period: 5, group: 15, config: "[Kr] 4d¹⁰ 5s² 5p³", melt: "630.6°C", boil: "1587°C", discovered: "ancient" },
  { number: 52, symbol: "Te", name: "Tellurium", mass: "127.60", category: "metalloid", period: 5, group: 16, config: "[Kr] 4d¹⁰ 5s² 5p⁴", melt: "449.5°C", boil: "988°C", discovered: "1782" },
  { number: 53, symbol: "I", name: "Iodine", mass: "126.904", category: "halogen", period: 5, group: 17, config: "[Kr] 4d¹⁰ 5s² 5p⁵", melt: "113.7°C", boil: "184.3°C", discovered: "1811" },
  { number: 54, symbol: "Xe", name: "Xenon", mass: "131.293", category: "noble-gas", period: 5, group: 18, config: "[Kr] 4d¹⁰ 5s² 5p⁶", boil: "-108.1°C", discovered: "1898" },
  { number: 55, symbol: "Cs", name: "Cesium", mass: "132.905", category: "alkali-metal", period: 6, group: 1, config: "[Xe] 6s¹", melt: "28.4°C", boil: "671°C", discovered: "1860" },
  { number: 56, symbol: "Ba", name: "Barium", mass: "137.327", category: "alkaline-earth", period: 6, group: 2, config: "[Xe] 6s²", melt: "727°C", boil: "1870°C", discovered: "1808" },
  { number: 57, symbol: "La", name: "Lanthanum", mass: "138.905", category: "lanthanide", period: 9, group: 4, config: "[Xe] 5d¹ 6s²", melt: "920°C", boil: "3464°C", discovered: "1839" },
  { number: 58, symbol: "Ce", name: "Cerium", mass: "140.116", category: "lanthanide", period: 9, group: 5, config: "[Xe] 4f¹ 5d¹ 6s²", melt: "798°C", boil: "3443°C", discovered: "1803" },
  { number: 59, symbol: "Pr", name: "Praseodymium", mass: "140.908", category: "lanthanide", period: 9, group: 6, config: "[Xe] 4f³ 6s²", melt: "931°C", boil: "3520°C", discovered: "1885" },
  { number: 60, symbol: "Nd", name: "Neodymium", mass: "144.242", category: "lanthanide", period: 9, group: 7, config: "[Xe] 4f⁴ 6s²", melt: "1021°C", boil: "3074°C", discovered: "1885" },
  { number: 61, symbol: "Pm", name: "Promethium", mass: "145", category: "lanthanide", period: 9, group: 8, config: "[Xe] 4f⁵ 6s²", melt: "1042°C", boil: "3000°C", discovered: "1945" },
  { number: 62, symbol: "Sm", name: "Samarium", mass: "150.36", category: "lanthanide", period: 9, group: 9, config: "[Xe] 4f⁶ 6s²", melt: "1074°C", boil: "1794°C", discovered: "1879" },
  { number: 63, symbol: "Eu", name: "Europium", mass: "151.964", category: "lanthanide", period: 9, group: 10, config: "[Xe] 4f⁷ 6s²", melt: "822°C", boil: "1529°C", discovered: "1901" },
  { number: 64, symbol: "Gd", name: "Gadolinium", mass: "157.25", category: "lanthanide", period: 9, group: 11, config: "[Xe] 4f⁷ 5d¹ 6s²", melt: "1313°C", boil: "3273°C", discovered: "1880" },
  { number: 65, symbol: "Tb", name: "Terbium", mass: "158.925", category: "lanthanide", period: 9, group: 12, config: "[Xe] 4f⁹ 6s²", melt: "1356°C", boil: "3230°C", discovered: "1843" },
  { number: 66, symbol: "Dy", name: "Dysprosium", mass: "162.500", category: "lanthanide", period: 9, group: 13, config: "[Xe] 4f¹⁰ 6s²", melt: "1412°C", boil: "2567°C", discovered: "1886" },
  { number: 67, symbol: "Ho", name: "Holmium", mass: "164.930", category: "lanthanide", period: 9, group: 14, config: "[Xe] 4f¹¹ 6s²", melt: "1474°C", boil: "2700°C", discovered: "1878" },
  { number: 68, symbol: "Er", name: "Erbium", mass: "167.259", category: "lanthanide", period: 9, group: 15, config: "[Xe] 4f¹² 6s²", melt: "1529°C", boil: "2868°C", discovered: "1843" },
  { number: 69, symbol: "Tm", name: "Thulium", mass: "168.934", category: "lanthanide", period: 9, group: 16, config: "[Xe] 4f¹³ 6s²", melt: "1545°C", boil: "1950°C", discovered: "1879" },
  { number: 70, symbol: "Yb", name: "Ytterbium", mass: "173.054", category: "lanthanide", period: 9, group: 17, config: "[Xe] 4f¹⁴ 6s²", melt: "824°C", boil: "1196°C", discovered: "1878" },
  { number: 71, symbol: "Lu", name: "Lutetium", mass: "174.967", category: "lanthanide", period: 9, group: 18, config: "[Xe] 4f¹⁴ 5d¹ 6s²", melt: "1663°C", boil: "3402°C", discovered: "1907" },
  { number: 72, symbol: "Hf", name: "Hafnium", mass: "178.49", category: "transition-metal", period: 6, group: 4, config: "[Xe] 4f¹⁴ 5d² 6s²", melt: "2233°C", boil: "4603°C", discovered: "1923" },
  { number: 73, symbol: "Ta", name: "Tantalum", mass: "180.948", category: "transition-metal", period: 6, group: 5, config: "[Xe] 4f¹⁴ 5d³ 6s²", melt: "3017°C", boil: "5458°C", discovered: "1802" },
  { number: 74, symbol: "W", name: "Tungsten", mass: "183.84", category: "transition-metal", period: 6, group: 6, config: "[Xe] 4f¹⁴ 5d⁴ 6s²", melt: "3422°C", boil: "5555°C", discovered: "1783" },
  { number: 75, symbol: "Re", name: "Rhenium", mass: "186.207", category: "transition-metal", period: 6, group: 7, config: "[Xe] 4f¹⁴ 5d⁵ 6s²", melt: "3186°C", boil: "5596°C", discovered: "1925" },
  { number: 76, symbol: "Os", name: "Osmium", mass: "190.23", category: "transition-metal", period: 6, group: 8, config: "[Xe] 4f¹⁴ 5d⁶ 6s²", melt: "3033°C", boil: "5012°C", discovered: "1803" },
  { number: 77, symbol: "Ir", name: "Iridium", mass: "192.217", category: "transition-metal", period: 6, group: 9, config: "[Xe] 4f¹⁴ 5d⁷ 6s²", melt: "2446°C", boil: "4428°C", discovered: "1803" },
  { number: 78, symbol: "Pt", name: "Platinum", mass: "195.084", category: "transition-metal", period: 6, group: 10, config: "[Xe] 4f¹⁴ 5d⁹ 6s¹", melt: "1768°C", boil: "3825°C", discovered: "1735" },
  { number: 79, symbol: "Au", name: "Gold", mass: "196.967", category: "transition-metal", period: 6, group: 11, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹", melt: "1064°C", boil: "2856°C", discovered: "ancient" },
  { number: 80, symbol: "Hg", name: "Mercury", mass: "200.59", category: "transition-metal", period: 6, group: 12, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s²", melt: "-38.8°C", boil: "356.7°C", discovered: "ancient" },
  { number: 81, symbol: "Tl", name: "Thallium", mass: "204.383", category: "post-transition", period: 6, group: 13, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹", melt: "304°C", boil: "1473°C", discovered: "1861" },
  { number: 82, symbol: "Pb", name: "Lead", mass: "207.2", category: "post-transition", period: 6, group: 14, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²", melt: "327.5°C", boil: "1749°C", discovered: "ancient" },
  { number: 83, symbol: "Bi", name: "Bismuth", mass: "208.980", category: "post-transition", period: 6, group: 15, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³", melt: "271.4°C", boil: "1564°C", discovered: "1753" },
  { number: 84, symbol: "Po", name: "Polonium", mass: "209", category: "metalloid", period: 6, group: 16, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴", melt: "254°C", boil: "962°C", discovered: "1898" },
  { number: 85, symbol: "At", name: "Astatine", mass: "210", category: "halogen", period: 6, group: 17, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵", melt: "302°C", boil: "337°C", discovered: "1940" },
  { number: 86, symbol: "Rn", name: "Radon", mass: "222", category: "noble-gas", period: 6, group: 18, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶", boil: "-61.7°C", discovered: "1900" },
  { number: 87, symbol: "Fr", name: "Francium", mass: "223", category: "alkali-metal", period: 7, group: 1, config: "[Rn] 7s¹", melt: "27°C", boil: "677°C", discovered: "1939" },
  { number: 88, symbol: "Ra", name: "Radium", mass: "226", category: "alkaline-earth", period: 7, group: 2, config: "[Rn] 7s²", melt: "700°C", boil: "1737°C", discovered: "1898" },
  { number: 89, symbol: "Ac", name: "Actinium", mass: "227", category: "actinide", period: 10, group: 4, config: "[Rn] 6d¹ 7s²", melt: "1051°C", boil: "3198°C", discovered: "1899" },
  { number: 90, symbol: "Th", name: "Thorium", mass: "232.038", category: "actinide", period: 10, group: 5, config: "[Rn] 6d² 7s²", melt: "1750°C", boil: "4788°C", discovered: "1829" },
  { number: 91, symbol: "Pa", name: "Protactinium", mass: "231.036", category: "actinide", period: 10, group: 6, config: "[Rn] 5f² 6d¹ 7s²", melt: "1572°C", boil: "4000°C", discovered: "1913" },
  { number: 92, symbol: "U", name: "Uranium", mass: "238.029", category: "actinide", period: 10, group: 7, config: "[Rn] 5f³ 6d¹ 7s²", melt: "1135°C", boil: "4131°C", discovered: "1789" },
  { number: 93, symbol: "Np", name: "Neptunium", mass: "237", category: "actinide", period: 10, group: 8, config: "[Rn] 5f⁴ 6d¹ 7s²", melt: "644°C", boil: "4000°C", discovered: "1940" },
  { number: 94, symbol: "Pu", name: "Plutonium", mass: "244", category: "actinide", period: 10, group: 9, config: "[Rn] 5f⁶ 7s²", melt: "640°C", boil: "3228°C", discovered: "1940" },
  { number: 95, symbol: "Am", name: "Americium", mass: "243", category: "actinide", period: 10, group: 10, config: "[Rn] 5f⁷ 7s²", melt: "1176°C", boil: "2607°C", discovered: "1944" },
  { number: 96, symbol: "Cm", name: "Curium", mass: "247", category: "actinide", period: 10, group: 11, config: "[Rn] 5f⁷ 6d¹ 7s²", melt: "1345°C", boil: "3110°C", discovered: "1944" },
  { number: 97, symbol: "Bk", name: "Berkelium", mass: "247", category: "actinide", period: 10, group: 12, config: "[Rn] 5f⁹ 7s²", melt: "986°C", discovered: "1949" },
  { number: 98, symbol: "Cf", name: "Californium", mass: "251", category: "actinide", period: 10, group: 13, config: "[Rn] 5f¹⁰ 7s²", melt: "900°C", discovered: "1950" },
  { number: 99, symbol: "Es", name: "Einsteinium", mass: "252", category: "actinide", period: 10, group: 14, config: "[Rn] 5f¹¹ 7s²", melt: "860°C", discovered: "1952" },
  { number: 100, symbol: "Fm", name: "Fermium", mass: "257", category: "actinide", period: 10, group: 15, config: "[Rn] 5f¹² 7s²", discovered: "1952" },
  { number: 101, symbol: "Md", name: "Mendelevium", mass: "258", category: "actinide", period: 10, group: 16, config: "[Rn] 5f¹³ 7s²", discovered: "1955" },
  { number: 102, symbol: "No", name: "Nobelium", mass: "259", category: "actinide", period: 10, group: 17, config: "[Rn] 5f¹⁴ 7s²", discovered: "1966" },
  { number: 103, symbol: "Lr", name: "Lawrencium", mass: "262", category: "actinide", period: 10, group: 18, config: "[Rn] 5f¹⁴ 7p¹", discovered: "1961" },
  { number: 104, symbol: "Rf", name: "Rutherfordium", mass: "267", category: "transition-metal", period: 7, group: 4, config: "[Rn] 5f¹⁴ 6d² 7s²", discovered: "1969" },
  { number: 105, symbol: "Db", name: "Dubnium", mass: "268", category: "transition-metal", period: 7, group: 5, config: "[Rn] 5f¹⁴ 6d³ 7s²", discovered: "1970" },
  { number: 106, symbol: "Sg", name: "Seaborgium", mass: "271", category: "transition-metal", period: 7, group: 6, config: "[Rn] 5f¹⁴ 6d⁴ 7s²", discovered: "1974" },
  { number: 107, symbol: "Bh", name: "Bohrium", mass: "272", category: "transition-metal", period: 7, group: 7, config: "[Rn] 5f¹⁴ 6d⁵ 7s²", discovered: "1981" },
  { number: 108, symbol: "Hs", name: "Hassium", mass: "277", category: "transition-metal", period: 7, group: 8, config: "[Rn] 5f¹⁴ 6d⁶ 7s²", discovered: "1984" },
  { number: 109, symbol: "Mt", name: "Meitnerium", mass: "278", category: "transition-metal", period: 7, group: 9, config: "[Rn] 5f¹⁴ 6d⁷ 7s²", discovered: "1982" },
  { number: 110, symbol: "Ds", name: "Darmstadtium", mass: "281", category: "transition-metal", period: 7, group: 10, config: "[Rn] 5f¹⁴ 6d⁸ 7s²", discovered: "1994" },
  { number: 111, symbol: "Rg", name: "Roentgenium", mass: "282", category: "transition-metal", period: 7, group: 11, config: "[Rn] 5f¹⁴ 6d¹⁰ 7s¹", discovered: "1994" },
  { number: 112, symbol: "Cn", name: "Copernicium", mass: "285", category: "transition-metal", period: 7, group: 12, config: "[Rn] 5f¹⁴ 6d¹⁰ 7s²", discovered: "1996" },
  { number: 113, symbol: "Nh", name: "Nihonium", mass: "286", category: "post-transition", period: 7, group: 13, config: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹", discovered: "2004" },
  { number: 114, symbol: "Fl", name: "Flerovium", mass: "289", category: "post-transition", period: 7, group: 14, config: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²", discovered: "1999" },
  { number: 115, symbol: "Mc", name: "Moscovium", mass: "290", category: "post-transition", period: 7, group: 15, config: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³", discovered: "2003" },
  { number: 116, symbol: "Lv", name: "Livermorium", mass: "293", category: "post-transition", period: 7, group: 16, config: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴", discovered: "2000" },
  { number: 117, symbol: "Ts", name: "Tennessine", mass: "294", category: "halogen", period: 7, group: 17, config: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵", discovered: "2010" },
  { number: 118, symbol: "Og", name: "Oganesson", mass: "294", category: "noble-gas", period: 7, group: 18, config: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶", discovered: "2002" },
];

const CATEGORY_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  "alkali-metal":      { bg: "bg-red-900/60",     border: "border-red-500/60",     text: "text-red-200",     label: "Alkali Metal" },
  "alkaline-earth":    { bg: "bg-orange-900/60",   border: "border-orange-500/60",  text: "text-orange-200",  label: "Alkaline Earth" },
  "transition-metal":  { bg: "bg-yellow-900/60",   border: "border-yellow-500/50",  text: "text-yellow-200",  label: "Transition Metal" },
  "post-transition":   { bg: "bg-lime-900/60",     border: "border-lime-500/50",    text: "text-lime-200",    label: "Post-Transition Metal" },
  "metalloid":         { bg: "bg-teal-900/60",     border: "border-teal-500/50",    text: "text-teal-200",    label: "Metalloid" },
  "nonmetal":          { bg: "bg-sky-900/60",      border: "border-sky-500/60",     text: "text-sky-200",     label: "Nonmetal" },
  "halogen":           { bg: "bg-violet-900/60",   border: "border-violet-500/60",  text: "text-violet-200",  label: "Halogen" },
  "noble-gas":         { bg: "bg-slate-700/60",    border: "border-slate-400/50",   text: "text-slate-200",   label: "Noble Gas" },
  "lanthanide":        { bg: "bg-pink-900/60",     border: "border-pink-500/50",    text: "text-pink-200",    label: "Lanthanide" },
  "actinide":          { bg: "bg-rose-900/60",     border: "border-rose-500/50",    text: "text-rose-200",    label: "Actinide" },
};

const LEGEND_CATS = Object.entries(CATEGORY_STYLES).map(([key, val]) => ({ key, ...val }));

function ElementCell({ el, onClick, highlight }: { el: ElementData; onClick: (e: ElementData) => void; highlight: boolean }) {
  const style = CATEGORY_STYLES[el.category];
  return (
    <button
      onClick={() => onClick(el)}
      title={el.name}
      className={`relative w-full aspect-square flex flex-col items-center justify-center rounded border transition-all cursor-pointer hover:scale-110 hover:z-10 hover:brightness-125 ${style.bg} ${style.border} ${highlight ? "ring-2 ring-white/60 scale-105 z-10" : ""}`}
    >
      <span className={`text-[0.45rem] leading-none opacity-70 ${style.text}`}>{el.number}</span>
      <span className={`text-[0.65rem] font-bold leading-none mt-0.5 ${style.text}`}>{el.symbol}</span>
    </button>
  );
}

export default function PeriodicTable() {
  const [selected, setSelected] = useState<ElementData | null>(null);
  const [filterCat, setFilterCat] = useState<string | null>(null);

  const byPos: Record<string, ElementData> = {};
  ELEMENTS.forEach((el) => { byPos[`${el.period}-${el.group}`] = el; });

  const rows = [1, 2, 3, 4, 5, 6, 7];
  const cols = Array.from({ length: 18 }, (_, i) => i + 1);

  const selStyle = selected ? CATEGORY_STYLES[selected.category] : null;

  return (
    <ToolLayout
      title="Periodic Table"
      description="All 118 elements — click any element for full details including atomic mass, electron configuration, and melting/boiling points"
      category="Science"
      categoryHref="/"
      icon={<FlaskConical className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />}
      iconBg="bg-emerald-100 dark:bg-emerald-900/40"
    >
      <div className="space-y-4">
        <div className="overflow-x-auto pb-2">
          <div style={{ minWidth: 560 }}>
            <div
              className="grid gap-px"
              style={{ gridTemplateColumns: "repeat(18, minmax(0, 1fr))" }}
            >
              {rows.map((period) =>
                cols.map((group) => {
                  const el = byPos[`${period}-${group}`];
                  if (!el) {
                    if (period === 6 && group === 3) {
                      return (
                        <div key={`${period}-${group}`} className="w-full aspect-square flex flex-col items-center justify-center rounded border border-pink-500/30 bg-pink-900/20 text-pink-300 text-[0.45rem] font-bold">57-71</div>
                      );
                    }
                    if (period === 7 && group === 3) {
                      return (
                        <div key={`${period}-${group}`} className="w-full aspect-square flex flex-col items-center justify-center rounded border border-rose-500/30 bg-rose-900/20 text-rose-300 text-[0.45rem] font-bold">89-103</div>
                      );
                    }
                    return <div key={`${period}-${group}`} />;
                  }
                  return (
                    <ElementCell
                      key={el.number}
                      el={el}
                      onClick={setSelected}
                      highlight={filterCat === el.category || selected?.number === el.number}
                    />
                  );
                })
              )}
            </div>

            <div className="mt-2 grid gap-px" style={{ gridTemplateColumns: "repeat(18, minmax(0, 1fr))" }}>
              <div className="col-span-3" />
              {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((group) => {
                const lant = byPos[`9-${group}`];
                const act = byPos[`10-${group}`];
                return (
                  <div key={group} className="flex flex-col gap-px">
                    {lant && (
                      <ElementCell el={lant} onClick={setSelected} highlight={filterCat === lant.category || selected?.number === lant.number} />
                    )}
                    {act && (
                      <ElementCell el={act} onClick={setSelected} highlight={filterCat === act.category || selected?.number === act.number} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {LEGEND_CATS.map((c) => (
            <button
              key={c.key}
              onClick={() => setFilterCat(filterCat === c.key ? null : c.key)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border transition-all ${c.bg} ${c.border} ${c.text} ${filterCat === c.key ? "ring-2 ring-white/40" : "opacity-70 hover:opacity-100"}`}
            >
              <span className={`w-2 h-2 rounded-full ${c.bg} border ${c.border}`} />
              {c.label}
            </button>
          ))}
        </div>

        {selected && selStyle && (
          <div className={`relative rounded-2xl border p-5 ${selStyle.bg} ${selStyle.border}`}>
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 text-white/50 hover:text-white/90 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-5">
              <div className={`rounded-xl border px-4 py-3 text-center min-w-[80px] ${selStyle.bg} ${selStyle.border}`}>
                <div className={`text-xs opacity-60 mb-0.5 ${selStyle.text}`}>{selected.number}</div>
                <div className={`text-4xl font-bold leading-none ${selStyle.text}`}>{selected.symbol}</div>
                <div className={`text-xs mt-1 opacity-70 ${selStyle.text}`}>{selected.mass}</div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-xl font-bold ${selStyle.text}`}>{selected.name}</h3>
                <p className={`text-sm font-medium opacity-70 mb-3 ${selStyle.text}`}>{CATEGORY_STYLES[selected.category].label}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-sm">
                  <Detail label="Atomic Number" value={String(selected.number)} style={selStyle} />
                  <Detail label="Atomic Mass" value={selected.mass + " u"} style={selStyle} />
                  <Detail label="Period" value={String(selected.period <= 8 ? selected.period : selected.period === 9 ? 6 : 7)} style={selStyle} />
                  <Detail label="Group" value={selected.period <= 8 ? String(selected.group) : "—"} style={selStyle} />
                  <Detail label="Electron Config" value={selected.config} style={selStyle} />
                  {selected.discovered && <Detail label="Discovered" value={selected.discovered} style={selStyle} />}
                  {selected.melt && <Detail label="Melting Point" value={selected.melt} style={selStyle} />}
                  {selected.boil && <Detail label="Boiling Point" value={selected.boil} style={selStyle} />}
                </div>
              </div>
            </div>
          </div>
        )}

        {!selected && (
          <p className="text-center text-sm text-muted-foreground py-2">Click any element to see its full details</p>
        )}
      </div>
    </ToolLayout>
  );
}

function Detail({ label, value, style }: { label: string; value: string; style: { text: string } }) {
  return (
    <div>
      <span className={`block text-[0.65rem] uppercase tracking-wider opacity-50 ${style.text}`}>{label}</span>
      <span className={`font-medium ${style.text}`}>{value}</span>
    </div>
  );
}
