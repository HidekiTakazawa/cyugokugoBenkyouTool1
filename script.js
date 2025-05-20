document.addEventListener('DOMContentLoaded', () => {
    const taskTypeSelect = document.getElementById('task-type');
    const forms = {
        correction: document.getElementById('correction-form'),
        composition: document.getElementById('composition-form'),
        explanation: document.getElementById('explanation-form')
    };
    const generatedPromptArea = document.getElementById('generated-prompt-area');
    const copyPromptBtn = document.getElementById('copy-prompt-btn');
    const aiResponseArea = document.getElementById('ai-response-area');
    const saveDataBtn = document.getElementById('save-data-btn');
    const clearFormBtn = document.getElementById('clear-form-btn');
    const dataListContainer = document.getElementById('data-list-container');
    const editingItemIdInput = document.getElementById('editing-item-id');

    // 入力フィールド
    const correctionJapaneseText = document.getElementById('correction-japanese-text');
    const correctionChineseTranslation = document.getElementById('correction-chinese-translation');
    const compositionJapaneseText = document.getElementById('composition-japanese-text');
    const explanationChineseQuery = document.getElementById('explanation-chinese-query');

    // AI依頼文作成ボタン
    const correctionGeneratePromptBtn = document.getElementById('correction-generate-prompt-btn');
    const compositionGeneratePromptBtn = document.getElementById('composition-generate-prompt-btn');
    const explanationGeneratePromptBtn = document.getElementById('explanation-generate-prompt-btn');

    const STORAGE_KEY = 'chineseLearningAppData';
    let dataStore = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    // --- UI制御 ---
    function updateFormVisibility() {
        const selectedType = taskTypeSelect.value;
        for (const type in forms) {
            forms[type].style.display = (type === selectedType) ? 'block' : 'none';
        }
        clearPromptAndResponse(); // フォーム切り替え時にプロンプトと回答欄をクリア
    }

    taskTypeSelect.addEventListener('change', updateFormVisibility);

    // --- AI依頼文生成 ---
    function generatePrompt() {
        const type = taskTypeSelect.value;
        let prompt = '';
        let userText = '';

        switch (type) {
            case 'correction':
                userText = correctionChineseTranslation.value.trim();
                if (!userText) {
                    alert('「中国語訳した文章」を入力してください。');
                    return;
                }
                prompt = `役割： あなたは中国語学習の先生です。私はあなたの生徒です。私が書いた中国語の作文を添削してください。
作文： ${userText}
上記の形式で作文の文章をあなたに渡します。
以下の項目で添削してください。
添削基準：
（１）　作文の内容を理解できるか？
（２）　作文に中国語の文法に誤りがあれば指摘してください。
（３）　文法の誤りを正した中国語文章も提示してください。
（４）　文章でより良い表現があれば、中国語で提案してください。
添削結果： 添削結果を出力してください。
作文： `;
                break;
            case 'composition':
                userText = compositionJapaneseText.value.trim();
                 if (!userText) {
                    alert('「中国語に翻訳したい日本語の文章」を入力してください。');
                    return;
                }
                prompt = `役割： あなたは中国語学習の先生です。私はあなたの生徒です。中国語はまだ初心者です。私が書いた日本語文章をできるだけ簡単な中国語を使用して中国語に翻訳してください。
日本語文章:　${userText}`;
                break;
            case 'explanation':
                userText = explanationChineseQuery.value.trim();
                if (!userText) {
                    alert('「AIに尋ねたい中国語の文章」を入力してください。');
                    return;
                }
                prompt = `役割： あなたは中国語学習の先生です。私はあなたの生徒です。私の疑問を日本語で回答してください。
疑問内容:　${userText}`;
                break;
        }
        generatedPromptArea.value = prompt;
    }

    correctionGeneratePromptBtn.addEventListener('click', generatePrompt);
    compositionGeneratePromptBtn.addEventListener('click', generatePrompt);
    explanationGeneratePromptBtn.addEventListener('click', generatePrompt);

    // --- クリップボードコピー ---
    copyPromptBtn.addEventListener('click', () => {
        if (generatedPromptArea.value) {
            navigator.clipboard.writeText(generatedPromptArea.value)
                .then(() => alert('依頼文章をクリップボードにコピーしました。'))
                .catch(err => console.error('コピーに失敗しました: ', err));
        } else {
            alert('コピーする依頼文章がありません。');
        }
    });

    // --- データ保存・更新 ---
    saveDataBtn.addEventListener('click', () => {
        const type = taskTypeSelect.value;
        const aiResponse = aiResponseArea.value.trim();
        const editingId = editingItemIdInput.value;
        
        let itemData = { type, aiResponse };
        let isValid = true;

        switch (type) {
            case 'correction':
                itemData.japaneseText = correctionJapaneseText.value.trim();
                itemData.chineseTranslation = correctionChineseTranslation.value.trim();
                if (!itemData.japaneseText || !itemData.chineseTranslation) {
                    alert('日本語文章と中国語訳した文章を入力してください。');
                    isValid = false;
                }
                break;
            case 'composition':
                itemData.japaneseTextForComposition = compositionJapaneseText.value.trim();
                if (!itemData.japaneseTextForComposition) {
                    alert('翻訳したい日本語の文章を入力してください。');
                    isValid = false;
                }
                break;
            case 'explanation':
                itemData.chineseQueryText = explanationChineseQuery.value.trim();
                if (!itemData.chineseQueryText) {
                    alert('AIに尋ねたい中国語の文章を入力してください。');
                    isValid = false;
                }
                break;
        }

        if (!aiResponse && isValid) {
             if (!confirm("AIの回答が空ですが、このまま保存しますか？")) {
                isValid = false;
            }
        }

        if (!isValid) return;

        if (editingId) { // 更新の場合
            const index = dataStore.findIndex(item => item.id === editingId);
            if (index > -1) {
                dataStore[index] = { ...dataStore[index], ...itemData, aiResponse };
                alert('データを更新しました。');
            }
        } else { // 新規保存の場合
            itemData.id = Date.now().toString(); // 簡単なID生成
            dataStore.push(itemData);
            alert('データを保存しました。');
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataStore));
        renderDataList();
        clearAllFormsAndState();
    });
    
    // --- フォームクリア ---
    function clearAllFormsAndState() {
        correctionJapaneseText.value = '';
        correctionChineseTranslation.value = '';
        compositionJapaneseText.value = '';
        explanationChineseQuery.value = '';
        aiResponseArea.value = '';
        generatedPromptArea.value = '';
        editingItemIdInput.value = '';
        saveDataBtn.textContent = 'この内容を保存';
        clearFormBtn.style.display = 'none';
    }

    function clearPromptAndResponse() {
        generatedPromptArea.value = '';
        // aiResponseArea.value = ''; // フォーム切り替え時はAI回答欄はクリアしない方が良い場合もあるのでコメントアウト
    }

    clearFormBtn.addEventListener('click', () => {
        if (confirm('現在の入力内容を破棄しますか？')) {
            clearAllFormsAndState();
            updateFormVisibility(); // フォームの表示状態をリセット
        }
    });


    // --- データ表示 ---
    function renderDataList() {
        dataListContainer.innerHTML = '';
        if (dataStore.length === 0) {
            dataListContainer.innerHTML = '<p>保存されているデータはありません。</p>';
            return;
        }

        dataStore.slice().reverse().forEach(item => { // 新しいものが上にくるように反転
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('data-item');
            itemDiv.dataset.id = item.id;

            let content = `<h4>タスクタイプ: ${getTaskTypeName(item.type)} (ID: ${item.id})</h4>`;
            switch (item.type) {
                case 'correction':
                    content += `<p><strong>日本語:</strong> ${escapeHtml(item.japaneseText)}</p>`;
                    content += `<p><strong>中国語訳:</strong> ${escapeHtml(item.chineseTranslation)}</p>`;
                    break;
                case 'composition':
                    content += `<p><strong>日本語原文:</strong> ${escapeHtml(item.japaneseTextForComposition)}</p>`;
                    break;
                case 'explanation':
                    content += `<p><strong>質問(中国語):</strong> ${escapeHtml(item.chineseQueryText)}</p>`;
                    break;
            }
            content += `<p><strong>AIの回答:</strong> ${escapeHtml(item.aiResponse)}</p>`;
            
            const editBtn = document.createElement('button');
            editBtn.classList.add('edit-btn');
            editBtn.textContent = '編集';
            editBtn.addEventListener('click', () => loadItemForEditing(item.id));

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn');
            deleteBtn.textContent = '削除';
            deleteBtn.addEventListener('click', () => deleteItem(item.id));
            
            itemDiv.innerHTML = content;
            itemDiv.appendChild(editBtn);
            itemDiv.appendChild(deleteBtn);
            dataListContainer.appendChild(itemDiv);
        });
    }

    function getTaskTypeName(typeKey) {
        switch (typeKey) {
            case 'correction': return '中国語文章の添削依頼';
            case 'composition': return '中国語の作文依頼';
            case 'explanation': return '日本語訳・文法説明依頼';
            default: return '不明なタスク';
        }
    }
    
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
             .replace(/&/g, "&")
             .replace(/</g, "<")
             .replace(/>/g, ">")
            //  .replace(/"/g, """)
             .replace(/"/g, '"')
             .replace(/'/g, "'");
    }

    // --- データ編集 ---
    function loadItemForEditing(id) {
        const item = dataStore.find(d => d.id === id);
        if (!item) return;

        clearAllFormsAndState(); // まずフォームをクリア

        taskTypeSelect.value = item.type;
        updateFormVisibility(); // 正しいフォームを表示

        switch (item.type) {
            case 'correction':
                correctionJapaneseText.value = item.japaneseText || '';
                correctionChineseTranslation.value = item.chineseTranslation || '';
                break;
            case 'composition':
                compositionJapaneseText.value = item.japaneseTextForComposition || '';
                break;
            case 'explanation':
                explanationChineseQuery.value = item.chineseQueryText || '';
                break;
        }
        aiResponseArea.value = item.aiResponse || '';
        editingItemIdInput.value = id;
        saveDataBtn.textContent = '変更を保存';
        clearFormBtn.style.display = 'inline-block';
        
        // 編集対象のアイテムまでスクロール
        const formElement = document.querySelector('.task-selector');
        if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // --- データ削除 ---
    function deleteItem(id) {
        if (confirm('このデータを削除してもよろしいですか？')) {
            dataStore = dataStore.filter(item => item.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dataStore));
            renderDataList();
            // もし削除したアイテムが編集中だったらフォームをクリア
            if (editingItemIdInput.value === id) {
                clearAllFormsAndState();
            }
            alert('データを削除しました。');
        }
    }

    // --- 初期化 ---
    updateFormVisibility();
    renderDataList();
});