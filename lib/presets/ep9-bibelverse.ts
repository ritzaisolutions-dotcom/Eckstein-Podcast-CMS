import type { InfoboxItem, InfoboxPreset } from "@/lib/infobox-export";
import { KORINTHER_13_ITEMS } from "@/lib/presets/1-korinther-13";

const EP9_ADDITIONAL_ITEMS: InfoboxItem[] = [
  {
    id: "ep9-1joh-4-19",
    exportFilename: "10-1joh-4-19.jpg",
    type: "ZITAT",
    format: "strip",
    bgTheme: "navy",
    headline: "1. Johannes 4,19",
    description: "Wir lieben, weil er uns zuerst geliebt hat.",
    source: "1. Johannes 4",
  },
  {
    id: "ep9-mat-5-44",
    exportFilename: "11-mat-5-44.jpg",
    type: "ZITAT",
    format: "strip",
    bgTheme: "navy",
    headline: "Matthäus 5,44",
    description:
      "Ich aber sage euch: Liebet eure Feinde und bittet für die, die euch verfolgen.",
    source: "Matthäus 5",
  },
  {
    id: "ep9-roem-5-8",
    exportFilename: "12-roem-5-8.jpg",
    type: "ZITAT",
    format: "strip",
    bgTheme: "navy",
    headline: "Römer 5,8",
    description:
      "Christus aber ist für uns gestorben, als wir noch ohne Kraft waren, als wir noch Sünder waren.",
    source: "Römer 5",
  },
  {
    id: "ep9-jak-2-26",
    exportFilename: "13-jak-2-26.jpg",
    type: "ZITAT",
    format: "strip",
    bgTheme: "navy",
    headline: "Jakobus 2,26",
    description:
      "Denn gleicherweise ist auch der Glaube, wenn er nicht Werke hat, in sich selber tot.",
    source: "Jakobus 2",
  },
  {
    id: "ep9-eph-5-22-25",
    exportFilename: "14-eph-5-22-25.jpg",
    type: "ZITAT",
    format: "strip",
    bgTheme: "navy",
    headline: "Epheser 5,22.25",
    description:
      "Ihr Weiber, ordnet euch euren eigenen Männern unter, wie dem Herrn. Ihr Männer, liebt eure Frauen, gleichwie auch Christus die Gemeinde geliebt und sich selbst für sie dahingegeben hat.",
    source: "Epheser 5",
    typography: { bodySize: 8 },
  },
  {
    id: "ep9-1mo-2-24",
    exportFilename: "15-1mo-2-24.jpg",
    type: "ZITAT",
    format: "strip",
    bgTheme: "navy",
    headline: "1. Mose 2,24",
    description:
      "Darum wird ein Mann Vater und Mutter verlassen und an seinem Weibe hängen, und sie werden die zwei ein Fleisch sein.",
    source: "1. Mose 2,24 / Matthäus 19,5",
    typography: { bodySize: 8 },
  },
  {
    id: "ep9-luk-15-11-16",
    exportFilename: "16-luk-15-11-16.jpg",
    type: "ZITAT",
    format: "strip",
    bgTheme: "navy",
    headline: "Lukas 15,11–16",
    description:
      "Und er sprach: Ein Mensch hatte zwei Söhne. Und der jüngere sprach zu seinem Vater: Vater, gib mir den Teil des Vermögens, der mir zukommt. Und er teilte das Gut unter sie. Und nach nicht vielen Tagen sammelte der jüngere alles zusammen und zog in ein fernes Land, und dort verschleuderte er sein Vermögen in losem Leben. Als er aber alles aufgebraucht hatte, trat eine große Hungersnot ein in jenes Land, und er fing an, Not zu leiden.",
    source: "Lukas 15",
    typography: { bodySize: 7.5, headlineSize: 11 },
  },
  {
    id: "ep9-luk-15-17-24",
    exportFilename: "17-luk-15-17-24.jpg",
    type: "ZITAT",
    format: "strip",
    bgTheme: "navy",
    headline: "Lukas 15,17–24",
    description:
      "Und er ging hin und verband sich mit einem Bürger jenes Landes; der schickte ihn auf seine Felder, Schweine zu hüten. Und er begehrte, seinen Bauch zu füllen von den Schoten, die die Schweine fraßen; und niemand gab ihm. Da er aber bei sich kam, sprach er: Wie viele Tagelöhner bei meinem Vater haben Brot im Überfluss, und ich verderbe hier vor Hunger! Ich will mich aufmachen und zu meinem Vater gehen und zu ihm sagen: Vater, ich habe gegen den Himmel und vor dir gesündigt; ich bin hinfort nicht mehr wert, dein Sohn zu heißen; mach mich zu einem deiner Tagelöhner.",
    source: "Lukas 15",
    typography: { bodySize: 7.5, headlineSize: 11 },
  },
  {
    id: "ep9-luk-15-25-32",
    exportFilename: "18-luk-15-25-32.jpg",
    type: "ZITAT",
    format: "strip",
    bgTheme: "navy",
    headline: "Lukas 15,25–32",
    description:
      "Und er machte sich auf und kam zu seinem Vater. Als er aber noch weit von da war, sah ihn schon sein Vater und ward jammervoll bewegt; und er lief und fiel ihm um den Hals und küsste ihn. Und der Sohn sprach zu ihm: Vater, ich habe gegen den Himmel und vor dir gesündigt; ich bin hinfort nicht mehr wert, dein Sohn zu heißen. Der Vater aber sprach zu seinen Knechten: Bringt das beste Gewand her und zieht es ihm an; und gebt ihm einen Ring an seine Hand und Schuhe an die Füße; und bringt das gemästete Kalb her und schlachtet es; lasst uns essen und fröhlich sein! Denn dieser mein Sohn war tot und ist wieder lebendig geworden; er war verloren und ist wiedergefunden worden.",
    source: "Lukas 15",
    typography: { bodySize: 7, headlineSize: 10.5 },
  },
  {
    id: "ep9-joh-14-6",
    exportFilename: "19-joh-14-6.jpg",
    type: "ZITAT",
    format: "strip",
    bgTheme: "navy",
    headline: "Johannes 14,6",
    description:
      "Jesus sprach zu ihm: Ich bin der Weg und die Wahrheit und das Leben; niemand kommt zum Vater denn durch mich.",
    source: "Johannes 14",
  },
  {
    id: "ep9-apg-9-4",
    exportFilename: "20-apg-9-4.jpg",
    type: "ZITAT",
    format: "strip",
    bgTheme: "navy",
    headline: "Apostelgeschichte 9,4",
    description:
      "Da fiel er auf die Erde und hörte eine Stimme, die sprach zu ihm: Saul, Saul, warum verfolgst du mich?",
    source: "Apostelgeschichte 9",
  },
];

export const EP9_BIBELVERSE_PRESET: InfoboxPreset = {
  id: "ep9-bibelverse",
  label: "Ep.9 — Bibelverse (20 Einblendungen)",
  zipFilename: "eckstein-ep9-bibelverse.zip",
  items: [...KORINTHER_13_ITEMS, ...EP9_ADDITIONAL_ITEMS],
};
