$(function () {
    //ファイルボタンが押されたら本来のinputを発火
    $('.file-input-button').on('click', function () { $('#file-input-core-' + $(this).attr('value')).trigger('click'); });

    //usc読み込み処理
    let fcheck1 = false, fcheck2 = false;
    $('.file-input-core').on('change', function (e) {
        const files = e.target.files;
        if (files.length === 0) return;
        if (files[0].name.substr(-4) === '.usc') {
            const reader = new FileReader();
            reader.onload = () => {
                uscInput[Number($(this).attr('value')) - 1] = JSON.parse(reader.result);
                console.log(JSON.parse(reader.result));
            };
            reader.readAsText(files[0]);
            $('#file-input-error-' + $(this).attr('value')).text('');
            if ($(this).attr('value') === '2') { fcheck1 = true; } else if ($(this).attr('value') === '3') { fcheck2 = true; } else {
                $('#download-' + $(this).attr('value')).addClass('can-download');
            }
            if (fcheck1 && fcheck2) $('#download-2').addClass('can-download');
        } else {
            $('#file-input-error-' + $(this).attr('value')).text('uscファイルを選択してください');
            if ($(this).attr('value') === '2') {
                fcheck1 = false;
                $('#download-2').removeClass('can-download');
            } else if ($(this).attr('value') === '3') {
                fcheck2 = false;
                $('#download-2').removeClass('can-download');
            } else {
                $('#download-' + $(this).attr('value')).removeClass('can-download');
            }
        }
        let fileSize = files[0].size, sizeUnit = 'B';
        if (fileSize >= 1000000) { fileSize = Math.round(fileSize / (2 ** 20) * 100) / 100, sizeUnit = 'MB'; }
        else if (fileSize >= 1000) { fileSize = Math.round(fileSize / (2 ** 10) * 100) / 100, sizeUnit = 'KB'; }
        $('#file-info-' + $(this).attr('value')).text(files[0].name + ' ( ' + fileSize + ' ' + sizeUnit + ' )');
    });

    //uscダウンロード処理
    $('.download').on('click', function () {
        if ($(this).hasClass('can-download')) {
            uscBatchConversion($(this).attr('value'));
            const blob = new Blob([uscOutput], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            $('<a href="' + url + '" download="' + $('#name-input-' + $(this).attr('value')).text() + '.usc"></a>')[0].click();
            URL.revokeObjectURL(url);
        }
    });

    //書き込み可能箇所のEnter(改行)無効
    $('div[contenteditable="true"]').keypress(function (e) { if (e.key === 'Enter') { return e.preventDefault(); } });

    //空の状態でフォーカスアウトした場合デフォルト値を補完する
    $('div[contenteditable="true"]').blur(function () { if ($(this).text() === '') $(this).text($(this).attr('value')); });

    //チェックボックスのオンオフ
    $('.checkbox').on('click', function () {
        $('#checkbox-' + $(this).attr('value')).toggle();
        $('.checkbox-' + $(this).attr('value')).toggle();
        if ($(this).attr('value') === '4') $('#config-button-' + $(this).attr('value')).toggle();
    });

    //カスタム入力画面の切り替え
    $('#custom-input-type').on('click', function () {
        $('.custom').hide();
        $('#custom-' + !($('#custom-input-core').prop('checked'))).show();
    });

    //カスタム入力のplaceholderの処理
    $('#lane-c2').focus(function () { if ($(this).hasClass('color-gray')) $(this).text('').removeClass('color-gray'); });
    $('#lane-c2').blur(function () {
        if ($(this).text() === '') $(this).text('lane値をカンマ区切りで入力(色は選択中の色に統一されます)').addClass('color-gray');
    });

    //プルダウンメニューの開閉
    $('.pulldown-button').on('click', function () {
        $('.sub-item').not('#pulldown-' + $(this).attr('value')).hide();
        $('#pulldown-' + $(this).attr('value')).toggle();
    });

    //プルダウンメニューの選択処理
    $('.pulldown-option').on('click', function () {
        if ($(this).attr('value') === '4') {
            $('#p-input-' + $(this).attr('value')).text($(this).text()).css('color', $(this).attr('href'))
                .attr({ 'href': $(this).attr('href'), 'name': $(this).attr('name') });
        } else { $('#p-input-' + $(this).attr('value')).text($(this).text()); }
        $('#pulldown-' + $(this).attr('value')).hide();
    });

    //ツールの切り替え
    $('.function-button').on('click', function () {
        $('.selected').removeClass('selected');
        $(this).addClass('selected');
        $('.main').hide();
        $('.sub-item').hide();
        $($(this).attr('href')).show();
    });

    //スプリット生成ツールのUIを生成
    $('#lane-c1').append('<table id="lane-ui-select"><tr></tr></table>');
    for (i = 0; i < 13; i++) $('#lane-ui-select tr').append('<td class="triangle-button" name="0" value="' + i + '">▼</td>');
    $('#lane-c1').append('<div id="lane-ui-lane" class="flex"></div>');
    for (i = 0; i < 13; i++) $('#lane-ui-lane').append('<div class="vertical-line" name="0" value="' + i + '"></div>');
    $('.vertical-line').not(':eq(0)').addClass('lane-ui-margin');

    //スプリット生成ツールのUIの処理
    $('.triangle-button').on('click', function () {
        let color = $('#p-input-4').attr('href'), colorNum = $('#p-input-4').attr('name');
        if ($(this).attr('name') === '0' || $(this).attr('name') !== colorNum) {
            $(this).attr('name', colorNum).css('color', color);
            $('.vertical-line').eq($(this).attr('value')).attr('name', colorNum).css('background-color', color);
        } else {
            $(this).attr('name', '0').css('color', '#afa');
            $('.vertical-line').eq($(this).attr('value')).attr('name', '0').css('background-color', '#afa');
        }
    });

    //フェードイン・フェードアウト設定画面の処理
    $('.config-button').on('click', function () {
        $('#config-' + $(this).attr('value')).show();
    });
});

//メイン
let uscInput = [], uscOutput;
function uscBatchConversion(type) {

    //usc一括変換ツール
    if (type === '1') {
        let data = JSON.parse(JSON.stringify(uscInput[0]));
        for (i = 0; i < data.usc.objects.length; i++) { objectKeysClassify(data, 1, 0); }
        uscOutput = JSON.stringify(data);
    }

    //usc合成ツール
    else if (type === '2') {
        let data1 = JSON.parse(JSON.stringify(uscInput[1]));
        let data2 = JSON.parse(JSON.stringify(uscInput[2]));
        let timeScaleGroupCount = 0;
        for (i = 0; i < data1.usc.objects.length; i++) if (data1.usc.objects[i].type === 'timeScaleGroup') timeScaleGroupCount++;
        for (i = 0; i < data2.usc.objects.length; i++) objectKeysClassify(data2, 2, timeScaleGroupCount);
        for (i = 0; i < data2.usc.objects.length; i++) if (data2.usc.objects[i].type !== 'bpm') data1.usc.objects.push(data2.usc.objects[i]);
        uscOutput = JSON.stringify(data1);
    }

    //円形作成ツール
    else if (type === '3') {
        let data = JSON.parse(JSON.stringify(uscInput[3]));
        for (t = 0; t <= 1; t++) createCircle(data, t);
        uscOutput = JSON.stringify(data);
    }

    //スプリット生成ツール
    else if (type === '4') {
        let data = JSON.parse(JSON.stringify(uscInput[4]));
        generateSplit(data);
        uscOutput = JSON.stringify(data);
    }

    if ($('#indent-input-core').prop('checked')) {
        const v = [/{/g, /}/g, /\[/g, /\]/g, /:/g, /,/g], r = ['{\n', '\n}', '[\n', '\n]', ': ', ',\n'];
        for (i = 0; i < v.length; i++) uscOutput = uscOutput.replace(v[i], r[i]);
    }
}

//objectsのtype別に分ける
function objectKeysClassify(data, type, tsgc) {
    switch (data.usc.objects[i].type) {
        case 'bpm': changeObject(data.usc.objects[i], 3, tsgc);
            break;
        case 'timeScaleGroup':
            changeObject(data.usc.objects[i], 4, tsgc);
            break;
        case 'single':
        case 'damage':
            changeObject(data.usc.objects[i], type, tsgc);
            break;
        case 'guide':
            for (j = 0; j < data.usc.objects[i].midpoints.length; j++) changeObject(data.usc.objects[i].midpoints[j], type, tsgc);
            break;
        case 'slide':
            for (j = 0; j < data.usc.objects[i].connections.length; j++) changeObject(data.usc.objects[i].connections[j], type, tsgc);
            break;
        default:
            break;
    }
}

//一括書き換え
function changeObject(obj, type, tsgc) {
    if (type === 1) {
        //ミラー有効時の処理
        if ($('#mirror-input-core').prop('checked')) {
            if (obj.direction === "left") { obj.direction = "right"; } else if (obj.direction === "right") { obj.direction = "left"; }
            obj.lane *= -1;
        }
        //終点一括置換有効時の処理
        if ($('#p-input-1').text() !== 'そのまま') {
            if (obj.type === 'end' && !(obj.direction === 'up' || obj.direction === 'left' || obj.direction === 'right')) {
                if ($('#p-input-1').text() === '全て通常') obj.judgeType = 'normal';
                if ($('#p-input-1').text() === '全てトレース') obj.judgeType = 'trace';
                if ($('#p-input-1').text() === '全て削除') obj.judgeType = 'none';
            }
        }
        obj.beat = obj.beat * (Number($('#beat-a1').text()) / Number($('#beat-a2').text()))
            + (Number($('#beat-a3').text()) / Number($('#beat-a4').text()));
        obj.size = obj.size * (Number($('#size-a1').text()) / Number($('#size-a2').text()))
            + (Number($('#size-a3').text()) / Number($('#size-a4').text()));
        obj.lane = obj.lane * (Number($('#lane-a1').text()) / Number($('#lane-a2').text()))
            + (Number($('#lane-a3').text()) / Number($('#lane-a4').text()));
    } else if (type === 2) {
        obj.timeScaleGroup = obj.timeScaleGroup + tsgc;
    } else if (type === 3) {
        obj.beat = obj.beat * (Number($('#beat-a1').text()) / Number($('#beat-a2').text()))
            + (Number($('#beat-a3').text()) / Number($('#beat-a4').text()));
        obj.bpm = obj.bpm * (Number($('#bpm-a1').text()) / Number($('#bpm-a2').text()))
            + (Number($('#bpm-a3').text()) / Number($('#bpm-a4').text()));
    } else if (type === 4) {
        for (j = 0; j < obj.changes.length; j++) {
            obj.changes[j].beat = obj.changes[j].beat * (Number($('#beat-a1').text()) / Number($('#beat-a2').text()))
                + (Number($('#beat-a3').text()) / Number($('#beat-a4').text()));
        }
    }
}

//円を生成
function createCircle(data, type) {
    let circlePropertyLeng;
    if ($('#p-input-2').text() === '分音符') {
        circlePropertyLeng = Number($('#leng-b2').text()) / Number($('#leng-b1').text()) * 4;
    } else if ($('#p-input-2').text() === '拍') {
        circlePropertyLeng = Number($('#leng-b1').text()) / Number($('#leng-b2').text());
    }
    const circleProperty = {
        beat: Number($('#beat-b1').text()) + (Number($('#beat-b2').text()) / Number($('#beat-b3').text())),
        leng: circlePropertyLeng,
        outsideSize: Number($('#size-b1').text()) / Number($('#size-b2').text()),
        insideSize: Number($('#size-b3').text()) / Number($('#size-b4').text()),
        lane: Number($('#lane-b1').text()) + (Number($('#lane-b2').text()) / Number($('#lane-b3').text())),
        quality: Number($('#quality-b1').text())
    };
    let circle = {
        "connections": [
            {
                beat: circleProperty.beat,
                critical: false,
                ease: "linear",
                judgeType: "none",
                lane: circleProperty.lane,
                size: 0,
                timeScaleGroup: 0,
                type: "start"
            }
        ],
        "critical": false,
        "type": "slide"
    };
    for (i = 1; i < circleProperty.quality; i++) {
        const os = circleProperty.outsideSize, is = circleProperty.insideSize;
        let outline = Math.sqrt((os ** 2) - ((i * os * 2 / circleProperty.quality) - os) ** 2),
            inline = Math.sqrt((is ** 2) - ((i * os * 2 / circleProperty.quality) - os) ** 2);
        if (isNaN(inline)) inline = 0;
        console.log(outline);
        console.log(inline);
        if (type === 1) outline *= -1, inline *= -1;
        if ($('#bend-input-core').prop('checked')) {
            const tan25 = (Math.tan((25 * Math.PI) / 180));
            outline *= ((1 - tan25) + (i * tan25 / circleProperty.quality)) / (0.7990110593400609);//仮
            inline *= ((1 - tan25) + (i * tan25 / circleProperty.quality)) / (0.7990110593400609);//仮
        }
        let circleTick = {
            beat: circleProperty.beat + ((circleProperty.leng / circleProperty.quality) * i),
            ease: "linear",
            lane: (outline + inline) / 2 + circleProperty.lane,
            size: (outline - inline) / 2,
            timeScaleGroup: 0,
            type: "tick"
        }
        circle.connections.push(circleTick);
    }
    const circleEnd = {
        beat: circleProperty.beat + circleProperty.leng,
        critical: false,
        judgeType: "none",
        lane: circleProperty.lane,
        size: 0,
        timeScaleGroup: 0,
        type: "end"
    }
    circle.connections.push(circleEnd);
    data.usc.objects.push(circle);

    //(1 - tan25 + tan25 * x) * (b - b(2x - 1) ^ 2)
    //(((os * 2) / circleProperty.quality) * i) - os
    //console.log(1/0.631114165574);
    //const tan25 = (Math.tan((25 * Math.PI) / 180));
    //console.log(1 / (6 / (((36 - ((12 * 0.631114165574) - 6) ** 2) ** 0.5) * ((1 - tan25) + (tan25 * 0.631114165574)))));
}

//スプリットを生成
function generateSplit(data) {
    let splitPropertyLeng;
    if ($('#p-input-3').text() === '分音符') {
        splitPropertyLeng = Number($('#leng-c2').text()) / Number($('#leng-c1').text()) * 4;
    } else if ($('#p-input-3').text() === '拍') {
        splitPropertyLeng = Number($('#leng-c1').text()) / Number($('#leng-c2').text());
    }
    let splitProperty = {
        beat: Number($('#beat-c1').text()) + (Number($('#beat-c2').text()) / Number($('#beat-c3').text())),
        leng: splitPropertyLeng,
        width: Number($('#width-c1').text()) / Number($('#width-c2').text()) * 0.5,
        lane: [],
        color: [],
    }
    const colors = [null, 'green', 'yellow', 'red', 'blue', 'cyan', 'purple', 'neutral', 'black'];
    if ($('#custom-input-core').prop('checked')) {
        splitProperty.lane = $('#lane-c2').text().replace(/\s/g, '').split(',');
        for (i = 0; i < splitProperty.lane.length; i++) splitProperty.color[i] = colors[$('#p-input-4').attr('name')];
    } else {
        for (i = 0; i < 13; i++) if ($('.vertical-line').eq(i).attr('name') !== '0') {
            splitProperty.lane.push(i - 6);
            splitProperty.color.push(colors[$('.vertical-line').eq(i).attr('name')]);
        }
    }
    for (i = 0; i < splitProperty.lane.length; i++) {
        let split = {
            "color": splitProperty.color[i],
            "fade": "none",
            "midpoints": [
                {
                    "beat": splitProperty.beat,
                    "ease": "linear",
                    "lane": splitProperty.lane[i],
                    "size": splitProperty.width,
                    "timeScaleGroup": 0
                },
                {
                    "beat": splitProperty.beat + splitProperty.leng,
                    "ease": "linear",
                    "lane": splitProperty.lane[i],
                    "size": splitProperty.width,
                    "timeScaleGroup": 0
                }
            ],
            "type": "guide"
        }
        data.usc.objects.push(split);
    }
}