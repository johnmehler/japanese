import n4Csv from '../../../vocab/n4.csv?raw';
import n5Csv from '../../../vocab/n5.csv?raw';

export type VocabItem = {
	id: string;
	word: string;
	kana: string;
	romaji: string;
	meaning: string;
};

export const n4Vocab: VocabItem[] = parseVocabCsv(n4Csv, 'n4');

const legacyN5Vocab: VocabItem[] = [
	{ id: 'watashi', word: '私', kana: 'わたし', romaji: 'watashi', meaning: 'I, me' },
	{ id: 'anata', word: 'あなた', kana: 'あなた', romaji: 'anata', meaning: 'you' },
	{ id: 'kare', word: '彼', kana: 'かれ', romaji: 'kare', meaning: 'he, boyfriend' },
	{ id: 'kanojo', word: '彼女', kana: 'かのじょ', romaji: 'kanojo', meaning: 'she, girlfriend' },
	{ id: 'hito', word: '人', kana: 'ひと', romaji: 'hito', meaning: 'person' },
	{ id: 'ie', word: '家', kana: 'いえ', romaji: 'ie', meaning: 'house, home' },
	{ id: 'gakkou', word: '学校', kana: 'がっこう', romaji: 'gakkou', meaning: 'school' },
	{ id: 'sensei', word: '先生', kana: 'せんせい', romaji: 'sensei', meaning: 'teacher' },
	{ id: 'gakusei', word: '学生', kana: 'がくせい', romaji: 'gakusei', meaning: 'student' },
	{ id: 'tomodachi', word: '友達', kana: 'ともだち', romaji: 'tomodachi', meaning: 'friend' },
	{ id: 'hon', word: '本', kana: 'ほん', romaji: 'hon', meaning: 'book' },
	{ id: 'pen', word: 'ペン', kana: 'ペン', romaji: 'pen', meaning: 'pen' },
	{ id: 'enpitsu', word: '鉛筆', kana: 'えんぴつ', romaji: 'enpitsu', meaning: 'pencil' },
	{ id: 'kami', word: '紙', kana: 'かみ', romaji: 'kami', meaning: 'paper' },
	{ id: 'mizu', word: '水', kana: 'みず', romaji: 'mizu', meaning: 'water' },
	{ id: 'ocha', word: 'お茶', kana: 'おちゃ', romaji: 'ocha', meaning: 'tea' },
	{ id: 'kouhi', word: 'コーヒー', kana: 'コーヒー', romaji: 'koohii', meaning: 'coffee' },
	{ id: 'pan', word: 'パン', kana: 'パン', romaji: 'pan', meaning: 'bread' },
	{ id: 'gohan', word: 'ご飯', kana: 'ごはん', romaji: 'gohan', meaning: 'rice, meal' },
	{ id: 'nikku', word: '肉', kana: 'にく', romaji: 'niku', meaning: 'meat' },
	{ id: 'sakana', word: '魚', kana: 'さかな', romaji: 'sakana', meaning: 'fish' },
	{ id: 'yasai', word: '野菜', kana: 'やさい', romaji: 'yasai', meaning: 'vegetable' },
	{ id: 'kudamono', word: '果物', kana: 'くだもの', romaji: 'kudamono', meaning: 'fruit' },
	{ id: 'ringo', word: 'りんご', kana: 'りんご', romaji: 'ringo', meaning: 'apple' },
	{ id: 'michi', word: '道', kana: 'みち', romaji: 'michi', meaning: 'road, way' },
	{ id: 'kuruma', word: '車', kana: 'くるま', romaji: 'kuruma', meaning: 'car' },
	{ id: 'densha', word: '電車', kana: 'でんしゃ', romaji: 'densha', meaning: 'train' },
	{ id: 'eki', word: '駅', kana: 'えき', romaji: 'eki', meaning: 'station' },
	{ id: 'kissaten', word: '喫茶店', kana: 'きっさてん', romaji: 'kissaten', meaning: 'cafe' },
	{ id: 'byouin', word: '病院', kana: 'びょういん', romaji: 'byouin', meaning: 'hospital' },
	{ id: 'kaisha', word: '会社', kana: 'かいしゃ', romaji: 'kaisha', meaning: 'company' },
	{ id: 'heya', word: '部屋', kana: 'へや', romaji: 'heya', meaning: 'room' },
	{ id: 'tokidoki', word: '時々', kana: 'ときどき', romaji: 'tokidoki', meaning: 'sometimes' },
	{ id: 'ima', word: '今', kana: 'いま', romaji: 'ima', meaning: 'now' },
	{ id: 'ashita', word: '明日', kana: 'あした', romaji: 'ashita', meaning: 'tomorrow' },
	{ id: 'kinou', word: '昨日', kana: 'きのう', romaji: 'kinou', meaning: 'yesterday' },
	{ id: 'kyou', word: '今日', kana: 'きょう', romaji: 'kyou', meaning: 'today' },
	{ id: 'asa', word: '朝', kana: 'あさ', romaji: 'asa', meaning: 'morning' },
	{ id: 'hiru', word: '昼', kana: 'ひる', romaji: 'hiru', meaning: 'daytime, noon' },
	{ id: 'yoru', word: '夜', kana: 'よる', romaji: 'yoru', meaning: 'night' },
	{ id: 'gogo', word: '午後', kana: 'ごご', romaji: 'gogo', meaning: 'afternoon' },
	{ id: 'ban', word: '晩', kana: 'ばん', romaji: 'ban', meaning: 'evening' },
	{ id: 'nichi', word: '日', kana: 'ひ', romaji: 'hi', meaning: 'day, sun' },
	{ id: 'shuu', word: '週', kana: 'しゅう', romaji: 'shuu', meaning: 'week' },
	{ id: 'gatsu', word: '月', kana: 'がつ', romaji: 'gatsu', meaning: 'month' },
	{ id: 'toshi', word: '年', kana: 'とし', romaji: 'toshi', meaning: 'year' },
	{ id: 'toki', word: '時', kana: 'とき', romaji: 'toki', meaning: 'time' },
	{ id: 'eiga', word: '映画', kana: 'えいが', romaji: 'eiga', meaning: 'movie' },
	{ id: 'ongaku', word: '音楽', kana: 'おんがく', romaji: 'ongaku', meaning: 'music' },
	{ id: 'tenki', word: '天気', kana: 'てんき', romaji: 'tenki', meaning: 'weather' },
	{ id: 'ame', word: '雨', kana: 'あめ', romaji: 'ame', meaning: 'rain' },
	{ id: 'yuki', word: '雪', kana: 'ゆき', romaji: 'yuki', meaning: 'snow' },
	{ id: 'kaze', word: '風', kana: 'かぜ', romaji: 'kaze', meaning: 'wind, cold' },
	{ id: 'sora', word: '空', kana: 'そら', romaji: 'sora', meaning: 'sky' },
	{ id: 'yama', word: '山', kana: 'やま', romaji: 'yama', meaning: 'mountain' },
	{ id: 'kawa', word: '川', kana: 'かわ', romaji: 'kawa', meaning: 'river' },
	{ id: 'umi', word: '海', kana: 'うみ', romaji: 'umi', meaning: 'sea, ocean' },
	{ id: 'ki', word: '木', kana: 'き', romaji: 'ki', meaning: 'tree, wood' },
	{ id: 'hana', word: '花', kana: 'はな', romaji: 'hana', meaning: 'flower' },
	{ id: 'inu', word: '犬', kana: 'いぬ', romaji: 'inu', meaning: 'dog' },
	{ id: 'neko', word: '猫', kana: 'ねこ', romaji: 'neko', meaning: 'cat' },
	{ id: 'tori', word: '鳥', kana: 'とり', romaji: 'tori', meaning: 'bird' },
	{ id: 'ookii', word: '大きい', kana: 'おおきい', romaji: 'ookii', meaning: 'big, large' },
	{ id: 'chiisai', word: '小さい', kana: 'ちいさい', romaji: 'chiisai', meaning: 'small' },
	{ id: 'atarashii', word: '新しい', kana: 'あたらしい', romaji: 'atarashii', meaning: 'new' },
	{ id: 'furui', word: '古い', kana: 'ふるい', romaji: 'furui', meaning: 'old (things)' },
	{ id: 'ii', word: 'いい', kana: 'いい', romaji: 'ii', meaning: 'good' },
	{ id: 'warui', word: '悪い', kana: 'わるい', romaji: 'warui', meaning: 'bad' },
	{ id: 'takai', word: '高い', kana: 'たかい', romaji: 'takai', meaning: 'tall, expensive' },
	{ id: 'yasui', word: '安い', kana: 'やすい', romaji: 'yasui', meaning: 'cheap' },
	{ id: 'atsui', word: '暑い', kana: 'あつい', romaji: 'atsui', meaning: 'hot (weather)' },
	{ id: 'samui', word: '寒い', kana: 'さむい', romaji: 'samui', meaning: 'cold (weather)' },
	{ id: 'omoshiroi', word: '面白い', kana: 'おもしろい', romaji: 'omoshiroi', meaning: 'interesting, funny' },
	{ id: 'tsumaranai', word: 'つまらない', kana: 'つまらない', romaji: 'tsumaranai', meaning: 'boring' },
	{ id: 'muzukashii', word: '難しい', kana: 'むずかしい', romaji: 'muzukashii', meaning: 'difficult' },
	{ id: 'yasashii', word: '易しい', kana: 'やさしい', romaji: 'yasashii', meaning: 'easy' },
	{ id: 'kau', word: '買う', kana: 'かう', romaji: 'kau', meaning: 'to buy' },
	{ id: 'uru', word: '売る', kana: 'うる', romaji: 'uru', meaning: 'to sell' },
	{ id: 'taberu', word: '食べる', kana: 'たべる', romaji: 'taberu', meaning: 'to eat' },
	{ id: 'nomu', word: '飲む', kana: 'のむ', romaji: 'nomu', meaning: 'to drink' },
	{ id: 'miru', word: '見る', kana: 'みる', romaji: 'miru', meaning: 'to see, watch' },
	{ id: 'kiku', word: '聞く', kana: 'きく', romaji: 'kiku', meaning: 'to listen, ask' },
	{ id: 'yomu', word: '読む', kana: 'よむ', romaji: 'yomu', meaning: 'to read' },
	{ id: 'kaku', word: '書く', kana: 'かく', romaji: 'kaku', meaning: 'to write' },
	{ id: 'iku', word: '行く', kana: 'いく', romaji: 'iku', meaning: 'to go' },
	{ id: 'kuru', word: '来る', kana: 'くる', romaji: 'kuru', meaning: 'to come' },
	{ id: 'suru', word: 'する', kana: 'する', romaji: 'suru', meaning: 'to do' },
	{ id: 'miru2', word: '見る', kana: 'みる', romaji: 'miru', meaning: 'to see' },
	{ id: 'hanasu', word: '話す', kana: 'はなす', romaji: 'hanasu', meaning: 'to speak, talk' },
	{ id: 'benkyou', word: '勉強', kana: 'べんきょう', romaji: 'benkyou', meaning: 'study' },
	{ id: 'shigoto', word: '仕事', kana: 'しごと', romaji: 'shigoto', meaning: 'work, job' },
	{ id: 'yasumi', word: '休み', kana: 'やすみ', romaji: 'yasumi', meaning: 'rest, day off' },
	{ id: 'kouen', word: '公園', kana: 'こうえん', romaji: 'kouen', meaning: 'park' },
	{ id: 'toshokan', word: '図書館', kana: 'としょかん', romaji: 'toshokan', meaning: 'library' },
	{ id: 'byouki', word: '病気', kana: 'びょうき', romaji: 'byouki', meaning: 'illness, sickness' },
	{ id: 'kenkou', word: '健康', kana: 'けんこう', romaji: 'kenkou', meaning: 'health' },
	{ id: 'okane', word: 'お金', kana: 'おかね', romaji: 'okane', meaning: 'money' },
	{ id: 'denwa', word: '電話', kana: 'でんわ', romaji: 'denwa', meaning: 'telephone' },
	{ id: 'kamera', word: 'カメラ', kana: 'カメラ', romaji: 'kamera', meaning: 'camera' },
	{ id: 'tokei', word: '時計', kana: 'とけい', romaji: 'tokei', meaning: 'clock, watch' },
	{ id: 'kagi', word: '鍵', kana: 'かぎ', romaji: 'kagi', meaning: 'key' },
	{ id: 'kasa', word: '傘', kana: 'かさ', romaji: 'kasa', meaning: 'umbrella' },
	{ id: 'megane', word: '眼鏡', kana: 'めがね', romaji: 'megane', meaning: 'glasses' },
	{ id: 'fuku', word: '服', kana: 'ふく', romaji: 'fuku', meaning: 'clothes' },
	{ id: 'kutsu', word: '靴', kana: 'くつ', romaji: 'kutsu', meaning: 'shoes' },
];

function parseVocabCsv(csv: string, level: string): VocabItem[] {
	const rows = csv.trim().split(/\r?\n/).slice(1);
	return rows.map((row, index) => {
		const fields = [...row.matchAll(/(?:^|,)\s*(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g)].map(
			(match) => (match[1] ?? match[2] ?? '').replace(/""/g, '"').trim()
		);
		const [word, kana, meaning] = fields;
		return {
			id: `${level}-${index}-${word}`,
			word,
			kana,
			romaji: '',
			meaning,
		};
	});
}

export const n5Vocab: VocabItem[] = parseVocabCsv(n5Csv, 'n5');
