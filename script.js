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
    const backupDataBtn = document.getElementById('backup-data-btn');

    const correctionJapaneseText = document.getElementById('correction-japanese-text');
    const correctionChineseTranslation = document.getElementById('correction-chinese-translation');
    const compositionJapaneseText = document.getElementById('composition-japanese-text');
    const explanationChineseQuery = document.getElementById('explanation-chinese-query');

    const correctionGeneratePromptBtn = document.getElementById('correction-generate-prompt-btn');
    const compositionGeneratePromptBtn = document.getElementById('composition-generate-prompt-btn');
    const explanationGeneratePromptBtn = document.getElementById('explanation-generate-prompt-btn');

    const STORAGE_KEY = 'chineseLearningAppData';
    let dataStore = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    function updateFormVisibility() {
        const selectedType = taskTypeSelect.value;
        for (const type in forms) {
            forms[type].style.display = (type === selectedType) ? 'block' : 'none';
        }
        clearPromptAndResponse();
    }

    taskTypeSelect.addEventListener('change', updateFormVisibility);

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
                prompt = `役割： あなたは中国語学習の先生です。私はあなたの生徒です。私が書いた中国語の作文を添削してください。\n作文： ${userText}\n上記の形式で作文の文章をあなたに渡します。\n以下の項目で添削してください。\n添削基準：\n（１）　作文の内容を理解できるか？\n（２）　作文に中国語の文法に誤りがあれば指摘してください。\n（３）　文法の誤りを正した中国語文章も提示してください。\n（４）　文章でより良い表現があれば、中国語で提案してください。\n添削結果： 添削結果を出力してください。\n作文： `;
                break;
            case 'composition':
                userText = compositionJapaneseText.value.trim();
                 if (!userText) {
                    alert('「中国語に翻訳したい日本語の文章」を入力してください。');
                    return;
                }
                prompt = `役割： あなたは中国語学習の先生です。私はあなたの生徒です。中国語はまだ初心者です。私が書いた日本語文章をできるだけ簡単な中国語を使用して中国語に翻訳してください。\n日本語文章:　${userText}`;
                break;
            case 'explanation':
                userText = explanationChineseQuery.value.trim();
                if (!userText) {
                    alert('「AIに尋ねたい中国語の文章」を入力してください。');
                    return;
                }
                prompt = `役割： あなたは中国語学習の先生です。私はあなたの生徒です。私の疑問を日本語で回答してください。\n疑問内容:　${userText}`;
                break;
        }
        generatedPromptArea.value = prompt;
    }

    correctionGeneratePromptBtn.addEventListener('click', generatePrompt);
    compositionGeneratePromptBtn.addEventListener('click', generatePrompt);
    explanationGeneratePromptBtn.addEventListener('click', generatePrompt);

    copyPromptBtn.addEventListener('click', () => {
        if (generatedPromptArea.value) {
            navigator.clipboard.writeText(generatedPromptArea.value)
                .then(() => alert('依頼文章をクリップボードにコピーしました。'))
                .catch(err => {
                    console.error('依頼文章のコピーに失敗しました: ', err);
                    alert('依頼文章のコピーに失敗しました。コンソールを確認してください。');
                });
        } else {
            alert('コピーする依頼文章がありません。');
        }
    });

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

        if (editingId) {
            const index = dataStore.findIndex(item => item.id === editingId);
            if (index > -1) {
                dataStore[index] = { ...dataStore[index], ...itemData, aiResponse, updatedAt: new Date().toISOString() };
                alert('データを更新しました。');
            }
        } else {
            itemData.id = Date.now().toString();
            itemData.createdAt = new Date().toISOString();
            itemData.updatedAt = new Date().toISOString();
            dataStore.push(itemData);
            alert('データを保存しました。');
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataStore));
        renderDataList();
        clearAllFormsAndState();
    });
    
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
        // 編集中のアイテムがフォームにロードされている状態を解除
        const currentlyEditingItem = document.querySelector('.data-item.editing-in-form');
        if (currentlyEditingItem) {
            currentlyEditingItem.classList.remove('editing-in-form');
        }
    }

    function clearPromptAndResponse() {
        generatedPromptArea.value = '';
    }

    clearFormBtn.addEventListener('click', () => {
        if (confirm('現在の入力内容を破棄しますか？')) {
            clearAllFormsAndState();
            updateFormVisibility();
        }
    });

    // --- データ表示 (一覧) ---
    function renderDataList() {
        dataListContainer.innerHTML = '';
        if (dataStore.length === 0) {
            dataListContainer.innerHTML = '<p>保存されているデータはありません。</p>';
            return;
        }

        const sortedData = [...dataStore].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        sortedData.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('data-item');
            itemDiv.dataset.id = item.id;

            // --- サマリー表示部分 ---
            const summaryView = document.createElement('div');
            summaryView.classList.add('summary-view');
            
            let summaryTitle = `<h4>タスク: ${getTaskTypeName(item.type)} (ID: ${item.id.slice(-5)})</h4>`;
            let summaryItemContent = document.createElement('div');
            summaryItemContent.classList.add('item-content');

            const aiResponseSummaryText = item.aiResponse ? (item.aiResponse.length > 70 ? item.aiResponse.substring(0, 70) + "..." : item.aiResponse) : "未回答";
            let summaryText = '';
            switch (item.type) {
                case 'correction':
                    summaryText += `<p><strong>日本語:</strong> ${escapeHtml(item.japaneseText.substring(0,50))}...</p>`;
                    summaryText += `<p><strong>中国語訳:</strong> ${escapeHtml(item.chineseTranslation.substring(0,50))}...</p>`;
                    break;
                case 'composition':
                    summaryText += `<p><strong>日本語原文:</strong> ${escapeHtml(item.japaneseTextForComposition.substring(0,70))}...</p>`;
                    break;
                case 'explanation':
                    summaryText += `<p><strong>質問(中国語):</strong> ${escapeHtml(item.chineseQueryText.substring(0,70))}...</p>`;
                    break;
            }
            summaryItemContent.innerHTML = summaryText;
            summaryView.innerHTML = summaryTitle;
            summaryView.appendChild(summaryItemContent);
            summaryView.innerHTML += `<p class="ai-response-summary"><strong>AIの回答:</strong> ${escapeHtml(aiResponseSummaryText)}</p>`;

            // --- 詳細表示部分 ---
            const detailView = document.createElement('div');
            detailView.classList.add('detail-view');

            let detailTitle = `<h4>タスク: ${getTaskTypeName(item.type)} (ID: ${item.id})</h4>`; // 詳細ではフルID
            let detailItemContent = '';
             switch (item.type) {
                case 'correction':
                    detailItemContent += `<p><strong>日本語:</strong><br>${escapeHtml(item.japaneseText)}</p>`;
                    detailItemContent += `<p><strong>中国語訳:</strong><br>${escapeHtml(item.chineseTranslation)}</p>`;
                    break;
                case 'composition':
                    detailItemContent += `<p><strong>日本語原文:</strong><br>${escapeHtml(item.japaneseTextForComposition)}</p>`;
                    break;
                case 'explanation':
                    detailItemContent += `<p><strong>質問(中国語):</strong><br>${escapeHtml(item.chineseQueryText)}</p>`;
                    break;
            }
            detailItemContent += `<p><strong>AIの回答:</strong><br>${escapeHtml(item.aiResponse || '未回答')}</p>`;
            detailView.innerHTML = detailTitle + detailItemContent;

            // --- アクションボタン部分 ---
            const actionsDiv = document.createElement('div');
            actionsDiv.classList.add('actions');

            const editBtn = document.createElement('button');
            editBtn.classList.add('edit-btn');
            editBtn.textContent = '編集'; // ボタン名を「編集」に戻す
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                loadItemForEditing(item.id); // 編集ボタンでフォームにロード
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn');
            deleteBtn.textContent = '削除';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteItem(item.id);
            });
            
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);

            // --- 要素の組み立てとイベントリスナー ---
            itemDiv.appendChild(summaryView);
            itemDiv.appendChild(detailView);
            itemDiv.appendChild(actionsDiv); // アクションボタンは常に表示

            itemDiv.addEventListener('click', (event) => {
                // ボタン自身がクリックされた場合は、トグル処理をしない
                if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {
                    return;
                }
                // 他の開いているアイテムを閉じる
                document.querySelectorAll('.data-item.expanded').forEach(openItem => {
                    if (openItem !== itemDiv) {
                        openItem.classList.remove('expanded');
                    }
                });
                // クリックされたアイテムの表示をトグル
                itemDiv.classList.toggle('expanded');
            });
            
            dataListContainer.appendChild(itemDiv);
        });
    }

    function getTaskTypeName(typeKey) {
        switch (typeKey) {
            case 'correction': return '文章添削';
            case 'composition': return '作文依頼';
            case 'explanation': return '翻訳・文法説明';
            default: return '不明';
        }
    }
    
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return String(unsafe);
        return unsafe
             .replace(/&/g, "&")
             .replace(/</g, "<")
             .replace(/>/g, ">")
             .replace(/"/g, '"')
             .replace(/'/g, "'");
    }

    // --- データ編集 (フォームへの読み込み) ---
    function loadItemForEditing(id) {
        const item = dataStore.find(d => d.id === id);
        if (!item) return;

        // 他のアイテムが編集中なら解除
        const currentlyEditingItemInForm = document.querySelector('.data-item.editing-in-form');
        if (currentlyEditingItemInForm) {
            currentlyEditingItemInForm.classList.remove('editing-in-form');
        }
        // 現在編集対象のアイテムに目印をつける (任意)
        const itemElement = document.querySelector(`.data-item[data-id="${id}"]`);
        if (itemElement) {
            itemElement.classList.add('editing-in-form');
        }


        clearAllFormsAndState(); 

        taskTypeSelect.value = item.type;
        updateFormVisibility(); 

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
            if (editingItemIdInput.value === id) { // もし削除したアイテムが編集中だったらフォームもクリア
                clearAllFormsAndState();
            }
            alert('データを削除しました。');
        }
    }

    // --- localStorageバックアップ ---
    backupDataBtn.addEventListener('click', () => {
        if (dataStore.length === 0) {
            alert('バックアップするデータがありません。');
            return;
        }

        const backupDate = new Date().toLocaleString('ja-JP');
        let markdownContent = `# 中国語学習アシスタント データバックアップ (${backupDate})\n\n`;

        // 更新日時順にソートしてバックアップ
        const sortedDataForBackup = [...dataStore].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        sortedDataForBackup.forEach(item => {
            markdownContent += `## タスク: ${getTaskTypeName(item.type)} (ID: ${item.id})\n`;
            markdownContent += `- 作成日時: ${item.createdAt ? new Date(item.createdAt).toLocaleString('ja-JP') : '不明'}\n`;
            markdownContent += `- 更新日時: ${item.updatedAt ? new Date(item.updatedAt).toLocaleString('ja-JP') : '不明'}\n\n`;

            switch (item.type) {
                case 'correction':
                    markdownContent += `**日本語文章:**\n\`\`\`\n${item.japaneseText || ''}\n\`\`\`\n\n`;
                    markdownContent += `**中国語訳した文章:**\n\`\`\`\n${item.chineseTranslation || ''}\n\`\`\`\n\n`;
                    break;
                case 'composition':
                    markdownContent += `**翻訳したい日本語の文章:**\n\`\`\`\n${item.japaneseTextForComposition || ''}\n\`\`\`\n\n`;
                    break;
                case 'explanation':
                    markdownContent += `**AIに尋ねたい中国語の文章:**\n\`\`\`\n${item.chineseQueryText || ''}\n\`\`\`\n\n`;
                    break;
            }
            markdownContent += `**AIの回答:**\n\`\`\`\n${item.aiResponse || '未回答'}\n\`\`\`\n\n`;
            markdownContent += "---\n\n";
        });

        navigator.clipboard.writeText(markdownContent)
            .then(() => alert('全データをマークダウン形式でクリップボードにコピーしました。'))
            .catch(err => {
                console.error('バックアップデータのコピーに失敗しました: ', err);
                alert('バックアップデータのコピーに失敗しました。コンソールを確認してください。');
            });
    });

    // --- 初期化 ---
    updateFormVisibility();
    renderDataList();
});