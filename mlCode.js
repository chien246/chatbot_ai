//thư viện dùng đọc file
var fs = require('fs');
var path = require('path');
//thư viện tách từ
var vntk =require('vntk');
//biến tách từ
var tokenizer = vntk.wordTokenizer();

var tf = require('@tensorflow/tfjs');

// đọc file lưu stopword
var words = fs.readFileSync(path.join(__dirname, './stopwords.txt'), 'utf8');
var arayStopWords = words.split();

//đọc file dữ liệu train
var data = fs.readFileSync('./dataInput.json', 'utf8');
var word = JSON.parse(data);




var resultRs;
//hàm hợp hai mảng
function arrayUnique(array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
}

//đếm số từ trong câu
function count(array) {
	let dem = 0;
	for (i in array) dem++;
	return dem;
}

//hàm làm sạch các câu dữ liệu
function clean(string){
	//regex loại bỏ các ký tự đặc biệt
	let re = /[^()_+\-=\[\]{};':"\\|!@#$%^&*,.<>\/?*S]+/gi;
	let newstr = string.match(re);

	let news = "";
	for (let i in newstr) news = news + newstr[i];
	
	let te;
	for (let i in arayStopWords){
		let re1 = new RegExp('\w*'+arayStopWords[i],'gi');
		te = news.replace(re1,'');
	}
	//tách từ
	let crackWord = tokenizer.tag(te, 'text');
	return crackWord;
}
var mainEx = async function main(stringTest) {
	//mảng từ điển
	var dictionary = new Array();

	//mảng chứa mảng các từ trong mỗi câu
	var listWordOfData = new Array();
	var d = 0;
	//mảng lưu các loại lớp
	var types = new Array();
	//mảng lưu giá trị type của câu dữ liệu
	var typ = new Array();
	var textCleanTest = clean(stringTest);

	//bắt đầu tạo mảng từ điển

	for (let i in word) {
		//làm sạch
		let st = clean(word[i].text);
		//tạo mảng các từ trong mỗi câu
		let stringData = st.split(' ');
		//thêm vào mảng chứa mảng các từ
		listWordOfData[d] = stringData;
		d++;
		//thêm các từ vào từ điển
		dictionary = arrayUnique(dictionary.concat(stringData));	
	}

	//thêm từ trong test data và từ điển
	var arrayTextTest = textCleanTest.split(' ');
	dictionary = arrayUnique(dictionary.concat(arrayTextTest));
	// console.log(dictionary);
	//kết thức tạo từ điển

	//tổng số câu trong data
	let totalDocument = d;
	console.log(d);
	//mảng chứa các ma trận trọng số của các câu data
	var wordictAll = new Array();
	d = 0;
	//tạo ma trận trọng số cho từng câu theo từ điển
	for (let i in listWordOfData) {
		let worDict_i = new Map();
		for(let j in dictionary) {
			worDict_i.set(dictionary[j],0);
		}
		
		for (let word of listWordOfData[i]) {
			//cập nhật lại trọng số là số lần xuất hiện của từ trong câu
			var index = worDict_i.get(word);
			index +=1;
			worDict_i.set(word,index);
		}
		tong_so_tu_trong_cau = count(listWordOfData[i]);
		
		for (let word of listWordOfData[i]) {
			//cập nhật lại trọng số là TF-IDF của từ trong câu
			var index = worDict_i.get(word);
			//tính TF
			let tf = index/tong_so_tu_trong_cau;
			//tính IDF
			//-tìm số câu chứa word
			let count = 0;
			for (let w of listWordOfData) {
				for (let j of w){
						if(word === j) count++;
				}
			}
			//-IDF = số câu / sô câu có từ word;
			let idf = totalDocument/count;
			worDict_i.set(word,Number((tf*idf).toFixed(2)));
			
		}
		wordictAll[d] = worDict_i;
		d++;
		console.log(worDict_i);
	}

	//tính tf-idf cho textTest
	let worDictTest_i = new Map();
		for(let j in dictionary) {
			worDictTest_i.set(dictionary[j],0);
		}
		
		for (let word of arrayTextTest) {
			//cập nhật lại trọng số là số lần xuất hiện của từ trong câu
			var index = worDictTest_i.get(word);
			index +=1;
			worDictTest_i.set(word,index);
		}
		tong_so_tu_trong_cau = count(arrayTextTest);
		
		for (let word of arrayTextTest) {
			//cập nhật lại trọng số là TF-IDF của từ trong câu
			var index = worDictTest_i.get(word);
			//tính TF
			let tf = index/tong_so_tu_trong_cau;
			//tính IDF
			//-tìm số câu chứa word
			let count = 0;
			for (let w of listWordOfData) {
				for (let j of w){
						if(word === j) count++;
				}
			}
			//-IDF = số câu / sô câu có từ word;
			let idf = totalDocument/count;
			worDictTest_i.set(word,Number((tf*idf).toFixed(2)));
			
		}
	console.log("test: "+ worDictTest_i);


	//mảng chứa các vector câu
	var vectors = new Array();
	d=0;
	for (let maps of wordictAll) {
		let mapToArray = [...maps.values()];
		vectors[d] = mapToArray;
		d++;
		console.log(vectors[d-1]);
	}
	//map to array textTest
	let mapToArrayTest = [...worDictTest_i.values()];
	console.log("test: "+ mapToArrayTest);

	d = 0;
	for (let ty of word) {
		typ[d] = ty.type;
		d++;
	}
	types = [...new Set(typ)];

	let typesInput = [];
	typ.map((item) => {
		typesInput.push(types.indexOf(item));
	});




	let wordInputTensor = tf.tensor2d(vectors);
	console.log(wordInputTensor);
	let typeTensor = tf.tensor1d(typesInput, 'int32');
	let typeinputTensor = tf.oneHot(typeTensor,types.length);

	typeinputTensor.print();


	//tạo model
	let model = tf.sequential();

	//thêm hiddenlayer
	let hiden = tf.layers.dense({
		inputShape: dictionary.length,
		units: 16,
		activation: "sigmoid"
	});

	let output = tf.layers.dense({
		units: types.length,
		activation: "softmax"
	});

	model.add(hiden);
	model.add(output);

	model.compile({
		optimizer: tf.train.sgd(0.2),
		loss: "categoricalCrossentropy"
	});


	//train model
	let options = {
		epochs: 100,
		validationSplit: 0.1,
		shuffle: true
	};
	async function train(){
	let result = await model.fit(wordInputTensor,typeinputTensor,options);

	let arrayTest = new Array();
	arrayTest[0] = mapToArrayTest;//chào bạn
	let pridictTensor = model.predict(tf.tensor2d(arrayTest)).argMax(1).dataSync(0);

	return types[pridictTensor];
	};

	resultRs = await train();
	return resultRs;
}

module.exports.main = mainEx;
