// app.js
// クイズの状態管理・正誤判定・画面の動きを制御するロジック

const { createApp } = Vue;

createApp({
  data() {
    return {
      questions: window.QUESTIONS, // questions.jsから読み込んだ問題データ
      currentIndex: 0,             // 現在の問題番号(0始まり)
      userInput: '',               // ユーザーがタイピングした文字
      checked: false,              // 現在の問題を判定済みかどうか
      isCorrect: false,            // 直前の判定結果
      score: 0,                    // 正解した数
      answeredCount: 0,            // 解答した数(判定した数)
      isFinished: false            // 全問終了したかどうか
    };
  },

  computed: {
    // 現在表示している問題
    currentQuestion() {
      return this.questions[this.currentIndex];
    },

    // 進捗バーのパーセンテージ
    progressPercent() {
      return Math.round((this.currentIndex / this.questions.length) * 100);
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
    }
  },

  methods: {
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
    },

    // 次の問題へ進む(最後の問題なら終了画面を表示)
    nextQuestion() {
      if (this.currentIndex + 1 >= this.questions.length) {
        this.isFinished = true;
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

    // 最初から挑戦し直す
    restart() {
      this.currentIndex = 0;
      this.score = 0;
      this.answeredCount = 0;
      this.isFinished = false;
      this.resetQuestionState();
    }
  },

  mounted() {
    // アプリ起動時に入力欄へ自動でフォーカスする
    this.$nextTick(() => {
      if (this.$refs.answerInput) {
        this.$refs.answerInput.focus();
      }
    });
  }
}).mount('#app');
