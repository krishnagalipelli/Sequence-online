const SUITS = ['S', 'H', 'C', 'D'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'Q', 'K'];
const JACKS = {
  TWO_EYED: ['JD', 'JC'], // Wild - place anywhere
  ONE_EYED: ['JS', 'JH']  // Remove opponent's chip
};

// Generate standard cards (no jacks)
const STANDARD_CARDS = [];
for (let suit of SUITS) {
  for (let rank of RANKS) {
    STANDARD_CARDS.push(rank + suit);
  }
}

function generateBoard() {
  const layout = Array(10).fill(null).map(() => Array(10).fill(null));
  layout[0][0] = 'WILD';
  layout[0][9] = 'WILD';
  layout[9][0] = 'WILD';
  layout[9][9] = 'WILD';

  let cards = [...STANDARD_CARDS, ...STANDARD_CARDS];
  // Shuffle cards for a random but valid layout
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  let cardIndex = 0;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (layout[r][c] === 'WILD') continue;
      layout[r][c] = cards[cardIndex++];
    }
  }
  return layout;
}

const FIXED_BOARD = generateBoard();

class SequenceGame {
  constructor() {
    this.boardLayout = FIXED_BOARD;
    this.boardState = Array(10).fill(null).map(() => Array(10).fill(null)); // null, 0, or 1 (player id)
    this.deck = this.generateDeck();
    this.players = []; // Array of socket ids or objects
    this.turn = 0; // Index of players array
    this.hands = {}; // playerId -> array of cards
    this.started = false;
    this.winner = null;
    this.sequencesToWin = 2;
    this.playersCount = 2;
  }

  generateDeck() {
    let deck = [];
    for (let i = 0; i < 2; i++) { // 2 decks
      deck.push(...STANDARD_CARDS);
      deck.push(...JACKS.TWO_EYED);
      deck.push(...JACKS.ONE_EYED);
    }
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  addPlayer(playerId) {
    if (this.players.length < this.playersCount && !this.players.includes(playerId)) {
      this.players.push(playerId);
      this.hands[playerId] = [];
      return true;
    }
    return false;
  }

  removePlayer(playerId) {
    const idx = this.players.indexOf(playerId);
    if (idx !== -1) {
      this.players.splice(idx, 1);
      delete this.hands[playerId];
      this.started = false;
      return true;
    }
    return false;
  }

  startGame() {
    if (this.players.length === this.playersCount) {
      this.started = true;
      this.boardState = Array(10).fill(null).map(() => Array(10).fill(null));
      this.deck = this.generateDeck();
      this.winner = null;
      this.turn = Math.floor(Math.random() * this.playersCount);
      
      const cardsToDeal = this.playersCount === 3 ? 6 : 7;
      for (let i = 0; i < this.playersCount; i++) {
        this.hands[this.players[i]] = this.deck.splice(0, cardsToDeal);
      }
      return true;
    }
    return false;
  }

  isValidMove(playerId, cardPlayed, row, col) {
    if (!this.started || this.winner || this.players[this.turn] !== playerId) return false;
    
    const cardIndex = this.hands[playerId].indexOf(cardPlayed);
    if (cardIndex === -1) return false;

    const boardCard = this.boardLayout[row][col];
    const currentChip = this.boardState[row][col];

    if (boardCard === 'WILD') return false;

    if (JACKS.TWO_EYED.includes(cardPlayed)) {
      return currentChip === null;
    }

    if (JACKS.ONE_EYED.includes(cardPlayed)) {
      const lockedBoard = this.getLockedBoard();
      if (lockedBoard[row][col]) return false;

      return currentChip !== null && currentChip !== this.players.indexOf(playerId);
    }

    return boardCard === cardPlayed && currentChip === null;
  }

  playMove(playerId, cardPlayed, row, col) {
    if (!this.isValidMove(playerId, cardPlayed, row, col)) return false;

    const cardIndex = this.hands[playerId].indexOf(cardPlayed);
    this.hands[playerId].splice(cardIndex, 1);

    const playerIndex = this.players.indexOf(playerId);

    if (JACKS.ONE_EYED.includes(cardPlayed)) {
      this.boardState[row][col] = null;
    } else {
      this.boardState[row][col] = playerIndex;
    }

    if (this.deck.length > 0) {
      this.hands[playerId].push(this.deck.pop());
    }

    if (this.checkWin(playerIndex)) {
      this.winner = playerId;
    } else {
      this.turn = (this.turn + 1) % this.playersCount;
    }

    return true;
  }

  isPlayerOrWild(playerIndex, r, c) {
    if (r < 0 || r > 9 || c < 0 || c > 9) return false;
    if (this.boardLayout[r][c] === 'WILD') return true;
    return this.boardState[r][c] === playerIndex;
  }

  countSequences(playerIndex) {
    let seqs = 0;
    let usedH = Array(10).fill(null).map(() => Array(10).fill(false));
    let usedV = Array(10).fill(null).map(() => Array(10).fill(false));
    let usedD1 = Array(10).fill(null).map(() => Array(10).fill(false));
    let usedD2 = Array(10).fill(null).map(() => Array(10).fill(false));

    for (let r = 0; r < 10; r++) {
      let count = 0;
      for (let c = 0; c < 10; c++) {
        if (this.isPlayerOrWild(playerIndex, r, c) && !usedH[r][c]) {
          count++;
          if (count === 5) {
            seqs++;
            count = 0;
            for(let i=0; i<5; i++) usedH[r][c-i] = true;
          }
        } else count = 0;
      }
    }

    for (let c = 0; c < 10; c++) {
      let count = 0;
      for (let r = 0; r < 10; r++) {
        if (this.isPlayerOrWild(playerIndex, r, c) && !usedV[r][c]) {
          count++;
          if (count === 5) {
            seqs++;
            count = 0;
            for(let i=0; i<5; i++) usedV[r-i][c] = true;
          }
        } else count = 0;
      }
    }

    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        let count = 0;
        for (let i = 0; i < 5; i++) {
            if (this.isPlayerOrWild(playerIndex, r+i, c+i) && !usedD1[r+i][c+i]) count++;
            else break;
        }
        if (count === 5) {
          seqs++;
          for (let i = 0; i < 5; i++) usedD1[r+i][c+i] = true;
        }
      }
    }

      for (let r = 4; r < 10; r++) {
        for (let c = 0; c < 6; c++) {
          let count = 0;
          for (let i = 0; i < 5; i++) {
              if (this.isPlayerOrWild(playerIndex, r-i, c+i) && !usedD2[r-i][c+i]) count++;
              else break;
          }
          if (count === 5) {
            seqs++;
            for (let i = 0; i < 5; i++) usedD2[r-i][c+i] = true;
          }
        }
      }

      let lockedCells = Array(10).fill(null).map(() => Array(10).fill(false));
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          if (usedH[r][c] || usedV[r][c] || usedD1[r][c] || usedD2[r][c]) {
            lockedCells[r][c] = true;
          }
        }
      }

      return { seqs, lockedCells };
  }

  getLockedBoard() {
    let combinedLocked = Array(10).fill(null).map(() => Array(10).fill(false));
    for (let p = 0; p < this.playersCount; p++) {
      const { lockedCells } = this.countSequences(p);
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          if (lockedCells[r][c]) combinedLocked[r][c] = true;
        }
      }
    }
    return combinedLocked;
  }

  checkWin(playerIndex) {
    return this.countSequences(playerIndex).seqs >= this.sequencesToWin;
  }

  getScores() {
    if (!this.started) return Array(this.playersCount).fill(0);
    return this.players.map((_, i) => this.countSequences(i).seqs);
  }

  getGameState(playerId) {
    return {
      started: this.started,
      boardLayout: this.boardLayout,
      boardState: this.boardState,
      turn: this.turn,
      winner: this.winner,
      myHand: this.hands[playerId] || [],
      players: this.players,
      playerIndex: this.players.indexOf(playerId),
      sequencesToWin: this.sequencesToWin,
      playersCount: this.playersCount,
      scores: this.getScores()
    };
  }
}

module.exports = SequenceGame;
