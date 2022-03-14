const { GoogleSpreadsheet } = require('google-spreadsheet');
import * as fs from 'fs';
import type {
  GoogleSpreadsheetWorksheet as GoogleSpreadsheetWorksheetType,
  GoogleSpreadsheet as GoogleSpreadsheetType,
  GoogleSpreadsheetRow
} from 'google-spreadsheet';
import { transcoder } from 'googleapis/build/src/apis/transcoder';
require('dotenv').config();

// 買い目と買い目の総額
// オッズ計算の下準備に使用
type OddsCollection = {
  [bet: string]: number
};

// 買い目と買い目のオッズ
type Odds = {
  [bet: string]: string
}

const doc: GoogleSpreadsheetType = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
const CENTRALLEGUE: string[] = ['ヤク', '阪神', '巨人', '広島', '中日', '横浜'];
const PACIFICLEGUE: string[] = ['オリ', '千葉', '楽天', '福岡', 'ハム', '西武'];
const REWARDRATE = {
  'Win': 0.8,
}

// 単勝オッズ計算
const calWin = (rows: GoogleSpreadsheetRow[], targets: string[]/* , header: string[] */): Odds => {
  const winCollection: OddsCollection = generateOddsCollection(targets);
  let amount: number = 0;
  rows.forEach((row: {[key: string]: string}) => {
    const bet: string | undefined = targets.find(target => row['セ・リーグ/1位'] === target);
    if (bet !== undefined) {
      winCollection[bet] += 5000;
      amount += 5000;
    }
  })
  const winOdds: Odds = generateOdds(winCollection, amount, REWARDRATE['Win']);

  return winOdds;
}

const generateOddsCollection = (bets: string[]): OddsCollection => {
  let collection: OddsCollection = {};
  bets.forEach((bet:string) => {
    collection = {...collection, ...{[bet]: 0} }
  })
  return collection;
}

const generateOdds = (collection: OddsCollection, amount: number, rewardRate: number): Odds => {
  let odds: Odds = {};
  Object.keys(collection).forEach((key: string) => {
    const hoge: number = (amount / collection[key]) / rewardRate;
    odds = {...odds, ...{[key]: hoge.toString()}}
  })
  return odds;
}

(async (): Promise<void> => {
  await doc.useServiceAccountAuth(require('./credentials.json'));
  await doc.loadInfo();
  const sheet: GoogleSpreadsheetWorksheetType = await doc.sheetsById['0'];
  const rows: GoogleSpreadsheetRow[] = await sheet.getRows();
  console.log(calWin(rows, CENTRALLEGUE));
})().catch(e => {
  console.log(e);
});