/* ============================================================
   数秘番号ごとのカルーセル／投稿文データ
   ------------------------------------------------------------
   generate.js から require され、番号ごとの内容を
   suuhi_template_final.html の DATA オブジェクトへ差し替えるために
   使われます。

   まだデータがない番号は未定義のままでOKです。
   （generate.js が「データが見つかりません」と案内します）

   追記する場合は下記の形式に合わせてください：

   3: {
     number: '3',
     charNo: '003',
     job: '職業名',
     type: 'タイプ名',
     rank: '★★★★☆',
     classLabel: 'XXX CLASS',
     catchCopy: '「〜」と言われがちなあなたへ。',
     intro_question: '導入の問いかけ（<br>で改行）',
     intro_body: '導入の本文。NUMBER は自動で「N番」に置換される。',
     abilities: [
       { tag: 'ABILITY 01', title: '...', em: '...', desc: '...',
         stats: [{ label: '...', color: '#xxxxxx', val: 90 }, { label: '...', color: '#xxxxxx', val: 20 }] },
       ... 3つ
     ],
     negatives: ['「...」', '「...」', '「...」'],
     positives: ['...', '...', '...'],
     closing: '締めの一言。<br><strong>それ、才能ですよ。</strong>',
     textPost: 'Threads用テキスト投稿文（「数秘N番が〇〇な理由」形式）'
   }
   ============================================================ */

module.exports = {
  2: {
    number: '2',
    charNo: '002',
    job: 'ヒーラー',
    type: 'サポーター',
    rank: '★★★★☆',
    classLabel: 'HEALER CLASS',
    catchCopy: '「優しすぎて、損してない？」と言われがちなあなたへ。',
    intro_question: '「なんで自分ばかり<br>気を使ってるんだろう…」',
    intro_body: 'って思ったこと、ない？<br><br>それ、弱さじゃなくて<br><strong>「数字」の話</strong>かもしれない。<br><br>数秘NUMBERが持つ<br>本当のステータスを解説します。',
    abilities: [
      {
        tag: 'ABILITY 01',
        title: '場の空気を読みすぎて',
        em: '自分の意見が言えなくなる',
        desc: 'これ、優柔不断じゃなくて<br><strong>「全員が納得する答えを探す」</strong>本能。<br><br>NUMBERは場の調和を保つことに<br>全エネルギーを注いでいる。',
        stats: [
          { label: '共感力', color: '#6de0b2', val: 92 },
          { label: '自己主張', color: '#a78bfa', val: 28 }
        ]
      },
      {
        tag: 'ABILITY 02',
        title: '「どっちでもいいよ」と言いながら',
        em: '内心めちゃくちゃ気にしてる',
        desc: '本当はちゃんと意見がある。<br>でも、それを言って<br><strong>雰囲気が壊れる方が怖い。</strong><br><br>気を使いすぎて自分が消えてしまうタイプ。',
        stats: [
          { label: '体力', color: '#4ade80', val: 40 },
          { label: '気遣い力', color: '#60a5fa', val: 95 }
        ]
      },
      {
        tag: 'ABILITY 03',
        title: '仲良い人のためなら無限に動けるのに',
        em: '自分のためには動けない',
        desc: '「誰かのため」が最大のエンジン。<br><br><strong>自分のことは後回し</strong>になりがちなのが<br>NUMBERの唯一の弱点。',
        stats: [
          { label: '奉仕精神', color: '#fbbf24', val: 98 },
          { label: '自己愛', color: '#f87171', val: 22 }
        ]
      }
    ],
    negatives: ['「優しすぎる」', '「自己主張が弱い」', '「八方美人」'],
    positives: ['場を整える天才', '人の気持ちを瞬時に読める', 'チームの潤滑油になれる'],
    closing: 'NUMBERのあなたがいるだけで、<br>その場の空気が柔らかくなる。<br><br><strong>それ、才能ですよ。</strong>',
    textPost:
      '数秘2番が「優しすぎる」と言われる理由\n\n' +
      'それ、性格じゃなくて数字の話。\n\n' +
      '2番は「場の調和を保つこと」に全エネルギーを注ぐタイプ。\n\n' +
      '・場の空気を読みすぎて自分の意見が言えなくなる\n' +
      '・「どっちでもいいよ」と言いながら内心めちゃくちゃ気にしてる\n' +
      '・仲良い人のためなら無限に動けるのに自分のためには動けない\n\n' +
      '優柔不断とか八方美人とかじゃなくて、これ才能です。\n' +
      'あなたがいるだけで場の空気が柔らかくなる、それって才能。\n\n' +
      '自分の数秘、知りたい人はプロフのLINEから生年月日を送るだけで無料でキャリア数秘診断できます✨'
  },

  3: {
    number: '3',
    charNo: '003',
    job: 'エンターテイナー',
    type: 'ムードメーカー',
    rank: '★★★★★',
    classLabel: 'ENTERTAINER CLASS',
    catchCopy: '「なんでそんなに楽しそうなの？」と言われがちなあなたへ。',
    intro_question: '「テンション高いね」って<br>よく言われるけど…',
    intro_body: 'それ、素の自分じゃないって<br>気づいてる人は少ない。<br><br>それ、キャラじゃなくて<br><strong>「数字」の話</strong>かもしれない。<br><br>数秘NUMBERが持つ<br>本当のステータスを解説します。',
    abilities: [
      {
        tag: 'ABILITY 01',
        title: '思いついたら即行動',
        em: '計画立てるのは苦手すぎる',
        desc: 'これ、飽きっぽいんじゃなくて<br><strong>「ワクワクが正義」</strong>な本能。<br><br>NUMBERは楽しいと思った瞬間に<br>もう動き出している。',
        stats: [
          { label: '瞬発力', color: '#6de0b2', val: 95 },
          { label: '計画性', color: '#a78bfa', val: 24 }
        ]
      },
      {
        tag: 'ABILITY 02',
        title: '場を盛り上げるの得意なのに',
        em: '一人になると急に静かになる',
        desc: '実は電池切れタイプ。<br>人前で明るくいる分<br><strong>裏でしっかり充電</strong>が必要。<br><br>ギャップに驚かれがちなNUMBER。',
        stats: [
          { label: '社交性', color: '#60a5fa', val: 93 },
          { label: '一人時間欲', color: '#4ade80', val: 80 }
        ]
      },
      {
        tag: 'ABILITY 03',
        title: '褒められると調子に乗るけど',
        em: '本番になると急に緊張する',
        desc: '注目されるのは好きなのに<br>いざ本番だと緊張しちゃう。<br><br><strong>それでも愛されキャラ</strong>なのがNUMBERの強み。',
        stats: [
          { label: '表現力', color: '#fbbf24', val: 90 },
          { label: '本番耐性', color: '#f87171', val: 35 }
        ]
      }
    ],
    negatives: ['「落ち着きがない」', '「調子いい」', '「すぐ飽きる」'],
    positives: ['場の空気を一瞬で明るくできる', 'アイデアが無限に湧いてくる', '誰からも好かれる愛嬌がある'],
    closing: 'NUMBERのあなたがいるだけで、<br>その場が一気に楽しくなる。<br><br><strong>それ、才能ですよ。</strong>',
    textPost:
      '数秘3番が「一緒にいると楽しい」と言われる理由\n\n' +
      'それ、性格じゃなくて数字の話。\n\n' +
      '3番は「ワクワクが正義」で動いてるタイプ。\n\n' +
      '・思いついたら即行動、計画立てるのは苦手すぎる\n' +
      '・場を盛り上げるの得意なのに一人になると急に静かになる\n' +
      '・褒められると調子に乗るけど本番になると急に緊張する\n\n' +
      '落ち着きがないとか調子いいとかじゃなくて、これ才能です。\n' +
      'あなたがいるだけで場が一気に楽しくなる、それって才能。\n\n' +
      '自分の数秘、知りたい人はプロフのLINEから生年月日を送るだけで無料でキャリア数秘診断できます✨'
  },

  4: {
    number: '4',
    charNo: '004',
    job: 'ビルダー',
    type: '努力家',
    rank: '★★★☆☆',
    classLabel: 'BUILDER CLASS',
    catchCopy: '「真面目だよね」と言われるけど、実は誰よりも頑固なあなたへ。',
    intro_question: '「そこまでやる？」って<br>驚かれること、ない？',
    intro_body: 'それ、几帳面とかじゃなくて<br><strong>「数字」の話</strong>かもしれない。<br><br>数秘NUMBERが持つ<br>本当のステータスを解説します。',
    abilities: [
      {
        tag: 'ABILITY 01',
        title: '一度決めたルールは',
        em: '絶対に崩したくない',
        desc: 'これ、頭が固いんじゃなくて<br><strong>「積み上げた土台を守る」</strong>本能。<br><br>NUMBERはコツコツ型の努力で<br>信頼を積み上げていく。',
        stats: [
          { label: '継続力', color: '#6de0b2', val: 96 },
          { label: '柔軟性', color: '#a78bfa', val: 30 }
        ]
      },
      {
        tag: 'ABILITY 02',
        title: '地味な作業ほど',
        em: '黙々とやり続けられる',
        desc: '派手さはないけど<br><strong>誰よりも粘り強い。</strong><br><br>気づいたら周りが匙を投げても<br>一人でやり切ってるタイプ。',
        stats: [
          { label: '忍耐力', color: '#60a5fa', val: 94 },
          { label: '瞬発力', color: '#4ade80', val: 38 }
        ]
      },
      {
        tag: 'ABILITY 03',
        title: '頼られると断れないのに',
        em: '頼るのはめちゃくちゃ苦手',
        desc: '責任感が強すぎて<br>抱え込みがちなNUMBER。<br><br><strong>本当は誰かに頼っていい。</strong>',
        stats: [
          { label: '責任感', color: '#fbbf24', val: 97 },
          { label: '甘え上手度', color: '#f87171', val: 20 }
        ]
      }
    ],
    negatives: ['「頭が固い」', '「融通が利かない」', '「真面目すぎる」'],
    positives: ['一度決めたことは最後までやり切る', 'コツコツ積み上げた信頼は本物', 'どんな地味な作業も丁寧にこなせる'],
    closing: 'NUMBERのあなたが積み上げてきたものは、<br>誰にも真似できない。<br><br><strong>それ、才能ですよ。</strong>',
    textPost:
      '数秘4番が「頭が固い」と言われる理由\n\n' +
      'それ、性格じゃなくて数字の話。\n\n' +
      '4番は「積み上げた土台を守る」ことに全力を注ぐタイプ。\n\n' +
      '・一度決めたルールは絶対に崩したくない\n' +
      '・地味な作業ほど黙々とやり続けられる\n' +
      '・頼られると断れないのに頼るのはめちゃくちゃ苦手\n\n' +
      '頭が固いとか真面目すぎるとかじゃなくて、これ才能です。\n' +
      'あなたが積み上げてきたものは誰にも真似できない、それって才能。\n\n' +
      '自分の数秘、知りたい人はプロフのLINEから生年月日を送るだけで無料でキャリア数秘診断できます✨'
  }
};
