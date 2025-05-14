// lib/taxRates.js
export const federalRates = [
    { rate: 0.15, threshold: 57375 },
    { rate: 0.205, threshold: 114750 },
    { rate: 0.26, threshold: 177882 },
    { rate: 0.29, threshold: 253414 },
    { rate: 0.33, threshold: Infinity },
  ];
  
  export const federalCredit = 16129; // 2025 non-refundable base amount
  
  export const provincialData = {
    'Nova Scotia': {
      rates: [
        { rate: 0.0879, threshold: 30507 },
        { rate: 0.1495, threshold: 61015 },
        { rate: 0.1667, threshold: 95883 },
        { rate: 0.175, threshold: 154650 },
        { rate: 0.21, threshold: Infinity },
      ],
      credit: 8744,
    },
    'Ontario': {
      rates: [
        { rate: 0.0505, threshold: 52886 },
        { rate: 0.0915, threshold: 105775 },
        { rate: 0.1116, threshold: 150000 },
        { rate: 0.1216, threshold: 220000 },
        { rate: 0.1316, threshold: Infinity },
      ],
      credit: 12747,
    },
    'Newfoundland and Labrador': {
      rates: [
        { rate: 0.087, threshold: 44192 },
        { rate: 0.145, threshold: 88382 },
        { rate: 0.158, threshold: 157792 },
        { rate: 0.178, threshold: 220910 },
        { rate: 0.198, threshold: 282214 },
        { rate: 0.208, threshold: 564429 },
        { rate: 0.213, threshold: 1128858 },
        { rate: 0.218, threshold: Infinity },
      ],
      credit: 11067,
    },
    'Prince Edward Island': {
      rates: [
        { rate: 0.095, threshold: 33328 },
        { rate: 0.1347, threshold: 64656 },
        { rate: 0.166, threshold: 105000 },
        { rate: 0.1762, threshold: 140000 },
        { rate: 0.19, threshold: Infinity },
      ],
      credit: 14250,
    },
    'New Brunswick': {
      rates: [
        { rate: 0.094, threshold: 51306 },
        { rate: 0.14, threshold: 102614 },
        { rate: 0.16, threshold: 190060 },
        { rate: 0.195, threshold: Infinity },
      ],
      credit: 13396,
    },
    'Manitoba': {
      rates: [
        { rate: 0.108, threshold: 47564 },
        { rate: 0.1275, threshold: 101200 },
        { rate: 0.174, threshold: Infinity },
      ],
      credit: 15969,
    },
    'Saskatchewan': {
      rates: [
        { rate: 0.105, threshold: 53463 },
        { rate: 0.125, threshold: 152750 },
        { rate: 0.145, threshold: Infinity },
      ],
      credit: 19491,
    },
    'Alberta': {
      rates: [
        { rate: 0.10, threshold: 151234 },
        { rate: 0.12, threshold: 181481 },
        { rate: 0.13, threshold: 241974 },
        { rate: 0.14, threshold: 362961 },
        { rate: 0.15, threshold: Infinity },
      ],
      credit: 22323,
    },
    'British Columbia': {
      rates: [
        { rate: 0.0506, threshold: 49279 },
        { rate: 0.077, threshold: 98560 },
        { rate: 0.105, threshold: 113158 },
        { rate: 0.1229, threshold: 137407 },
        { rate: 0.147, threshold: 186306 },
        { rate: 0.168, threshold: 259829 },
        { rate: 0.205, threshold: Infinity },
      ],
      credit: 12932,
    },
    'Yukon': {
      rates: [
        { rate: 0.064, threshold: 57375 },
        { rate: 0.09, threshold: 114750 },
        { rate: 0.109, threshold: 177882 },
        { rate: 0.128, threshold: 500000 },
        { rate: 0.15, threshold: Infinity },
      ],
      credit: 16129,
    },
    'Northwest Territories': {
      rates: [
        { rate: 0.059, threshold: 51964 },
        { rate: 0.086, threshold: 103930 },
        { rate: 0.122, threshold: 168967 },
        { rate: 0.1405, threshold: Infinity },
      ],
      credit: 17842,
    },
    'Nunavut': {
      rates: [
        { rate: 0.04, threshold: 54707 },
        { rate: 0.07, threshold: 109413 },
        { rate: 0.09, threshold: 117881 },
        { rate: 0.115, threshold: Infinity },
      ],
      credit: 19274,
    },
  };