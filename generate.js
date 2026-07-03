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
const CROSS_BLOCK_PATTERN = /var CROSS = '[\s\S]*?';/;
const CHAR_BLOCK_PATTERN = /var CHAR = '[\s\S]*?';/;

/* ============================================================
   キャラクター素体（顔・頭部・胴体・脚）
   職業（charKey）ごとにシルエットそのものが変わる：
     healer      = フード＋ハロー＋ローブ
     entertainer = パーティーハット＋蝶ネクタイ＋燕尾服
     builder     = ヘルメット＋オーバーオール＋工具ベルト
   配色は theme（torso/mint/mint2/mint3/mintDark）で差し替わる
   ============================================================ */
function faceBase(t) {
  return ''
    + '<rect x="22" y="18" width="28" height="22" fill="#f4d0a0"/>'
    + '<rect x="18" y="24" width="4" height="8" fill="#f4d0a0"/>'
    + '<rect x="50" y="24" width="4" height="8" fill="#f4d0a0"/>'
    + '<rect x="30" y="34" width="2" height="2" fill="#c47070"/>'
    + '<rect x="40" y="34" width="2" height="2" fill="#c47070"/>'
    + '<rect x="22" y="32" width="6" height="4" fill="#f4a0a0" opacity="0.5"/>'
    + '<rect x="44" y="32" width="6" height="4" fill="#f4a0a0" opacity="0.5"/>';
}

const BODIES = {
  healer: function (t) {
    return ''
      + '<ellipse cx="36" cy="8" rx="16" ry="4" fill="none" stroke="' + t.mint2 + '" stroke-width="2"/>'
      + '<rect x="20" y="10" width="32" height="6" fill="' + t.mint3 + '"/>'
      + '<rect x="16" y="14" width="40" height="4" fill="' + t.mint3 + '"/>'
      + faceBase(t)
      + '<rect x="28" y="26" width="6" height="6" fill="#3a2060"/>'
      + '<rect x="38" y="26" width="6" height="6" fill="#3a2060"/>'
      + '<rect x="29" y="26" width="2" height="2" fill="#fff"/>'
      + '<rect x="39" y="26" width="2" height="2" fill="#fff"/>'
      + '<rect x="28" y="24" width="2" height="2" fill="#3a2060"/>'
      + '<rect x="32" y="24" width="2" height="2" fill="#3a2060"/>'
      + '<rect x="38" y="24" width="2" height="2" fill="#3a2060"/>'
      + '<rect x="42" y="24" width="2" height="2" fill="#3a2060"/>'
      + '<rect x="32" y="36" width="8" height="2" fill="#c47070"/>'
      + '<rect x="18" y="40" width="36" height="30" fill="' + t.torso + '"/>'
      + '<rect x="18" y="40" width="6" height="30" fill="' + t.mint + '"/>'
      + '<rect x="48" y="40" width="6" height="30" fill="' + t.mint + '"/>'
      + '<rect x="14" y="44" width="6" height="26" fill="' + t.mint2 + '"/>'
      + '<rect x="52" y="44" width="6" height="26" fill="' + t.mint2 + '"/>'
      + '<rect x="32" y="46" width="8" height="2" fill="' + t.mint3 + '"/>'
      + '<rect x="35" y="43" width="2" height="8" fill="' + t.mint3 + '"/>'
      + '<rect x="22" y="70" width="10" height="12" fill="' + t.mint2 + '"/>'
      + '<rect x="40" y="70" width="10" height="12" fill="' + t.mint2 + '"/>'
      + '<rect x="22" y="80" width="12" height="4" fill="' + t.mint3 + '"/>'
      + '<rect x="38" y="80" width="12" height="4" fill="' + t.mint3 + '"/>';
  },
  entertainer: function (t) {
    return ''
      + '<rect x="33" y="1" width="4" height="4" fill="' + t.mint + '"/>'
      + '<rect x="32" y="5" width="7" height="3" fill="' + t.mint2 + '"/>'
      + '<rect x="29" y="8" width="13" height="4" fill="' + t.mint2 + '"/>'
      + '<rect x="26" y="12" width="19" height="3" fill="' + t.mint3 + '"/>'
      + '<rect x="23" y="15" width="26" height="3" fill="' + t.mint3 + '"/>'
      + faceBase(t)
      + '<rect x="28" y="26" width="6" height="6" fill="#3a2060"/>'
      + '<rect x="29" y="26" width="2" height="2" fill="#fff"/>'
      + '<rect x="37" y="28" width="7" height="2" fill="#3a2060"/>'
      + '<rect x="28" y="24" width="2" height="2" fill="#3a2060"/>'
      + '<rect x="32" y="24" width="2" height="2" fill="#3a2060"/>'
      + '<rect x="38" y="22" width="2" height="2" fill="#3a2060"/>'
      + '<rect x="42" y="22" width="2" height="2" fill="#3a2060"/>'
      + '<rect x="30" y="36" width="12" height="3" fill="#c47070"/>'
      + '<rect x="18" y="40" width="36" height="20" fill="' + t.torso + '"/>'
      + '<rect x="18" y="40" width="6" height="20" fill="' + t.mint + '"/>'
      + '<rect x="48" y="40" width="6" height="20" fill="' + t.mint + '"/>'
      + '<rect x="14" y="44" width="6" height="18" fill="' + t.mint2 + '"/>'
      + '<rect x="52" y="44" width="6" height="18" fill="' + t.mint2 + '"/>'
      + '<rect x="28" y="44" width="6" height="5" fill="' + t.mint3 + '"/>'
      + '<rect x="38" y="44" width="6" height="5" fill="' + t.mint3 + '"/>'
      + '<rect x="34" y="45" width="4" height="3" fill="' + t.mint2 + '"/>'
      + '<rect x="16" y="60" width="10" height="10" fill="' + t.mint3 + '"/>'
      + '<rect x="46" y="60" width="10" height="10" fill="' + t.mint3 + '"/>'
      + '<rect x="24" y="70" width="8" height="12" fill="' + t.mint2 + '"/>'
      + '<rect x="40" y="70" width="8" height="12" fill="' + t.mint2 + '"/>'
      + '<rect x="20" y="82" width="4" height="2" fill="' + t.mint3 + '"/>'
      + '<rect x="22" y="80" width="10" height="4" fill="' + t.mint3 + '"/>'
      + '<rect x="48" y="82" width="4" height="2" fill="' + t.mint3 + '"/>'
      + '<rect x="40" y="80" width="10" height="4" fill="' + t.mint3 + '"/>';
  },
  builder: function (t) {
    return ''
      + '<rect x="34" y="8" width="4" height="3" fill="' + t.mint2 + '"/>'
      + '<rect x="20" y="9" width="32" height="7" fill="' + t.mint3 + '"/>'
      + '<rect x="14" y="15" width="44" height="3" fill="' + t.mint3 + '"/>'
      + faceBase(t)
      + '<rect x="28" y="26" width="6" height="6" fill="#3a2060"/>'
      + '<rect x="38" y="26" width="6" height="6" fill="#3a2060"/>'
      + '<rect x="29" y="26" width="2" height="2" fill="#fff"/>'
      + '<rect x="39" y="26" width="2" height="2" fill="#fff"/>'
      + '<rect x="27" y="23" width="4" height="2" fill="#3a2060"/>'
      + '<rect x="37" y="23" width="4" height="2" fill="#3a2060"/>'
      + '<rect x="32" y="36" width="8" height="2" fill="#c47070"/>'
      + '<rect x="18" y="40" width="36" height="30" fill="' + t.torso + '"/>'
      + '<rect x="14" y="44" width="6" height="24" fill="' + t.mint + '"/>'
      + '<rect x="52" y="44" width="6" height="24" fill="' + t.mint + '"/>'
      + '<rect x="24" y="40" width="4" height="14" fill="' + t.mint2 + '"/>'
      + '<rect x="44" y="40" width="4" height="14" fill="' + t.mint2 + '"/>'
      + '<rect x="26" y="50" width="20" height="14" fill="' + t.mint2 + '"/>'
      + '<rect x="30" y="54" width="12" height="8" fill="' + t.mint3 + '"/>'
      + '<rect x="16" y="66" width="40" height="4" fill="' + t.mintDark + '"/>'
      + '<rect x="34" y="66" width="4" height="4" fill="' + t.mint + '"/>'
      + '<rect x="20" y="70" width="12" height="12" fill="' + t.mint2 + '"/>'
      + '<rect x="40" y="70" width="12" height="12" fill="' + t.mint2 + '"/>'
      + '<rect x="17" y="80" width="17" height="5" fill="' + t.mint3 + '"/>'
      + '<rect x="38" y="80" width="17" height="5" fill="' + t.mint3 + '"/>';
  }
};

/* 職業ごとの持ち物（ヒーラー=杖／エンターテイナー=マイク／ビルダー=ハンマー） */
const PROPS = {
  healer: function (t) {
    return ''
      + '<rect x="58" y="30" width="4" height="44" fill="#8b6914"/>'
      + '<rect x="54" y="22" width="12" height="12" fill="' + t.mint + '"/>'
      + '<rect x="56" y="20" width="8" height="4" fill="' + t.mint + '"/>'
      + '<rect x="52" y="24" width="4" height="8" fill="' + t.mint + '"/>'
      + '<rect x="64" y="24" width="4" height="8" fill="' + t.mint + '"/>'
      + '<rect x="56" y="24" width="4" height="4" fill="#fff" opacity="0.7"/>';
  },
  entertainer: function (t) {
    return ''
      + '<rect x="58" y="34" width="4" height="40" fill="#3a3a3a"/>'
      + '<rect x="54" y="20" width="12" height="14" fill="' + t.mint2 + '"/>'
      + '<rect x="56" y="18" width="8" height="4" fill="' + t.mint2 + '"/>'
      + '<rect x="52" y="22" width="4" height="10" fill="' + t.mint2 + '"/>'
      + '<rect x="64" y="22" width="4" height="10" fill="' + t.mint2 + '"/>'
      + '<rect x="55" y="24" width="10" height="2" fill="' + t.mintDark + '" opacity="0.6"/>'
      + '<rect x="55" y="28" width="10" height="2" fill="' + t.mintDark + '" opacity="0.6"/>'
      + '<rect x="56" y="21" width="4" height="4" fill="#fff" opacity="0.6"/>';
  },
  builder: function (t) {
    return ''
      + '<rect x="58" y="38" width="4" height="36" fill="#8b5a2b"/>'
      + '<rect x="49" y="26" width="19" height="10" fill="' + t.mint2 + '"/>'
      + '<rect x="49" y="26" width="19" height="3" fill="' + t.mint + '"/>';
  }
};

/* 職業ごとのバッジアイコン（ヒーラー=十字／エンターテイナー=星／ビルダー=ハンマー） */
const BADGES = {
  healer: function (t) {
    return ''
      + '<rect x="6" y="0" width="6" height="18" fill="' + t.mint2 + '"/>'
      + '<rect x="0" y="6" width="18" height="6" fill="' + t.mint2 + '"/>';
  },
  entertainer: function (t) {
    return ''
      + '<rect x="7" y="1" width="4" height="16" fill="' + t.mint2 + '"/>'
      + '<rect x="1" y="7" width="16" height="4" fill="' + t.mint2 + '"/>'
      + '<rect x="3" y="3" width="3" height="3" fill="' + t.mint + '"/>'
      + '<rect x="12" y="3" width="3" height="3" fill="' + t.mint + '"/>'
      + '<rect x="3" y="12" width="3" height="3" fill="' + t.mint + '"/>'
      + '<rect x="12" y="12" width="3" height="3" fill="' + t.mint + '"/>';
  },
  builder: function (t) {
    return ''
      + '<rect x="2" y="2" width="14" height="6" fill="' + t.mint2 + '"/>'
      + '<rect x="7" y="8" width="4" height="9" fill="' + t.mint3 + '"/>';
  }
};

function buildCharSvg(theme, charKey) {
  const body = (BODIES[charKey] || BODIES.healer)(theme);
  const prop = (PROPS[charKey] || PROPS.healer)(theme);
  const sparkles = ''
    + '<rect x="46" y="14" width="4" height="4" fill="' + theme.mint + '" opacity="0.9"/>'
    + '<rect x="6" y="20" width="4" height="4" fill="#c4b5fd" opacity="0.8"/>'
    + '<rect x="2" y="32" width="3" height="3" fill="#60a5fa" opacity="0.7"/>'
    + '<rect x="10" y="12" width="3" height="3" fill="#fbbf24" opacity="0.8"/>';
  return '<svg width="72" height="86" viewBox="0 0 72 86" style="image-rendering:pixelated;" xmlns="http://www.w3.org/2000/svg">'
    + body + prop + sparkles + '</svg>';
}

function buildBadgeSvg(theme, charKey) {
  const icon = (BADGES[charKey] || BADGES.healer)(theme);
  return '<svg width="18" height="18" viewBox="0 0 18 18" style="position:absolute;top:6px;right:6px;image-rendering:pixelated;" xmlns="http://www.w3.org/2000/svg">'
    + icon + '</svg>';
}

function themeStyleBlock(theme) {
  return '<style>'
    + ':root{--mint:' + theme.mint + ';--mint2:' + theme.mint2 + ';--mint3:' + theme.mint3 + ';--mint-dark:' + theme.mintDark + ';}'
    + '.bar-hp{background:var(--mint2);}'
    + '</style>';
}

function buildHtml(data) {
  let html = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  if (!DATA_BLOCK_PATTERN.test(html)) {
    throw new Error('テンプレート内に DATA オブジェクトが見つかりませんでした。');
  }

  const { textPost, theme, charKey, ...slideData } = data;
  const dataLiteral = 'var DATA = ' + JSON.stringify(slideData, null, 2) + ';';
  html = html.replace(DATA_BLOCK_PATTERN, dataLiteral);

  const charSvg = buildCharSvg(theme, charKey).replace(/'/g, "\\'");
  const badgeSvg = buildBadgeSvg(theme, charKey).replace(/'/g, "\\'");
  html = html.replace(CROSS_BLOCK_PATTERN, "var CROSS = '" + badgeSvg + "';");
  html = html.replace(CHAR_BLOCK_PATTERN, "var CHAR = '" + charSvg + "';");

  html = html.replace('</style>', '</style>\n' + themeStyleBlock(theme));

  return html;
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
