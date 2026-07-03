#!/usr/bin/env node
'use strict';

/* ============================================================
   数秘Threadsカルーセル自動生成 CLI
   使い方: node generate.js <数秘番号>   例: node generate.js 3
   出力  : output/suuhiN.html, output/suuhiN_text.txt
   ============================================================ */

const fs = require('fs');
const path = require('path');
const numbers = require('./data/numbers.js');

const TEMPLATE_PATH = path.join(__dirname, 'suuhi_template_final.html');
const OUTPUT_DIR = path.join(__dirname, 'output');
const DATA_BLOCK_PATTERN = /var DATA = \{[\s\S]*?\n\};/;

function buildHtml(data) {
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  if (!DATA_BLOCK_PATTERN.test(template)) {
    throw new Error('テンプレート内に DATA オブジェクトが見つかりませんでした。');
  }
  const { textPost, ...slideData } = data;
  const dataLiteral = 'var DATA = ' + JSON.stringify(slideData, null, 2) + ';';
  return template.replace(DATA_BLOCK_PATTERN, dataLiteral);
}

function main() {
  const number = process.argv[2];
  if (!number) {
    console.error('使い方: node generate.js <数秘番号>  例: node generate.js 2');
    process.exit(1);
  }

  const data = numbers[number];
  if (!data) {
    console.error(`数秘${number}番のデータが見つかりません。data/numbers.js に追加してください。`);
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const htmlPath = path.join(OUTPUT_DIR, `suuhi${number}.html`);
  const textPath = path.join(OUTPUT_DIR, `suuhi${number}_text.txt`);

  fs.writeFileSync(htmlPath, buildHtml(data), 'utf8');
  fs.writeFileSync(textPath, data.textPost, 'utf8');

  console.log(`生成しました: ${htmlPath}`);
  console.log(`生成しました: ${textPath}`);
}

main();
