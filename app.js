// app.js
// クイズの状態管理・正誤判定・画面の動きを制御するロジック

const { createApp } = Vue;

// 間違えた問題のID一覧をブラウザに保存しておくためのキー
const WRONG_IDS_STORAGE_KEY = 'hsk4_wrong_question_ids';

// localStorageから「間違えた問題のID一覧」を読み込む
function loadWrongIds() {
  try {
    const raw = localStorage.getItem(WRONG_IDS_STORAGE_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids : [];
  } catch (e) {
    // 保存データが壊れていた場合は空の状態から始める
    return [];
  }
}

// 「間違えた問題のID一覧」をlocalStorageに保存する
function saveWrongIds(ids) {
  try {
    localStorage.setItem(WRONG_IDS_STORAGE_KEY, JSON.stringify(ids));
  } catch (e) {
    // 保存に失敗しても学習自体は続けられるようにする(何もしない)
  }
}

createApp({
  data() {
    return {
      allQuestions: window.QUESTIONS,   // questions.jsの全問題
      activeQuestions: [],              // 現在の学習セッションで使う問題(全問 or 苦手問題のみ)
      wrongIds: loadWrongIds(),         // これまでに一度でも間違えたことがある問題のID一覧

      screen: 'menu',                   // 'menu' | 'quiz' | 'finished'
      currentIndex: 0,                  // 現在の問題番号(0始まり)
      userInput: '',                    // ユーザーがタイピングした文字
      checked: false,                   // 現在の問題を判定済みかどうか
      isCorrect: false,                 // 直前の判定結果
      score: 0,                         // このセッションで正解した数
      answeredCount: 0                  // このセッションで解答した数
    };
  },

  computed: {
    // 現在表示している問題
    currentQuestion() {
      return this.activeQuestions[this.currentIndex];
    },

    // 進捗バーのパーセンテージ
    progressPercent() {
      if (this.activeQuestions.length === 0) return 0;
      return Math.round((this.currentIndex / this.activeQuestions.length) * 100);
    },

    // 入力欄の見た目の幅(正解の文字数に合わせて自然な長さにする)
    inputWidth() {
      const len = this.currentQuestion ? this.currentQuestion.answer.length : 2;
      return Math.max(len * 1.3, 2.2) + 'em';
    },

    // 入力欄の下線の色(未回答/正解/不正解で色を変える)
    inputBorderClass() {
      if (!this.checked) {
        return 'border-amber-300 focus:border-red-500';
      }
      return this.isCorrect ? 'border-green-500' : 'border-red-500';
    },

    // 現在保存されている「苦手問題」の数(メニュー画面に表示する)
    wrongCount() {
      return this.wrongIds.length;
    }
  },

  methods: {
    // 「全問学習」ボタン: 全ての問題を順番に出題する
    startAllQuestions() {
      this.activeQuestions = this.allQuestions.slice();
      this.beginSession();
    },

    // 「苦手問題を復習」ボタン: これまで間違えた問題だけを出題する
    startReview() {
      if (this.wrongIds.length === 0) return;
      this.activeQuestions = this.allQuestions.filter((q) =>
        this.wrongIds.includes(q.id)
      );
      this.beginSession();
    },

    // 出題セッションを開始する共通処理
    beginSession() {
      this.currentIndex = 0;
      this.score = 0;
      this.answeredCount = 0;
      this.screen = 'quiz';
      this.resetQuestionState();
    },

    // Enterキーが押されたときの処理
    // まだ判定していなければ判定し、判定済みなら次の問題へ進む
    handleEnter() {
      if (!this.checked) {
        this.checkAnswer();
      } else {
        this.nextQuestion();
      }
    },

    // 入力内容を正解と比較して判定する
    checkAnswer() {
      const trimmed = this.userInput.trim();
      if (trimmed.length === 0) return;

      const q = this.currentQuestion;
      const acceptableAnswers = q.acceptable && q.acceptable.length > 0
        ? q.acceptable
        : [q.answer];

      this.isCorrect = acceptableAnswers.includes(trimmed);
      this.checked = true;
      this.answeredCount++;

      if (this.isCorrect) {
        this.score++;
      }

      // 正誤に応じて「苦手問題リスト」を更新する
      this.updateWrongIds(q.id, this.isCorrect);
    },

    // 苦手問題リスト(間違えた問題のID一覧)を更新して保存する
    updateWrongIds(questionId, isCorrect) {
      const idx = this.wrongIds.indexOf(questionId);
      if (isCorrect) {
        // 正解できたら苦手リストから外す
        if (idx !== -1) {
          this.wrongIds.splice(idx, 1);
          saveWrongIds(this.wrongIds);
        }
      } else {
        // 不正解だったら苦手リストに追加する(重複は追加しない)
        if (idx === -1) {
          this.wrongIds.push(questionId);
          saveWrongIds(this.wrongIds);
        }
      }
    },

    // 次の問題へ進む(最後の問題なら終了画面を表示)
    nextQuestion() {
      if (this.currentIndex + 1 >= this.activeQuestions.length) {
        this.screen = 'finished';
        return;
      }
      this.currentIndex++;
      this.resetQuestionState();
    },

    // 入力欄などの状態をリセットして、次の問題の入力にフォーカスする
    resetQuestionState() {
      this.userInput = '';
      this.checked = false;
      this.isCorrect = false;
      this.$nextTick(() => {
        if (this.$refs.answerInput) {
          this.$refs.answerInput.focus();
        }
      });
    },

    // 同じセット(全問 or 苦手問題)をもう一度挑戦する
    restartSameSet() {
      this.beginSession();
    },

    // メニュー画面に戻る
    backToMenu() {
      this.screen = 'menu';
    }
  }
}).mount('#app');
